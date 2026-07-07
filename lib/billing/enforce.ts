// Feature enforcement — the single place APIs consult to gate a paid capability,
// plus a REGISTRY documenting where every advertised feature is actually
// enforced. tests/billing-enforcement.test.ts asserts every FeatureKey in
// ALL_FEATURES has a registry entry, so it is structurally impossible to
// advertise a plan feature that isn't gated somewhere in the codebase.

import 'server-only';
import { NextResponse } from 'next/server';
import type { User } from '@/lib/db';
import { getUserEntitlements } from '@/lib/billing/entitlements';
import { minPlanForFeature, type FeatureKey } from '@/lib/billing/plans';

export { FEATURE_ENFORCEMENT } from '@/lib/billing/enforcement-registry';

export function userHasFeature(user: User | null | undefined, feature: FeatureKey): boolean {
  return getUserEntitlements(user).has(feature);
}

/** 403 JSON response for a locked feature, with the plan needed to unlock it. */
export function featureLocked(feature: FeatureKey, message: string): NextResponse {
  return NextResponse.json(
    { error: message, feature, requiredPlan: minPlanForFeature(feature)?.id ?? null, upgrade: '/pricing' },
    { status: 403 },
  );
}

/** Returns a 403 response when the user lacks the feature, else null (proceed). */
export function enforceFeature(user: User | null | undefined, feature: FeatureKey, message: string): NextResponse | null {
  return userHasFeature(user, feature) ? null : featureLocked(feature, message);
}

/** Effective max sites for a user (null = unlimited). */
export function siteLimitFor(user: User | null | undefined): number | null {
  return getUserEntitlements(user).limits.sites;
}
