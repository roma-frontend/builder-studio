import { describe, it, expect } from 'vitest';
import { oklchToRgb, oklchToCss } from '@/lib/oklch';

describe('oklchToRgb', () => {
  it('maps pure white and black', () => {
    expect(oklchToRgb(1, 0, 0)).toEqual([255, 255, 255]);
    expect(oklchToRgb(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it('produces a blue-ish indigo for the primary token', () => {
    // oklch(0.55 0.18 265) — the platform primary.
    const [r, g, b] = oklchToRgb(0.55, 0.18, 265);
    expect(b).toBeGreaterThan(r); // blue dominant
    expect(b).toBeGreaterThan(g);
    [r, g, b].forEach((v) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(255); });
  });
});

describe('oklchToCss', () => {
  it('formats rgb for opaque colors', () => {
    expect(oklchToCss('1 0 0')).toBe('rgb(255, 255, 255)');
  });
  it('formats rgba when an alpha suffix is present', () => {
    expect(oklchToCss('1 0 0 / 0.1')).toBe('rgba(255, 255, 255, 0.1)');
  });
  it('falls back to transparent on bad input', () => {
    expect(oklchToCss('')).toBe('transparent');
    expect(oklchToCss('nope')).toBe('transparent');
    expect(oklchToCss(undefined)).toBe('transparent');
  });
});
