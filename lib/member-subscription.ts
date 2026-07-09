import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { getDb, newId, memberSubscriptions, memberPayments, type MemberSubscription } from '@/lib/db';
import { stripeConfigured, stripeRequest } from '@/lib/billing/provider';
import { getPlan } from '@/lib/site-plans';

// Platform-managed member subscriptions (Variant A): every member pays on the
// PLATFORM's single Stripe account — org admins never configure Stripe. The
// Checkout uses inline price_data from the plan (no connected account, no
// per-account Price sync). Each collected payment is tagged with the org
// (siteId) into member_payments so the superadmin can see per-org revenue and
// settle payouts (see lib/org-billing.ts).

export type CheckoutError = 'not_configured' | 'no_plan';

/** Does this member currently have an access-granting (active) subscription? */
export function hasActiveMemberSubscription(siteId: string, siteUserId: string): boolean {
  const row = getDb()
    .select({ id: memberSubscriptions.id })
    .from(memberSubscriptions)
    .where(and(
      eq(memberSubscriptions.siteId, siteId),
      eq(memberSubscriptions.siteUserId, siteUserId),
      eq(memberSubscriptions.status, 'active'),
    ))
    .get();
  return Boolean(row);
}

/** The member's latest subscription row (any status), or null. */
export function latestMemberSubscription(siteId: string, siteUserId: string): MemberSubscription | null {
  return getDb()
    .select()
    .from(memberSubscriptions)
    .where(and(eq(memberSubscriptions.siteId, siteId), eq(memberSubscriptions.siteUserId, siteUserId)))
    .orderBy(desc(memberSubscriptions.createdAt))
    .get() ?? null;
}

/** A member subscription by Stripe subscription id, or null. */
export function getMemberSubscriptionByProviderSub(providerSubId: string): MemberSubscription | null {
  if (!providerSubId) return null;
  return getDb()
    .select()
    .from(memberSubscriptions)
    .where(eq(memberSubscriptions.providerSubId, providerSubId))
    .get() ?? null;
}

/**
 * Create a Stripe Checkout Session (mode=subscription) on the PLATFORM account
 * for a member to subscribe to a plan. Uses inline price_data so no Stripe
 * setup is needed from the org admin. Returns the hosted URL.
 */
