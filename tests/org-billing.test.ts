import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { createSiteUser } from '@/lib/site-auth';
import { recordMemberPayment } from '@/lib/member-subscription';
import { orgBilling, orgCollectedCents, orgPaidOutCents, recordPayout, listPayouts, listOrgsRevenue } from '@/lib/org-billing';
import { resetDb } from './helpers';

beforeEach(() => resetDb());

function seed() {
  const owner = createUser('owner@example.com', 'password123', 'Owner');
  const site = createSite(owner.id, 'Tenant');
  const member = createSiteUser(site.id, 'm@example.com', 'password123', 'M');
  return { site, member };
}

function pay(siteId: string, memberId: string, amountCents: number, ref: string) {
  recordMemberPayment({ siteId, siteUserId: memberId, planId: 'p', amountCents, currency: 'usd', providerRef: ref });
}

describe('platform-managed org billing', () => {
  it('records collected payments (idempotent by provider ref)', () => {
    const { site, member } = seed();
    pay(site.id, member.id, 1000, 'sess_1');
    pay(site.id, member.id, 1000, 'sess_1'); // duplicate → ignored
    pay(site.id, member.id, 500, 'sess_2');
    expect(orgCollectedCents(site.id)).toBe(1500);
  });

  it('ignores zero/empty payments', () => {
    const { site, member } = seed();
    pay(site.id, member.id, 0, 'sess_x');
    recordMemberPayment({ siteId: site.id, siteUserId: member.id, planId: 'p', amountCents: 100, currency: 'usd', providerRef: '' });
    expect(orgCollectedCents(site.id)).toBe(0);
  });

  it('computes balance = collected − fee − paidOut (fee 0 by default)', () => {
    const { site, member } = seed();
    pay(site.id, member.id, 3000, 'sess_a');
    recordPayout({ siteId: site.id, amountCents: 1000, createdBy: 'super' });
    const b = orgBilling(site.id);
    expect(b.collectedCents).toBe(3000);
    expect(b.feeCents).toBe(0);
    expect(b.paidOutCents).toBe(1000);
    expect(b.balanceCents).toBe(2000);
    expect(orgPaidOutCents(site.id)).toBe(1000);
    expect(listPayouts(site.id)).toHaveLength(1);
  });

  it('lists per-org revenue for the superadmin, isolated per org', () => {
    const { site, member } = seed();
    const o2 = createUser('o2@example.com', 'password123', 'O2');
    const s2 = createSite(o2.id, 'Tenant2');
    const m2 = createSiteUser(s2.id, 'm2@example.com', 'password123', 'M2');
    pay(site.id, member.id, 2000, 'a');
    pay(s2.id, m2.id, 500, 'b');
    const rows = listOrgsRevenue();
    const r1 = rows.find((r) => r.siteId === site.id);
    const r2 = rows.find((r) => r.siteId === s2.id);
    expect(r1?.collectedCents).toBe(2000);
    expect(r2?.collectedCents).toBe(500);
    // Ordered by balance desc.
    expect(rows[0].siteId).toBe(site.id);
  });

  it('returns a clean zero snapshot for an org with no payments', () => {
    const { site } = seed();
    const b = orgBilling(site.id);
    expect(b.collectedCents).toBe(0);
    expect(b.balanceCents).toBe(0);
    expect(b.currency).toBe('usd'); // default when no payments
    expect(listPayouts(site.id)).toHaveLength(0);
    expect(listOrgsRevenue()).toHaveLength(0); // no revenue, no payouts
  });

  it('applies the platform fee when PLATFORM_FEE_PERCENT is set', () => {
    const { site, member } = seed();
    const prev = process.env.PLATFORM_FEE_PERCENT;
    process.env.PLATFORM_FEE_PERCENT = '10';
    try {
      pay(site.id, member.id, 1000, 'fee_1');
      const b = orgBilling(site.id);
      expect(b.feeCents).toBe(100); // 10% of 1000
      expect(b.balanceCents).toBe(900);
    } finally {
      if (prev === undefined) delete process.env.PLATFORM_FEE_PERCENT; else process.env.PLATFORM_FEE_PERCENT = prev;
    }
  });

  it('records a payout with explicit currency + note and surfaces payout-only orgs', () => {
    const { site } = seed();
    const p = recordPayout({ siteId: site.id, amountCents: 250, currency: 'EUR', note: 'manual bank transfer', createdBy: 'super' });
    expect(p.currency).toBe('eur');
    expect(p.note).toBe('manual bank transfer');
    // An org with only a payout (no payments) still shows up for the superadmin.
    const rows = listOrgsRevenue();
    expect(rows.find((r) => r.siteId === site.id)?.paidOutCents).toBe(250);
  });
});
