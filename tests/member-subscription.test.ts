import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { createSiteUser } from '@/lib/site-auth';
import {
  hasActiveMemberSubscription,
  latestMemberSubscription,
  getMemberSubscriptionByProviderSub,
  upsertActiveSubscription,
  deactivateSubscription,
  createMemberCheckout,
  confirmMemberCheckout,
  recordMemberPayment,
} from '@/lib/member-subscription';
import { createPlan } from '@/lib/site-plans';
import { orgCollectedCents } from '@/lib/org-billing';
import { resetDb } from './helpers';

beforeEach(() => resetDb());
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.STRIPE_SECRET_KEY;
});

function seed() {
  const owner = createUser('owner@example.com', 'password123', 'Owner');
  const site = createSite(owner.id, 'Tenant');
  const member = createSiteUser(site.id, 'member@example.com', 'password123', 'Member');
  return { site, member };
}

describe('member subscription gate', () => {
  it('reports no active subscription by default', () => {
    const { site, member } = seed();
    expect(hasActiveMemberSubscription(site.id, member.id)).toBe(false);
    expect(latestMemberSubscription(site.id, member.id)).toBeNull();
  });

  it('activates a subscription (idempotent by provider id)', () => {
    const { site, member } = seed();
    upsertActiveSubscription({ siteId: site.id, siteUserId: member.id, planId: 'plan_1', providerSubId: 'sub_x', currentPeriodEnd: null });
    upsertActiveSubscription({ siteId: site.id, siteUserId: member.id, planId: 'plan_1', providerSubId: 'sub_x', currentPeriodEnd: null });
    expect(hasActiveMemberSubscription(site.id, member.id)).toBe(true);
    expect(latestMemberSubscription(site.id, member.id)?.providerSubId).toBe('sub_x');
  });

  it('deactivation removes access', () => {
    const { site, member } = seed();
    upsertActiveSubscription({ siteId: site.id, siteUserId: member.id, planId: 'p', providerSubId: 'sub_y', currentPeriodEnd: null });
    expect(hasActiveMemberSubscription(site.id, member.id)).toBe(true);
    deactivateSubscription('sub_y', 'canceled');
    expect(hasActiveMemberSubscription(site.id, member.id)).toBe(false);
    expect(getMemberSubscriptionByProviderSub('')).toBeNull();
    expect(getMemberSubscriptionByProviderSub('sub_y')?.status).toBe('canceled');
  });

  it('is scoped per site+member', () => {
    const { site, member } = seed();
    upsertActiveSubscription({ siteId: site.id, siteUserId: member.id, planId: 'p', providerSubId: 'sub_z', currentPeriodEnd: null });
    expect(hasActiveMemberSubscription(site.id, 'someone-else')).toBe(false);
    expect(hasActiveMemberSubscription('other-site', member.id)).toBe(false);
  });

  it('checkout/confirm short-circuit when Stripe is not configured', async () => {
    const { site, member } = seed();
    const res = await createMemberCheckout({
      siteId: site.id, siteUser: { id: member.id, email: member.email }, planId: 'p', successUrl: 'https://x/ok', cancelUrl: 'https://x/no',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('not_configured');
    const c = await confirmMemberCheckout(site.id, 'cs_test_123');
    expect(c.ok).toBe(false);
    expect(c.active).toBe(false);
  });

  it('returns no_plan for inactive/free/missing plans when Stripe is configured', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_local';
    const { site, member } = seed();
    const free = await createPlan(site.id, { name: 'Free', amountCents: 0, active: true });
    const inactive = await createPlan(site.id, { name: 'Old', amountCents: 1000, active: false });

    for (const planId of ['missing', free.id, inactive.id]) {
      const res = await createMemberCheckout({
        siteId: site.id,
        siteUser: { id: member.id, email: member.email },
        planId,
        successUrl: 'https://x/ok',
        cancelUrl: 'https://x/no',
      });
      expect(res).toEqual({ ok: false, error: 'no_plan' });
    }
  });

  it('creates a platform Stripe checkout session for a paid plan', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_local';
    const { site, member } = seed();
    const plan = await createPlan(site.id, { name: 'Pro', amountCents: 2500, currency: 'EUR', interval: 'year' });
    let body = '';
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      body = String(init?.body ?? '');
      return new Response(JSON.stringify({ id: 'cs_1', url: 'https://checkout.example/session' }), { status: 200 });
    }));

    const res = await createMemberCheckout({
      siteId: site.id,
      siteUser: { id: member.id, email: member.email },
      planId: plan.id,
      successUrl: 'https://x/ok',
      cancelUrl: 'https://x/no',
    });

    expect(res).toEqual({ ok: true, url: 'https://checkout.example/session' });
    expect(decodeURIComponent(body)).toContain('line_items[0][price_data][recurring][interval]=year');
    expect(decodeURIComponent(body)).toContain(`metadata[siteId]=${site.id}`);
  });

  it('confirms a paid checkout and records org revenue idempotently', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_local';
    const { site, member } = seed();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      payment_status: 'paid',
      amount_total: 4500,
      currency: 'usd',
      metadata: { siteId: site.id, siteUserId: member.id, planId: 'p' },
      subscription: { id: 'sub_paid', status: 'active', current_period_end: 2_000_000_000 },
    }), { status: 200 })));

    expect(await confirmMemberCheckout(site.id, 'cs_paid')).toEqual({ ok: true, active: true });
    expect(hasActiveMemberSubscription(site.id, member.id)).toBe(true);
    expect(orgCollectedCents(site.id)).toBe(4500);

    recordMemberPayment({ siteId: site.id, siteUserId: member.id, planId: 'p', amountCents: 4500, currency: 'usd', providerRef: 'cs_paid' });
    expect(orgCollectedCents(site.id)).toBe(4500);
  });

  it('does not activate checkout sessions that are unpaid or mismatched', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_local';
    const { site, member } = seed();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      payment_status: 'unpaid',
      status: 'open',
      metadata: { siteId: 'other', siteUserId: member.id, planId: 'p' },
      subscription: 'sub_unpaid',
    }), { status: 200 })));

    expect(await confirmMemberCheckout(site.id, 'cs_unpaid')).toEqual({ ok: true, active: false });
    expect(hasActiveMemberSubscription(site.id, member.id)).toBe(false);
  });
});