export async function createMemberCheckout(opts: {
  siteId: string;
  siteUser: { id: string; email: string };
  planId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: CheckoutError }> {
  if (!stripeConfigured()) return { ok: false, error: 'not_configured' };
  const plan = getPlan(opts.siteId, opts.planId);
  if (!plan || !plan.active || plan.amountCents <= 0) return { ok: false, error: 'no_plan' };

  const session = await stripeRequest<{ id: string; url: string }>('/checkout/sessions', {
    mode: 'subscription',
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    customer_email: opts.siteUser.email,
    client_reference_id: opts.siteUser.id,
    'line_items': [{
      quantity: 1,
      price_data: {
        currency: plan.currency,
        unit_amount: plan.amountCents,
        recurring: { interval: plan.interval === 'year' ? 'year' : 'month' },
        product_data: { name: plan.name || 'Membership' },
      },
    }],
    'metadata[siteId]': opts.siteId,
    'metadata[siteUserId]': opts.siteUser.id,
    'metadata[planId]': opts.planId,
    'subscription_data': {
      'metadata[siteId]': opts.siteId,
      'metadata[siteUserId]': opts.siteUser.id,
      'metadata[planId]': opts.planId,
    },
  });
  return { ok: true, url: session.url };
}

interface RetrievedSession {
  payment_status?: string;
  status?: string;
  amount_total?: number;
  currency?: string;
  metadata?: Record<string, string>;
  subscription?: { id?: string; status?: string; current_period_end?: number } | string | null;
}

/**
 * Reconcile a returned Checkout Session (on the platform account): if paid,
 * activate the member's subscription AND record the collected payment tagged
 * by org. Idempotent (subscription keyed by Stripe sub id; payment by session id).
 */
export async function confirmMemberCheckout(
  siteId: string,
  sessionId: string,
): Promise<{ ok: boolean; active: boolean }> {
  if (!stripeConfigured() || !sessionId) return { ok: false, active: false };

  const session = await stripeRequest<RetrievedSession>(
    `/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,
  ).catch(() => null);
  if (!session) return { ok: false, active: false };

  const paid = session.payment_status === 'paid' || session.status === 'complete';
  const sub = typeof session.subscription === 'object' && session.subscription ? session.subscription : null;
  const subId = sub?.id ?? (typeof session.subscription === 'string' ? session.subscription : undefined);
  const meta = session.metadata ?? {};
  const siteUserId = meta.siteUserId;
  const planId = meta.planId ?? '';
  if (!paid || !subId || !siteUserId || meta.siteId !== siteId) return { ok: true, active: false };

  upsertActiveSubscription({
    siteId,
    siteUserId,
    planId,
    providerSubId: subId,
    currentPeriodEnd: sub?.current_period_end ? new Date(sub.current_period_end * 1000) : null,
  });
  // Record the collected revenue for this org (idempotent by session id).
  recordMemberPayment({
    siteId,
    siteUserId,
    planId,
    amountCents: typeof session.amount_total === 'number' ? session.amount_total : 0,
    currency: (session.currency || 'usd').toLowerCase(),
    providerRef: sessionId,
  });
  return { ok: true, active: true };
}

/** Insert or update the member's subscription as active (idempotent by sub id). */
export function upsertActiveSubscription(row: {
  siteId: string;
  siteUserId: string;
  planId: string;
  providerSubId: string;
  currentPeriodEnd: Date | null;
}): void {
  upsertMemberSubscription({ ...row, status: 'active' });
}

/** Insert or update the member's subscription by provider id. */
export function upsertMemberSubscription(row: {
  siteId: string;
  siteUserId: string;
  planId: string;
  providerSubId: string;
  status: 'active' | 'past_due' | 'canceled' | 'expired' | 'pending';
  currentPeriodEnd: Date | null;
}): void {
  const db = getDb();
  const now = new Date();
  const existing = db
    .select({ id: memberSubscriptions.id })
    .from(memberSubscriptions)
    .where(eq(memberSubscriptions.providerSubId, row.providerSubId))
    .get();
  if (existing) {
    db.update(memberSubscriptions)
      .set({ status: row.status, planId: row.planId, currentPeriodEnd: row.currentPeriodEnd, updatedAt: now })
      .where(eq(memberSubscriptions.id, existing.id))
      .run();
    return;
  }
  db.insert(memberSubscriptions).values({
    id: newId('msub'),
    siteId: row.siteId,
    siteUserId: row.siteUserId,
    planId: row.planId,
    status: row.status,
    provider: 'stripe',
    providerSubId: row.providerSubId,
    currentPeriodEnd: row.currentPeriodEnd,
    createdAt: now,
    updatedAt: now,
  }).run();
}

/** Record a collected member payment (idempotent by providerRef). */
export function recordMemberPayment(row: {
  siteId: string;
  siteUserId: string;
  planId: string;
  amountCents: number;
  currency: string;
  providerRef: string;
}): void {
  if (!row.providerRef || row.amountCents <= 0) return;
  const db = getDb();
  const existing = db
    .select({ id: memberPayments.id })
    .from(memberPayments)
    .where(eq(memberPayments.providerRef, row.providerRef))
    .get();
  if (existing) return; // already recorded (idempotent)
  db.insert(memberPayments).values({
    id: newId('mpay'),
    siteId: row.siteId,
    siteUserId: row.siteUserId,
    planId: row.planId,
    amountCents: row.amountCents,
    currency: row.currency,
    providerRef: row.providerRef,
    createdAt: new Date(),
  }).run();
}

/** Mark a subscription (by provider id) as canceled/expired — for webhooks. */
export function deactivateSubscription(providerSubId: string, status: 'canceled' | 'expired' | 'past_due'): void {
  getDb()
    .update(memberSubscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(memberSubscriptions.providerSubId, providerSubId))
    .run();
}
