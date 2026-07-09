// Success-page reconciliation: create/refresh the local subscription straight
// from a completed Stripe Checkout Session, so a purchase reflects immediately
// even when the webhook hasn't been delivered yet — or can't be (local dev
// without `stripe listen`, a missed/late event, etc.). The webhook remains the
// authoritative path for the full lifecycle (renewals, cancellations); this is
// a safe, idempotent fast-path for the initial activation only.
//
// Idempotency: upsertSubscription matches on providerSubId and recordPayment
// dedupes on providerInvoiceId, so running this alongside the webhook can never
// double-count or fork a subscription.

import 'server-only';
import { retrieveCheckoutSession } from '@/lib/billing/provider';
import { upsertSubscription, recordPayment, getSubscriptionByProviderSub } from '@/lib/billing/subscriptions';
import { isInterval, isPlanId, type BillingInterval, type PlanId } from '@/lib/billing/plans';
import { recordAudit } from '@/lib/audit';

const sec = (n: number | null | undefined) => (n ? new Date(n * 1000) : null);

export interface ReconcileResult {
  ok: boolean;
  planId?: PlanId;
  reason?: string;
}

/**
 * Reconcile a Checkout Session for the signed-in user. Returns { ok: true }
 * when a subscription was created/updated. Verifies the session belongs to the
 * caller (client_reference_id / metadata.userId) before touching any rows.
 */
export async function reconcileCheckoutSession(
  sessionId: string,
  user: { id: string; email: string },
): Promise<ReconcileResult> {
  const session = await retrieveCheckoutSession(sessionId);
  if (!session) return { ok: false, reason: 'not_found' };

  // Only act on a genuinely completed/paid session.
  const paid = session.payment_status === 'paid' || session.status === 'complete';
  if (!paid) return { ok: false, reason: 'not_paid' };

  // Ownership check: the session must belong to the current user.
  const owner = session.metadata?.userId || session.client_reference_id;
  if (owner && owner !== user.id) return { ok: false, reason: 'not_owner' };

  const planId = session.metadata?.planId;
  const metaInterval = session.metadata?.interval;
  if (!isPlanId(planId)) return { ok: false, reason: 'bad_plan' };

  const sub = session.subscription && typeof session.subscription === 'object' ? session.subscription : null;
  const priceInterval = sub?.items?.data?.[0]?.price?.recurring?.interval;
  const interval: BillingInterval = isInterval(metaInterval)
    ? metaInterval
    : isInterval(priceInterval)
      ? priceInterval
      : 'month';

  const providerSubId = sub?.id ?? '';
  // If the webhook already created this subscription, nothing more to do.
  const already = providerSubId ? getSubscriptionByProviderSub(providerSubId) : null;

  const subId = upsertSubscription({
    userId: user.id,
    planId,
    interval,
    status: sub?.status ?? 'active',
    provider: 'stripe',
    providerCustomerId: session.customer ?? '',
    providerSubId,
    currentPeriodStart: sec(sub?.current_period_start),
    currentPeriodEnd: sec(sub?.current_period_end),
    cancelAtPeriodEnd: !!sub?.cancel_at_period_end,
  });

  // Record the initial payment (deduped on the session id as a synthetic
  // invoice ref) so an invoice shows even before invoice.paid arrives.
  if (session.amount_total != null) {
    recordPayment({
      userId: user.id,
      subscriptionId: subId,
      planId,
      amount: session.amount_total,
      currency: session.currency ?? 'usd',
      status: 'paid',
      provider: 'stripe',
      providerInvoiceId: `cs:${session.id}`,
      description: 'Subscription checkout',
    });
  }

  if (!already) {
    recordAudit({ id: user.id, email: user.email }, 'billing.checkout_reconciled', planId, interval);
  }
  return { ok: true, planId };
}
