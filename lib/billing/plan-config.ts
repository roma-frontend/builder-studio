// Effective plan resolution: code defaults (lib/billing/plans.ts) merged with
// superadmin overrides (plan_overrides table). Feature lists from overrides are
// ALWAYS filtered to the canonical enforced set (isFeatureKey), so the cards a
// customer sees can never contain a capability that isn't actually gated —
// this is the structural guarantee behind "everything written works".

import 'server-only';
import { eq } from 'drizzle-orm';
import { getDb, planOverrides } from '@/lib/db';
import {
  PLANS,
  PLAN_ORDER,
  isFeatureKey,
  planToDTO,
  type FeatureKey,
  type PlanDTO,
  type PlanId,
} from '@/lib/billing/plans';

function overrideMap(): Map<string, typeof planOverrides.$inferSelect> {
  const rows = getDb().select().from(planOverrides).all();
  return new Map(rows.map((r) => [r.id, r]));
}

function applyOverride(base: PlanDTO, o?: typeof planOverrides.$inferSelect): PlanDTO {
  if (!o) return base;
  let features = base.features;
  if (o.features) {
    try {
      const parsed = JSON.parse(o.features);
      if (Array.isArray(parsed)) features = parsed.filter(isFeatureKey) as FeatureKey[];
    } catch {
      /* keep base features on parse error */
    }
  }
  return {
    ...base,
    name: o.name || base.name,
    tagline: o.tagline || base.tagline,
    priceMonth: o.priceMonth ?? base.priceMonth,
    priceYear: o.priceYear ?? base.priceYear,
    trialDays: o.trialDays ?? base.trialDays,
    accent: o.accent || base.accent,
    popular: o.popular ?? base.popular,
    sites: o.sitesLimit == null ? base.sites : o.sitesLimit < 0 ? null : o.sitesLimit,
    features,
  };
}

/** Effective DTOs for every plan (ordered by rank), overrides applied. */
export function getEffectivePlans(): PlanDTO[] {
  const map = overrideMap();
  return PLAN_ORDER.map((p) => applyOverride(planToDTO(p), map.get(p.id)));
}

export function getEffectivePlan(id: PlanId): PlanDTO {
  const map = overrideMap();
  return applyOverride(planToDTO(PLANS[id]), map.get(id));
}

/** Effective feature set for a plan (the entitlement source of truth). */
export function effectiveFeatures(id: PlanId): FeatureKey[] {
  return getEffectivePlan(id).features;
}

export interface SavePlanInput {
  id: PlanId;
  name?: string;
  tagline?: string;
  priceMonth?: number;
  priceYear?: number;
  trialDays?: number;
  sitesLimit?: number | null; // null/undefined = default; -1 = unlimited
  accent?: string;
  popular?: boolean;
  features?: string[];
}

/** Upsert a plan override (superadmin). Features are validated on save. */
export function savePlanOverride(input: SavePlanInput, updatedBy: string): void {
  const db = getDb();
  const features = (input.features ?? []).filter(isFeatureKey);
  const now = new Date();
  const values = {
    name: input.name ?? '',
    tagline: input.tagline ?? '',
    priceMonth: input.priceMonth ?? null,
    priceYear: input.priceYear ?? null,
    trialDays: input.trialDays ?? null,
    sitesLimit: input.sitesLimit === undefined ? null : input.sitesLimit,
    accent: input.accent ?? '',
    popular: input.popular ?? null,
    features: JSON.stringify(features),
    updatedBy,
    updatedAt: now,
  };
  const existing = db.select({ id: planOverrides.id }).from(planOverrides).where(eq(planOverrides.id, input.id)).get();
  if (existing) {
    db.update(planOverrides).set(values).where(eq(planOverrides.id, input.id)).run();
  } else {
    db.insert(planOverrides).values({ id: input.id, ...values }).run();
  }
}

/** Remove an override → revert to code defaults. */
export function resetPlanOverride(id: PlanId): void {
  getDb().delete(planOverrides).where(eq(planOverrides.id, id)).run();
}
