import { describe, it, expect } from 'vitest';
import { parseRgb, relativeLuminance, contrastRatio, wcagLevel } from '@/lib/contrast';

describe('contrast', () => {
  it('parses rgb and rgba', () => {
    expect(parseRgb('rgb(255, 255, 255)')).toEqual([255, 255, 255]);
    expect(parseRgb('rgba(0, 0, 0, 0.5)')).toEqual([0, 0, 0]);
    expect(parseRgb('nope')).toBeNull();
  });

  it('black on white is the maximum 21:1', () => {
    const r = contrastRatio('rgb(0,0,0)', 'rgb(255,255,255)');
    expect(r).not.toBeNull();
    expect(Math.round(r as number)).toBe(21);
  });

  it('same color is 1:1', () => {
    expect(contrastRatio('rgb(120,120,120)', 'rgb(120,120,120)')).toBeCloseTo(1, 5);
  });

  it('luminance: white > black', () => {
    expect(relativeLuminance([255, 255, 255])).toBeGreaterThan(relativeLuminance([0, 0, 0]));
  });

  it('maps ratios to WCAG levels', () => {
    expect(wcagLevel(21)).toBe('AAA');
    expect(wcagLevel(5)).toBe('AA');
    expect(wcagLevel(3.5)).toBe('AA-large');
    expect(wcagLevel(2)).toBe('fail');
  });

  it('returns null for unparsable input', () => {
    expect(contrastRatio('x', 'rgb(0,0,0)')).toBeNull();
  });
});
