import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from './helpers';
import { createUser } from '@/lib/auth';
import { ALL_FEATURES, PLANS, PLAN_IDS, isFeatureKey, type FeatureKey } from '@/lib/billing/plans';
import { FEATURE_ENFORCEMENT, unmappedFeatures } from '@/lib/billing/enforcement-registry';
import { getEffectivePlans, savePlanOverride, getEffectivePlan } from '@/lib/billing/plan-config';
import { upsertSubscription } from '@/lib/billing/subscriptions';
import { getUserEntitlements } from '@/lib/billing/entitlements';

beforeEach(() => resetDb());

// The core integrity guarantee: nothing advertised on a plan can be a feature
// that isn't actually enforced somewhere in the codebase.
describe('feature integrity — no fake features', () => {
  it('every advertised feature has an enforcement binding', () => {
    expect(unmappedFeatures()).toEqual([]);
    for (const f of ALL_FEATURES) {
      expect(FEATURE_ENFORCEMENT[f]).toBeTruthy();
    }
  });

  it('the registry has no phantom entries beyond ALL_FEATURES', () => {
    const registryKeys = Object.keys(FEATURE_ENFORCEMENT) as FeatureKey[];
    expect(registryKeys.sort()).toEqual([...ALL_FEATURES].sort());
  });

  it('every feature listed on every plan is a real enforced FeatureKey', () => {
    for (const id of PLAN_IDS) {
      for (const f of PLANS[id].features) {
        expect(isFeatureKey(f)).toBe(true);
        expect(FEATURE_ENFORCEMENT[f]).toBeTruthy();
      }
    }
  });
});

describe('plan overrides cannot introduce fake features', () => {
  it('drops unknown feature keys from an override', () => {
    createUser('root@x.com', 'pw', 'Root'); // superadmin bootstrap
    savePlanOverride(
      { id: 'starter', features: ['sites.publish', 'totally.fake', 'support.priority'] as unknown as string[] },
      'root',
    );
    const plan = getEffectivePlan('starter');
    expect(plan.features).toEqual(['sites.publish']);
    // Every surviving feature is still enforceable.
    for (const f of plan.features) expect(FEATURE_ENFORCEMENT[f]).toBeTruthy();
  });

  it('effective plans always expose only enforced features', () => {
    createUser('root@x.com', 'pw', 'Root');
    savePlanOverride({ id: 'pro', features: ['ai.generate', 'nope.fake'] as unknown as string[] }, 'root');
    for (const p of getEffectivePlans()) {
      for (const f of p.features) expect(FEATURE_ENFORCEMENT[f]).toBeTruthy();
    }
  });
});

describe('entitlements reflect the effective (edited) plan', () => {
  it('a customer only gets features their plan actually grants', () => {
    createUser('owner@x.com', 'pw', 'Owner'); // superadmin
    const customer = createUser('c@x.com', 'pw', 'C');
    upsertSubscription({
      userId: customer.id, planId: 'pro', interval: 'month', status: 'active',
      provider: 'manual', currentPeriodEnd: new Date(Date.now() + 864e5),
    });
    const e = getUserEntitlements(customer);
    // Pro grants ai.generate, not the builder.
    expect(e.has('ai.generate')).toBe(true);
    expect(e.has('builder.effects')).toBe(false);
  });

  it('superadmin/staff are unlimited', () => {
    const su = createUser('root@x.com', 'pw', 'Root');
    const e = getUserEntitlements(su);
    for (const f of ALL_FEATURES) expect(e.has(f)).toBe(true);
  });
});
