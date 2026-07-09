import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { listOrgsRevenue, orgBilling, recordPayout, listPayouts, platformFeePercent } from '@/lib/org-billing';
import { recordAudit } from '@/lib/audit';
import { getLocale } from '@/lib/i18n';
import { apiErrors } from '@/lib/api-errors-dict';

export const runtime = 'nodejs';

// Superadmin platform-commerce console: per-org collected revenue and a manual
// payout ledger (Variant A — the platform holds funds and settles admins).

export async function GET(request: Request) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });

  const siteId = new URL(request.url).searchParams.get('site') ?? '';
  if (siteId) {
    return NextResponse.json({ billing: orgBilling(siteId), payouts: listPayouts(siteId) });
  }
  return NextResponse.json({ orgs: listOrgsRevenue(), feePercent: platformFeePercent() });
}

export async function POST(request: Request) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });

  let body: { action?: string; siteId?: string; amountCents?: number; currency?: string; note?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: t.badRequest }, { status: 400 }); }

  const siteId = (body.siteId ?? '').trim();
  if (body.action === 'record-payout') {
    if (!siteId || typeof body.amountCents !== 'number' || body.amountCents <= 0) {
      return NextResponse.json({ error: t.badRequest }, { status: 400 });
    }
    const payout = recordPayout({ siteId, amountCents: body.amountCents, currency: body.currency, note: body.note, createdBy: me.id });
    recordAudit({ id: me.id, email: me.email }, 'org.payout', siteId, `${payout.amountCents} ${payout.currency}`);
    return NextResponse.json({ ok: true, billing: orgBilling(siteId), payouts: listPayouts(siteId) });
  }
  return NextResponse.json({ error: t.unknownAction }, { status: 400 });
}
