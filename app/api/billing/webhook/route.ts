import { NextResponse } from 'next/server';
import { verifyStripeSignature } from '@/lib/billing/provider';
import {
  upsertSubscription,
  setSubscriptionStatus,
  cancelSubscription,
  recordPayment,
  markEventProcessed,
  getSubscriptionByProviderSub,
} from '@/lib/billing/subscriptions';
import {
  getMemberSubscriptionByProviderSub,
  upsertMemberSubscription,
  recordMemberPayment,
  deactivateSubscription,
} from '@/lib/member-subscription';
import { isInterval, isPlanId, type BillingInterval, type PlanId } from '@/lib/billing/plans';

export const runtime = 'nodejs';

// Stripe webhook receiver. Verifies the signature (HMAC via node:crypto — no
// SDK), dedupes on the event id (idempotent re-delivery), and reconciles the
// local subscription/payment rows. Auto-renewal "just works": Stripe emits
// invoice.paid on each cycle and we record the payment + extend the period.
//
// Reads the RAW body (request.text) — required for signature verification.

const sec = (n: number | null | undefined) => (n ? new Date(n * 1000) : null);
const subIdOf = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'id' in v && typeof (v as { id?: unknown }).id === 'string') return (v as { id: string }).id;
  return '';
};

const memberStatus = (status: string): 'active' | 'past_due' | 'canceled' | 'expired' | 'pending' => {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due' || status === 'unpaid') return 'past_due';
  if (status === 'canceled') return 'canceled';
  if (status === 'incomplete_expired') return 'expired';
  return 'pending';
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';

  // Fail closed: an unsigned request must never be able to grant plans or
  // record payments, including when production was misconfigured.
  if (!secret) {
    console.error('[billing webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'webhook not configured' }, { status: 503 });
  }
  if (!verifyStripeSignature(raw, sig, secret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 });
  }
  if (!event.id || !event.type) return NextResponse.json({ error: 'bad event' }, { status: 400 });

  // Idempotency: process each event id at most once.
  if (!markEventProcessed(event.id, event.type, 'stripe', raw)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Stripe's event object is untyped external JSON; fields are read defensively.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = (event.data?.object ?? {}) as Record<string, any>;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const meta = obj.metadata ?? {};
        const userId = meta.userId || obj.client_reference_id;
        const planId = meta.planId;
        const interval = meta.interval;
        const siteId = meta.siteId;
        const siteUserId = meta.siteUserId || obj.client_reference_id;
        const providerSubId = subIdOf(obj.subscription);
        if (siteId && siteUserId && planId && providerSubId) {
          upsertMemberSubscription({
            siteId,
            siteUserId,
            planId,
            providerSubId,
            status: 'active',
            currentPeriodEnd: sec(obj.subscription?.current_period_end),
          });
          recordMemberPayment({
            siteId,
            siteUserId,
            planId,
            amountCents: typeof obj.amount_total === 'number' ? obj.amount_total : 0,
            currency: (obj.currency || 'usd').toLowerCase(),
            providerRef: obj.id ?? '',
          });
        } else if (userId && isPlanId(planId) && isInterval(interval)) {
          upsertSubscription({
            userId,
            planId: planId as PlanId,
            interval: interval as BillingInterval,
            status: 'active',
            provider: 'stripe',
            providerCustomerId: obj.customer ?? '',
            providerSubId: obj.subscription ?? '',
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const meta = obj.metadata ?? {};
        const siteId = meta.siteId;
        const siteUserId = meta.siteUserId;
        const providerSubId = obj.id ?? '';
        if (siteId && siteUserId && meta.planId && providerSubId) {
          upsertMemberSubscription({
            siteId,
            siteUserId,
            planId: meta.planId,
            providerSubId,
            status: memberStatus(obj.status ?? 'pending'),
            currentPeriodEnd: sec(obj.current_period_end),
          });
          break;
        }
        const userId = meta.userId;
        const planId = meta.planId;
        const item = obj.items?.data?.[0];
        const interval: string = item?.price?.recurring?.interval ?? 'month';
        if (userId && isPlanId(planId)) {
          upsertSubscription({
            userId,
            planId: planId as PlanId,
            interval: isInterval(interval) ? (interval as BillingInterval) : 'month',
            status: obj.status ?? 'active',
            provider: 'stripe',
            providerCustomerId: obj.customer ?? '',
            providerSubId: obj.id ?? '',
            currentPeriodStart: sec(obj.current_period_start),
            currentPeriodEnd: sec(obj.current_period_end),
            cancelAtPeriodEnd: !!obj.cancel_at_period_end,
          });
        } else {
          const local = getSubscriptionByProviderSub(obj.id ?? '');
          if (local) setSubscriptionStatus(local.id, obj.status ?? local.status);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const providerSubId = obj.id ?? '';
        const member = getMemberSubscriptionByProviderSub(providerSubId);
        if (member) {
          deactivateSubscription(providerSubId, 'canceled');
        } else {
          const local = getSubscriptionByProviderSub(providerSubId);
          if (local) cancelSubscription(local.id, false);
        }
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const providerSubId = subIdOf(obj.subscription);
        const member = getMemberSubscriptionByProviderSub(providerSubId);
        const line = obj.lines?.data?.[0];
        if (member) {
          upsertMemberSubscription({
            siteId: member.siteId,
            siteUserId: member.siteUserId,
            planId: member.planId,
            providerSubId,
            status: 'active',
            currentPeriodEnd: sec(line?.period?.end) ?? member.currentPeriodEnd,
          });
          recordMemberPayment({
            siteId: member.siteId,
            siteUserId: member.siteUserId,
            planId: member.planId,
            amountCents: obj.amount_paid ?? obj.total ?? 0,
            currency: (obj.currency || 'usd').toLowerCase(),
            providerRef: obj.id ?? '',
          });
          break;
        }
        const local = getSubscriptionByProviderSub(providerSubId);
        if (local) {
          recordPayment({
            userId: local.userId,
            subscriptionId: local.id,
            planId: local.planId as PlanId,
            amount: obj.amount_paid ?? obj.total ?? local.amount,
            currency: obj.currency ?? local.currency,
            status: 'paid',
            provider: 'stripe',
            providerInvoiceId: obj.id ?? '',
            description: obj.number ? `Stripe invoice ${obj.number}` : 'Subscription payment',
            periodStart: sec(line?.period?.start),
            periodEnd: sec(line?.period?.end),
          });
          // Extend the active period (auto-renew).
          if (obj.status !== 'canceled') {
            setSubscriptionStatus(local.id, 'active');
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const providerSubId = subIdOf(obj.subscription);
        const member = getMemberSubscriptionByProviderSub(providerSubId);
        if (member) {
          deactivateSubscription(providerSubId, 'past_due');
        } else {
          const local = getSubscriptionByProviderSub(providerSubId);
          if (!local) break;
          setSubscriptionStatus(local.id, 'past_due');
          recordPayment({
            userId: local.userId,
            subscriptionId: local.id,
            planId: local.planId as PlanId,
            amount: obj.amount_due ?? local.amount,
            currency: obj.currency ?? local.currency,
            status: 'failed',
            provider: 'stripe',
            providerInvoiceId: obj.id ?? '',
            description: 'Payment failed',
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // Never 500 the provider on a reconciliation bug — it would retry forever.
    console.error('[billing webhook]', (e as Error).message);
  }

  return NextResponse.json({ received: true });
}
