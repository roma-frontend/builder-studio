import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyStripeSignature } from '@/lib/billing/provider';
import { renderInvoicePdf } from '@/lib/pdf';
import { POST as billingWebhook } from '@/app/api/billing/webhook/route';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { createSiteUser } from '@/lib/site-auth';
import { createPlan } from '@/lib/site-plans';
import { hasActiveMemberSubscription, latestMemberSubscription } from '@/lib/member-subscription';
import { orgCollectedCents } from '@/lib/org-billing';
import { resetDb } from './helpers';

function sign(payload: string, secret: string, t: number): string {
  const v1 = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

describe('verifyStripeSignature', () => {
  const secret = 'webhook_test_secret';
  const payload = '{"id":"evt_1","type":"invoice.paid"}';

  it('accepts a fresh valid signature', () => {
    const now = Date.now();
    const t = Math.floor(now / 1000);
    expect(verifyStripeSignature(payload, sign(payload, secret, t), secret, 300, now)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const now = Date.now();
    const t = Math.floor(now / 1000);
    const header = sign(payload, secret, t);
    expect(verifyStripeSignature(payload + 'x', header, secret, 300, now)).toBe(false);
  });

  it('rejects the wrong secret', () => {
    const now = Date.now();
    const t = Math.floor(now / 1000);
    expect(verifyStripeSignature(payload, sign(payload, 'other', t), secret, 300, now)).toBe(false);
  });

  it('rejects a stale timestamp (replay window)', () => {
    const now = Date.now();
    const t = Math.floor(now / 1000) - 10_000;
    expect(verifyStripeSignature(payload, sign(payload, secret, t), secret, 300, now)).toBe(false);
  });

  it('rejects malformed headers', () => {
    expect(verifyStripeSignature(payload, '', secret)).toBe(false);
    expect(verifyStripeSignature(payload, 'garbage', secret)).toBe(false);
  });
});

describe('renderInvoicePdf', () => {
  it('produces a valid PDF buffer', () => {
    const pdf = renderInvoicePdf({
      invoiceNumber: 'CWK-2026-0001',
      date: '2026-07-07',
      sellerName: 'Cinematic Kit',
      buyerName: 'Jane Doe',
      buyerEmail: 'jane@x.com',
      planLabel: 'Studio',
      intervalLabel: 'Year',
      amountLabel: '$790',
      statusLabel: 'paid',
      labels: {
        invoice: 'Invoice', billTo: 'Bill to', description: 'Description', amount: 'Amount',
        total: 'Total', status: 'Status', date: 'Date', number: 'No', period: 'Period',
      },
    });
    expect(pdf.length).toBeGreaterThan(400);
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.subarray(-6).toString('latin1')).toContain('%%EOF');
  });
});

const WEBHOOK_SECRET = 'whsec_test_only';

async function postStripeEvent(event: Record<string, unknown>) {
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  return billingWebhook(new Request('http://localhost/api/billing/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': sign(payload, WEBHOOK_SECRET, timestamp) },
    body: payload,
  }));
}

async function seedTenantBilling() {
  resetDb();
  const owner = createUser('owner@example.com', 'password123', 'Owner');
  const site = createSite(owner.id, 'Tenant');
  const member = createSiteUser(site.id, 'member@example.com', 'password123', 'Member', 'approved');
  const plan = await createPlan(site.id, { name: 'Gold', amountCents: 1000, interval: 'month' });
  return { site, member, plan };
}

describe('Stripe webhook tenant member subscriptions', () => {
  it('fails closed when the webhook secret is not configured', async () => {
    const previous = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const res = await billingWebhook(new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        body: JSON.stringify({ id: 'evt_unsigned', type: 'invoice.paid', data: { object: {} } }),
      }));
      expect(res.status).toBe(503);
    } finally {
      if (previous === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
      else process.env.STRIPE_WEBHOOK_SECRET = previous;
    }
  });

  it('activates a member subscription and records org revenue from checkout.session.completed', async () => {
    const { site, member, plan } = await seedTenantBilling();
    const res = await postStripeEvent({
      id: 'evt_member_checkout',
      type: 'checkout.session.completed',
      data: { object: {
        id: 'cs_member_1',
        payment_status: 'paid',
        amount_total: 1000,
        currency: 'usd',
        client_reference_id: member.id,
        subscription: { id: 'sub_member_1', current_period_end: 1_800_000_000 },
        metadata: { siteId: site.id, siteUserId: member.id, planId: plan.id },
      } },
    });
    expect(res.status).toBe(200);
    expect(hasActiveMemberSubscription(site.id, member.id)).toBe(true);
    expect(orgCollectedCents(site.id)).toBe(1000);
  });

  it('records renewal invoices idempotently and cancels member access', async () => {
    const { site, member, plan } = await seedTenantBilling();
    await postStripeEvent({
      id: 'evt_member_checkout',
      type: 'checkout.session.completed',
      data: { object: {
        id: 'cs_member_1',
        amount_total: 1000,
        currency: 'usd',
        client_reference_id: member.id,
        subscription: 'sub_member_1',
        metadata: { siteId: site.id, siteUserId: member.id, planId: plan.id },
      } },
    });

    const invoice = {
      id: 'evt_member_invoice',
      type: 'invoice.paid',
      data: { object: {
        id: 'in_member_renewal',
        subscription: 'sub_member_1',
        amount_paid: 1000,
        currency: 'usd',
        lines: { data: [{ period: { start: 1_800_000_000, end: 1_802_592_000 } }] },
      } },
    };
    await postStripeEvent(invoice);
    await postStripeEvent(invoice);
    expect(orgCollectedCents(site.id)).toBe(2000);

    await postStripeEvent({
      id: 'evt_member_deleted',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_member_1' } },
    });
    expect(hasActiveMemberSubscription(site.id, member.id)).toBe(false);
    expect(latestMemberSubscription(site.id, member.id)?.status).toBe('canceled');
  });
});
