import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetDb } from './helpers';
import { createUser } from '@/lib/auth';
import { getActiveSubscription, getSubscriptionByProviderSub, listUserPayments } from '@/lib/billing/subscriptions';
import type { StripeCheckoutSession } from '@/lib/billing/provider';

// Mock the Stripe fetch layer so reconcile works offline (no secret key / network).
const retrieveMock = vi.fn<(id: string) => Promise<StripeCheckoutSession | null>>();
vi.mock('@/lib/billing/provider', async (orig) => {
  const actual = await orig<typeof import('@/lib/billing/provider')>();
  return { ...actual, retrieveCheckoutSession: (id: string) => retrieveMock(id) };
});

// Imported AFTER the mock is registered.
const { reconcileCheckoutSession } = await import('@/lib/billing/reconcile');

beforeEach(() => {
  resetDb();
  retrieveMock.mockReset();
});

function makeCustomer(email = 'c@x.com') {
  createUser('owner@x.com', 'pw', 'Owner'); // superadmin bootstrap
  return createUser(email, 'pw', 'Customer');
}

function paidSession(userId: string, over: Partial<StripeCheckoutSession> = {}): StripeCheckoutSession {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: 'cs_test_1',
    payment_status: 'paid',
    status: 'complete',
    customer: 'cus_1',
    client_reference_id: userId,
    metadata: { userId, planId: 'studio', interval: 'year' },
    amount_total: 79000,
    currency: 'usd',
    subscription: {
      id: 'sub_1',
      status: 'active',
      current_period_start: now,
      current_period_end: now + 365 * 864e2 / 1000,
      cancel_at_period_end: false,
      items: { data: [{ price: { recurring: { interval: 'year' } } }] },
    },
    ...over,
  };
}

describe('reconcileCheckoutSession', () => {
  it('activates the subscription + records a payment from a paid session', async () => {
    const u = makeCustomer();
    retrieveMock.mockResolvedValue(paidSession(u.id));

    const res = await reconcileCheckoutSession('cs_test_1', { id: u.id, email: u.email });
    expect(res.ok).toBe(true);
    expect(res.planId).toBe('studio');

    const sub = getActiveSubscription(u.id);
    expect(sub?.planId).toBe('studio');
    expect(sub?.interval).toBe('year');
    expect(sub?.provider).toBe('stripe');
    expect(sub?.providerSubId).toBe('sub_1');

    const pays = listUserPayments(u.id);
    expect(pays).toHaveLength(1);
    expect(pays[0].amount).toBe(79000);
    expect(pays[0].status).toBe('paid');
  });

  it('is idempotent — running twice does not fork the sub or double-charge', async () => {
    const u = makeCustomer();
    retrieveMock.mockResolvedValue(paidSession(u.id));

    await reconcileCheckoutSession('cs_test_1', { id: u.id, email: u.email });
    await reconcileCheckoutSession('cs_test_1', { id: u.id, email: u.email });

    // Only one subscription row for this providerSubId, one payment.
    expect(getSubscriptionByProviderSub('sub_1')).not.toBeNull();
    expect(listUserPayments(u.id)).toHaveLength(1);
  });

  it('refuses a session that belongs to another user', async () => {
    const u = makeCustomer();
    retrieveMock.mockResolvedValue(paidSession('someone_else'));

    const res = await reconcileCheckoutSession('cs_test_1', { id: u.id, email: u.email });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('not_owner');
    expect(getActiveSubscription(u.id)).toBeNull();
  });

  it('refuses an unpaid / incomplete session', async () => {
    const u = makeCustomer();
    retrieveMock.mockResolvedValue(paidSession(u.id, { payment_status: 'unpaid', status: 'open' }));

    const res = await reconcileCheckoutSession('cs_test_1', { id: u.id, email: u.email });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('not_paid');
    expect(getActiveSubscription(u.id)).toBeNull();
  });

  it('returns not_found when the session cannot be retrieved', async () => {
    const u = makeCustomer();
    retrieveMock.mockResolvedValue(null);
    const res = await reconcileCheckoutSession('cs_missing', { id: u.id, email: u.email });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('not_found');
  });
});
