// Subscription plans + the feature-entitlement matrix. Plans are STATIC config
// here (code defaults); the superadmin can override presentation, price, trial
// and included features at runtime (see lib/billing/plan-config.ts) — but only
// from the CANONICAL, ENFORCED feature set below, so a plan can never advertise
// a capability that isn't actually gated in code.
//
// Yearly price = 10× monthly (two months free), the common SaaS convention.

export type PlanId = 'starter' | 'pro' | 'studio';
export type BillingInterval = 'month' | 'year';

/**
 * Every gate-able capability in the product. IMPORTANT: each key here MUST have
 * a real enforcement binding (see lib/billing/enforce.ts FEATURE_ENFORCEMENT +
 * tests/billing-enforcement.test.ts). Do not add a key without wiring the gate.
 */
export type FeatureKey =
  // Sites / hosting (server-enforced in the site APIs)
  | 'sites.publish'
  | 'sites.customDomain'
  // AI / media (server-enforced in the generation APIs)
  | 'ai.generate'
  // AI assistant (server-enforced in the assistant APIs)
  | 'assistant.use'      // access the Studio Assistant at all (Pro + Studio)
  | 'assistant.actions'  // agentic: fetch DATA / act on the app (Studio only)
  // Builder (enforced in the visual editor + entitlements gate)
  | 'builder.advancedCss'
  | 'builder.animation'
  | 'builder.hoverStates'
  | 'builder.customCss'
  | 'builder.effects'
  | 'builder.copyPasteStyle';

export const ALL_FEATURES: FeatureKey[] = [
  'sites.publish',
  'sites.customDomain',
  'ai.generate',
  'assistant.use',
  'assistant.actions',
  'builder.advancedCss',
  'builder.animation',
  'builder.hoverStates',
  'builder.customCss',
  'builder.effects',
  'builder.copyPasteStyle',
];

/** Advanced-builder features are grouped: they unlock together (Studio-only). */
export const BUILDER_FEATURES: FeatureKey[] = ALL_FEATURES.filter((f) => f.startsWith('builder.'));

export interface Plan {
  id: PlanId;
  /** Sort/upgrade order (higher = more capable). */
  rank: number;
  /** Price in the smallest currency unit (cents) per interval. */
  price: { month: number; year: number };
  currency: string;
  /** Free-trial length in days (0 = none). Charged only after it ends. */
  trialDays: number;
  /** Hard limits (null = unlimited). */
  limits: { sites: number | null; assistantDaily: number | null };
  /** Granted capabilities (subset of ALL_FEATURES). */
  features: FeatureKey[];
  /** Marketing accent (drives the pricing-card gradient/glow). */
  accent: string;
  popular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    rank: 1,
    price: { month: 900, year: 9000 },
    currency: 'usd',
    trialDays: 3, // 3-day free trial, then billing starts
    limits: { sites: 1, assistantDaily: 0 }, // no AI assistant on Starter
    features: ['sites.publish'],
    accent: '#64748b',
  },
  pro: {
    id: 'pro',
    rank: 2,
    price: { month: 2900, year: 29000 },
    currency: 'usd',
    trialDays: 0,
    limits: { sites: 5, assistantDaily: 50 }, // assistant capped at 50 msgs/day
    features: ['sites.publish', 'sites.customDomain', 'ai.generate', 'assistant.use'],
    accent: '#6366f1',
    popular: true,
  },
  studio: {
    id: 'studio',
    rank: 3,
    price: { month: 7900, year: 79000 },
    currency: 'usd',
    trialDays: 0,
    limits: { sites: null, assistantDaily: null }, // unlimited assistant
    // Studio unlocks EVERYTHING (all advanced builder + agentic assistant).
    features: [...ALL_FEATURES],
    accent: '#a855f7',
  },
};

export const PLAN_IDS: PlanId[] = ['starter', 'pro', 'studio'];
export const PLAN_ORDER: Plan[] = PLAN_IDS.map((id) => PLANS[id]).sort((a, b) => a.rank - b.rank);

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === 'string' && v in PLANS;
}
export function isInterval(v: unknown): v is BillingInterval {
  return v === 'month' || v === 'year';
}
export function isFeatureKey(v: unknown): v is FeatureKey {
  return typeof v === 'string' && (ALL_FEATURES as string[]).includes(v);
}
export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}
export function planHasFeature(planId: PlanId, feature: FeatureKey): boolean {
  return PLANS[planId].features.includes(feature);
}
export function minPlanForFeature(feature: FeatureKey): Plan | null {
  return PLAN_ORDER.find((p) => p.features.includes(feature)) ?? null;
}
export function planPrice(planId: PlanId, interval: BillingInterval): number {
  return PLANS[planId].price[interval];
}
export function monthlyEquivalent(planId: PlanId, interval: BillingInterval): number {
  const p = PLANS[planId];
  return interval === 'year' ? Math.round(p.price.year / 12) : p.price.month;
}
export function yearlySavingPct(planId: PlanId): number {
  const p = PLANS[planId];
  const monthlyTotal = p.price.month * 12;
  if (monthlyTotal === 0) return 0;
  return Math.round(((monthlyTotal - p.price.year) / monthlyTotal) * 100);
}

/** Format a cents amount as a currency string, e.g. 2900 → "$29". */
export function formatPrice(cents: number, currency = 'usd', locale = 'en-US'): string {
  const amount = cents / 100;
  const hasFraction = amount % 1 !== 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─────────────────────────── Serializable DTO ───────────────────────────
// Client components render from PlanDTO (never touch the DB). The server may
// build DTOs from code defaults or from superadmin overrides.

export interface PlanDTO {
  id: PlanId;
  rank: number;
  priceMonth: number;
  priceYear: number;
  currency: string;
  trialDays: number;
  accent: string;
  popular: boolean;
  features: FeatureKey[];
  sites: number | null; // null = unlimited
  assistantDaily: number | null; // null = unlimited, 0 = no assistant
  /** Optional presentation overrides (fall back to the i18n dict when unset). */
  name?: string;
  tagline?: string;
}

export function planToDTO(p: Plan): PlanDTO {
  return {
    id: p.id,
    rank: p.rank,
    priceMonth: p.price.month,
    priceYear: p.price.year,
    currency: p.currency,
    trialDays: p.trialDays,
    accent: p.accent,
    popular: !!p.popular,
    features: [...p.features],
    sites: p.limits.sites,
    assistantDaily: p.limits.assistantDaily,
  };
}

/** Code-default DTOs (used when there are no overrides / on the client). */
export function defaultPlanDTOs(): PlanDTO[] {
  return PLAN_ORDER.map(planToDTO);
}

export function monthlyEquivalentDTO(p: PlanDTO, interval: BillingInterval): number {
  return interval === 'year' ? Math.round(p.priceYear / 12) : p.priceMonth;
}
export function yearlySavingPctDTO(p: PlanDTO): number {
  const monthlyTotal = p.priceMonth * 12;
  if (monthlyTotal === 0) return 0;
  return Math.round(((monthlyTotal - p.priceYear) / monthlyTotal) * 100);
}
