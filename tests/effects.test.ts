import { describe, it, expect } from 'vitest';
import { EFFECT_PRESETS, EFFECT_KEYS, getEffect, applyEffectPatch, clearEffectPatch } from '@/lib/builder/effects';

describe('builder effect presets', () => {
  it('exposes presets with unique ids and non-empty props', () => {
    const ids = EFFECT_PRESETS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of EFFECT_PRESETS) {
      expect(Object.keys(e.props).length).toBeGreaterThan(0);
      expect(['entrance', 'loop', 'hover', 'style']).toContain(e.kind);
    }
  });

  it('EFFECT_KEYS is the union of every preset prop key', () => {
    for (const e of EFFECT_PRESETS) {
      for (const k of Object.keys(e.props)) expect(EFFECT_KEYS).toContain(k);
    }
  });

  it('applyEffectPatch clears all effect keys then sets the preset props', () => {
    const patch = applyEffectPatch('lift');
    // every effect key is present (cleared or set) so no stale values survive
    for (const k of EFFECT_KEYS) expect(k in patch).toBe(true);
    // the preset's own props win
    const lift = getEffect('lift')!;
    for (const [k, v] of Object.entries(lift.props)) expect(patch[k]).toBe(v);
    // a key not used by this preset is blanked
    expect(patch.animName).toBe('');
  });

  it('loop preset applies an infinite animation', () => {
    const patch = applyEffectPatch('pulse');
    expect(patch.animName).toBe('pulse');
    expect(patch.animIter).toBe('infinite');
  });

  it('clearEffectPatch blanks every effect key', () => {
    const patch = clearEffectPatch();
    expect(Object.keys(patch).sort()).toEqual([...EFFECT_KEYS].sort());
    expect(Object.values(patch).every((v) => v === '')).toBe(true);
  });

  it('unknown effect id yields an empty patch', () => {
    expect(applyEffectPatch('does-not-exist')).toEqual({});
  });
});
