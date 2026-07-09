// Feature entitlements: resolve what a platform user is allowed to do based on
// their active subscription and the EFFECTIVE plan config (code defaults +
// superadmin overrides). The superadmin is unrestricted (owns the platform).
// A user with no active subscription falls back to the free floor.

import 'server-only';
import { getActiveSubscription } from '@/lib/billing/subscriptions';
import { isSuperadmin } from '@/lib/auth';
import { effectiveFeatures, getEffectivePlan } from '@/lib/billing/plan-config';
import { ALL_FEATURES, type FeatureKey, type PlanId } from '@/lib/billing/plans';

/** Capabilities available WITHOUT any paid subscription (the free floor). */
export const FREE_FEATURES: FeatureKey[] = [];

export interface Entitlements {
  planId: PlanId | null;
  unlimited: boolean;
  features: Set<FeatureKey>;
  has: (feature: FeatureKey) => boolean;
  limits: { sites: number | null; assistantDaily: number | null };
}

function build(planId: PlanId | null, unlimited: boolean): Entitlements {
  const features = new Set<FeatureKey>(
    unlimited ? ALL_FEATURES : planId ? effectiveFeatures(planId) : FREE_FEATURES,
  );
  const plan = planId ? getEffectivePlan(planId) : null;
  const sites = unlimited ? null : plan ? plan.sites : 1;
  // Free floor gets NO assistant (0). Unlimited (staff/Studio) = null.
  const assistantDaily = unlimited ? null : plan ? plan.assistantDaily : 0;
  return {
    planId,
    unlimited,
    features,
    has: (f) => unlimited || features.has(f),
    limits: { sites, assistantDaily },
  };
}

/** Resolve entitlements for a platform user. */
export function getUserEntitlements(user: { id: string; role?: string } | null | undefined): Entitlements {
  if (!user) return build(null, false);
  // Only the SUPERADMIN owns the platform and is unrestricted. An 'admin' is an
  // ORGANIZATION OWNER — a paying customer — so their entitlements come from
  // their own active subscription (the plan they bought), not a blanket grant.
  if (isSuperadmin(user)) return build('studio', true);
  const sub = getActiveSubscription(user.id);
  return build(sub ? (sub.planId as PlanId) : null, false);
}

export interface EntitlementsDTO {
  planId: PlanId | null;
  unlimited: boolean;
  features: FeatureKey[];
  limits: { sites: number | null; assistantDaily: number | null };
}

export function toDTO(e: Entitlements): EntitlementsDTO {
  return { planId: e.planId, unlimited: e.unlimited, features: [...e.features], limits: e.limits };
}
