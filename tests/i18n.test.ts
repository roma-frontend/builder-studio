import { describe, it, expect, vi } from 'vitest';
import { isLocale, LOCALES, DEFAULT_LOCALE, BCP47, LOCALE_COOKIE } from '@/lib/seo';
import { ui, UI } from '@/lib/ui-dict';
import { getLanding } from '@/lib/landing';

describe('locale helpers', () => {
  it('isLocale narrows supported locales', () => {
    expect(isLocale('ru')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it('BCP47 tags exist for every locale', () => {
    for (const l of LOCALES) expect(BCP47[l]).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
  });

  it('cookie name is stable', () => {
    expect(LOCALE_COOKIE).toBe('NEXT_LOCALE');
  });
});

describe('ui dictionary', () => {
  it('has matching key shape across all locales', () => {
    const shape = (d: Record<string, unknown>) => Object.keys(d).sort();
    const base = shape(ui('ru'));
    for (const l of LOCALES) {
      const d = ui(l);
      expect(shape(d)).toEqual(base);
      expect(Object.keys(d.nav).sort()).toEqual(Object.keys(ui('ru').nav).sort());
      expect(Object.keys(d.actions).sort()).toEqual(Object.keys(ui('ru').actions).sort());
      expect(Object.keys(d.footer).sort()).toEqual(Object.keys(ui('ru').footer).sort());
    }
  });

  it('translates a known key differently per locale', () => {
    expect(UI.ru.actions.login).toBe('Войти');
    expect(UI.en.actions.login).toBe('Sign in');
    expect(UI.hy.actions.login).toBe('Մուտք');
  });
});

describe('getLanding', () => {
  it('returns ru by default and en/hy when requested, with same shape', () => {
    const ru = getLanding('ru');
    const en = getLanding('en');
    const hy = getLanding('hy');
    expect(getLanding()).toBe(ru);
    expect(ru.hero.title).not.toBe(en.hero.title);
    expect(ru.hero.title).not.toBe(hy.hero.title);
    expect(en.hero.title).not.toBe(hy.hero.title);
    for (const l of [en, hy]) {
      expect(l.steps.items.length).toBe(ru.steps.items.length);
      expect(l.features.items.length).toBe(ru.features.items.length);
    }
  });
});

describe('getLocale (server, cookie-backed)', () => {
  it('falls back to default when cookie is missing/invalid, reads a valid cookie', async () => {
    let value: string | undefined;
    vi.doMock('next/headers', () => ({
      cookies: async () => ({ get: (_: string) => (value ? { value } : undefined) }),
    }));
    const { getLocale } = await import('@/lib/i18n');

    value = undefined;
    expect(await getLocale()).toBe(DEFAULT_LOCALE);

    value = 'xx';
    expect(await getLocale()).toBe(DEFAULT_LOCALE);

    value = 'en';
    expect(await getLocale()).toBe('en');

    vi.doUnmock('next/headers');
  });
});
