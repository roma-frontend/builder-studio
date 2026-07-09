// The single source of truth mapping every advertised feature to WHERE it is
// actually enforced in the codebase. tests/billing-enforcement.test.ts asserts
// this covers ALL_FEATURES exactly — so a plan can never list a capability that
// isn't gated. No runtime deps (safe to import anywhere, incl. tests).

import { ALL_FEATURES, type FeatureKey } from '@/lib/billing/plans';

export const FEATURE_ENFORCEMENT: Record<FeatureKey, string> = {
  'sites.publish': 'app/api/sites/[id]/publish/route.ts — POST blocked without the feature',
  'sites.customDomain': 'app/api/sites/[id]/domains/route.ts — POST blocked without the feature',
  'ai.generate': 'app/api/generate-page/route.ts — POST blocked for non-staff without the feature',
  'assistant.use': 'app/api/assistant/route.ts — POST blocked (403) without the feature; daily quota enforced via limits.assistantDaily',
  'assistant.actions': 'app/api/assistant/data/route.ts — agentic DATA fetch blocked (403) without the feature; the prompt omits DATA for non-holders',
  'builder.advancedCss': 'app/studio/builder/page.tsx — advanced style groups gated by builderUnlocked',
  'builder.animation': 'app/studio/builder/page.tsx — animation engine gated by builderUnlocked',
  'builder.hoverStates': 'app/studio/builder/page.tsx — hover-state props gated by builderUnlocked',
  'builder.customCss': 'app/studio/builder/page.tsx — custom CSS fields gated by builderUnlocked',
  'builder.effects': 'app/studio/builder/page.tsx — one-click effect presets gated by builderUnlocked',
  'builder.copyPasteStyle': 'app/studio/builder/page.tsx — copy/paste style gated by builderUnlocked',
};

/** Features that lack a registry entry (must always be empty). */
export function unmappedFeatures(): FeatureKey[] {
  return ALL_FEATURES.filter((f) => !FEATURE_ENFORCEMENT[f]);
}
