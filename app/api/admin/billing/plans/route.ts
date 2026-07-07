import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { getLocale } from '@/lib/i18n';
import { apiErrors } from '@/lib/api-errors-dict';
import { isPlanId, type PlanId } from '@/lib/billing/plans';
import { savePlanOverride, resetPlanOverride, getEffectivePlans } from '@/lib/billing/plan-config';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';

// Superadmin plan-card editor. POST saves an override; DELETE?id= resets to
// code default. Feature lists are validated (dropped to the enforced set) in
// savePlanOverride, so a card can never advertise a non-working capability.
export async function POST(request: Request) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });

  let body: {
    id?: unknown;
    name?: string;
    tagline?: string;
    priceMonth?: number;
    priceYear?: number;
    trialDays?: number;
    sitesLimit?: number | null;
    accent?: string;
    popular?: boolean;
    features?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: t.badRequest }, { status: 400 });
  }
  if (!isPlanId(body.id)) return NextResponse.json({ error: t.badRequest }, { status: 400 });

  const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  };

  savePlanOverride(
    {
      id: body.id as PlanId,
      name: (body.name ?? '').slice(0, 40),
      tagline: (body.tagline ?? '').slice(0, 120),
      priceMonth: clampInt(body.priceMonth, 0, 10_000_00, 0),
      priceYear: clampInt(body.priceYear, 0, 100_000_00, 0),
      trialDays: clampInt(body.trialDays, 0, 90, 0),
      sitesLimit: body.sitesLimit === null ? -1 : clampInt(body.sitesLimit, 0, 1000, 1),
      accent: (body.accent ?? '').slice(0, 32),
      popular: !!body.popular,
      features: Array.isArray(body.features) ? body.features : [],
    },
    me.id,
  );
  recordAudit({ id: me.id, email: me.email }, 'billing.plan_edit', body.id, JSON.stringify(body.features ?? []));
  return NextResponse.json({ ok: true, plans: getEffectivePlans() });
}

export async function DELETE(request: Request) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });

  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!isPlanId(id)) return NextResponse.json({ error: t.badRequest }, { status: 400 });
  resetPlanOverride(id as PlanId);
  recordAudit({ id: me.id, email: me.email }, 'billing.plan_reset', id);
  return NextResponse.json({ ok: true, plans: getEffectivePlans() });
}
