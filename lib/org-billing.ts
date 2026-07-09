import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb, newId, memberPayments, orgPayouts, sites, type OrgPayout } from '@/lib/db';

// Platform-managed commerce accounting. All member money is collected on the
// platform Stripe (see lib/member-subscription.ts); here we compute, per org:
//   collected  = Σ member_payments
//   fee        = collected × PLATFORM_FEE_PERCENT   (platform's cut)
//   paidOut    = Σ org_payouts                       (settled to the admin)
//   balance    = collected − fee − paidOut           (owed to the admin)
// The superadmin settles balances via a manual payout ledger (recordPayout).

/** Platform commission percent taken from each org's collected revenue. */
export function platformFeePercent(): number {
  const n = Number(process.env.PLATFORM_FEE_PERCENT ?? '0');
  return Number.isFinite(n) && n >= 0 && n < 100 ? n : 0;
}

export interface OrgBilling {
  siteId: string;
  siteName: string;
  currency: string;
  collectedCents: number;
  feeCents: number;
  paidOutCents: number;
  /** Owed to the admin = collected − fee − paidOut. */
  balanceCents: number;
  payments: number;
}

function feeOf(collected: number): number {
  return Math.round((collected * platformFeePercent()) / 100);
}

export function orgCollectedCents(siteId: string): number {
  const r = getDb()
    .select({ n: sql<number>`coalesce(sum(${memberPayments.amountCents}), 0)` })
    .from(memberPayments)
    .where(eq(memberPayments.siteId, siteId))
    .get();
  return r?.n ?? 0;
}

export function orgPaidOutCents(siteId: string): number {
  const r = getDb()
    .select({ n: sql<number>`coalesce(sum(${orgPayouts.amountCents}), 0)` })
    .from(orgPayouts)
    .where(eq(orgPayouts.siteId, siteId))
    .get();
  return r?.n ?? 0;
}

/** The org's dominant payment currency (latest payment), default usd. */
function orgCurrency(siteId: string): string {
  const r = getDb()
    .select({ currency: memberPayments.currency })
    .from(memberPayments)
    .where(eq(memberPayments.siteId, siteId))
    .orderBy(desc(memberPayments.createdAt))
    .get();
  return r?.currency || 'usd';
}

/** Full billing snapshot for one org. */
export function orgBilling(siteId: string): OrgBilling {
  const site = getDb().select({ name: sites.name }).from(sites).where(eq(sites.id, siteId)).get();
  const collectedCents = orgCollectedCents(siteId);
  const feeCents = feeOf(collectedCents);
  const paidOutCents = orgPaidOutCents(siteId);
  const paymentsRow = getDb()
    .select({ n: sql<number>`count(*)` })
    .from(memberPayments)
    .where(eq(memberPayments.siteId, siteId))
    .get();
  return {
    siteId,
    siteName: site?.name ?? '',
    currency: orgCurrency(siteId),
    collectedCents,
    feeCents,
    paidOutCents,
    balanceCents: collectedCents - feeCents - paidOutCents,
    payments: paymentsRow?.n ?? 0,
  };
}

/** Per-org billing for EVERY org that has collected revenue or recorded payouts
 *  (superadmin revenue view). Ordered by balance owed, descending. */
export function listOrgsRevenue(): OrgBilling[] {
  const db = getDb();
  const rev = db
    .select({ siteId: memberPayments.siteId, sum: sql<number>`sum(${memberPayments.amountCents})`, n: sql<number>`count(*)` })
    .from(memberPayments)
    .groupBy(memberPayments.siteId)
    .all();
  const pay = db
    .select({ siteId: orgPayouts.siteId, sum: sql<number>`sum(${orgPayouts.amountCents})` })
    .from(orgPayouts)
    .groupBy(orgPayouts.siteId)
    .all();
  const paidMap = new Map(pay.map((p) => [p.siteId, p.sum ?? 0]));
  const siteIds = new Set<string>([...rev.map((r) => r.siteId), ...pay.map((p) => p.siteId)]);
  const out: OrgBilling[] = [];
  for (const siteId of siteIds) {
    const site = db.select({ name: sites.name }).from(sites).where(eq(sites.id, siteId)).get();
    if (!site) continue; // org deleted
    const collectedCents = rev.find((r) => r.siteId === siteId)?.sum ?? 0;
    const feeCents = feeOf(collectedCents);
    const paidOutCents = paidMap.get(siteId) ?? 0;
    out.push({
      siteId,
      siteName: site.name,
      currency: orgCurrency(siteId),
      collectedCents,
      feeCents,
      paidOutCents,
      balanceCents: collectedCents - feeCents - paidOutCents,
      payments: rev.find((r) => r.siteId === siteId)?.n ?? 0,
    });
  }
  return out.sort((a, b) => b.balanceCents - a.balanceCents);
}

/** Record a manual payout to an org admin (superadmin action). */
export function recordPayout(input: {
  siteId: string;
  amountCents: number;
  currency?: string;
  note?: string;
  createdBy: string;
}): OrgPayout {
  const row: OrgPayout = {
    id: newId('pout'),
    siteId: input.siteId,
    amountCents: Math.max(0, Math.round(input.amountCents || 0)),
    currency: (input.currency || orgCurrency(input.siteId)).toLowerCase().slice(0, 3),
    note: (input.note ?? '').slice(0, 300),
    createdBy: input.createdBy,
    createdAt: new Date(),
  };
  getDb().insert(orgPayouts).values(row).run();
  return row;
}

/** Payout history for one org (newest first). */
export function listPayouts(siteId: string): OrgPayout[] {
  return getDb().select().from(orgPayouts).where(eq(orgPayouts.siteId, siteId)).orderBy(desc(orgPayouts.createdAt)).all();
}
