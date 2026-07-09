import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { createSiteUser } from '@/lib/site-auth';
import {
  hasActiveMemberSubscription,
  latestMemberSubscription,
  upsertActiveSubscription,
  deactivateSubscription,
  createMemberCheckout,
  confirmMemberCheckout,
} from '@/lib/member-subscription';
import { resetDb } from './helpers';

beforeEach(() => resetDb());

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
});
