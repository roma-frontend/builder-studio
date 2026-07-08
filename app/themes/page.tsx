import { SiteHeader } from '@/components/site-header';
import { getHeaderUser } from '@/lib/auth';
import Link from 'next/link';import { SiteFooter } from '@/components/site-footer';
import { THEMES, FONT_VAR, type Theme } from '@/lib/themes';
import { ThemeStyle } from '@/components/theme-style';
import { ThemeFX } from '@/components/theme-fx';
import { activeSiteTheme } from '@/lib/site-theme';
import { Palette, Check } from 'lucide-react';
import { getLocale } from '@/lib/i18n';
import { pagesDict, type PagesDict } from '@/lib/pages-dict';

export async function generateMetadata() {
  const t = pagesDict(await getLocale()).themes;
  return { title: t.metaTitle, description: t.metaDesc };
}

const ok = (v: string) => `oklch(${v})`;

// Map a theme palette to the scoped CSS custom properties the card reads. The
// same keys are emitted for light and for `.dark`, so each preview flips its
// whole palette when the visitor toggles the site's light/dark scheme.
function paletteVars(p: Record<string, string>): string {
  const map: [string, string][] = [
    ['bg', p.background], ['fg', p.foreground], ['primary', p.primary],
    ['pfg', p['primary-foreground']], ['card', p.card], ['muted', p.muted],
    ['mfg', p['muted-foreground']], ['border', p.border],
  ];
  return map.map(([k, v]) => `--tp-${k}:${ok(v)}`).join(';');
}

function ThemePreview({ theme, active, t }: { theme: Theme; active?: boolean; t: PagesDict['themes'] }) {
  const cls = `tpc-${theme.id}`;
  const css = `.${cls}{${paletteVars(theme.light)}}.dark .${cls}{${paletteVars(theme.dark)}}`;
  const swatches: [string, string][] = [
    ['primary', 'var(--tp-primary)'],
    ['card', 'var(--tp-card)'],
    ['muted', 'var(--tp-muted)'],
    ['foreground', 'var(--tp-fg)'],
    ['border', 'var(--tp-border)'],
  ];
  return (
    <div
      className={`${cls} relative overflow-hidden rounded-2xl border shadow-lg`}
      style={{ background: 'var(--tp-bg)', color: 'var(--tp-fg)', borderColor: active ? 'var(--tp-primary)' : 'var(--tp-border)', boxShadow: active ? '0 0 0 2px var(--tp-primary)' : undefined }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {active && (
        <span
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: 'var(--tp-primary)', color: 'var(--tp-pfg)' }}
        >
          <Check className="h-3 w-3" /> {t.activeOnSite}
        </span>
      )}
      {/* Preview surface */}
      <div className="p-6" style={{ background: 'var(--tp-bg)' }}>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--tp-mfg)' }}>
          {theme.id}
        </p>
        <h3 className="text-3xl font-black tracking-tight" style={{ fontFamily: FONT_VAR[theme.fontDisplay] }}>
          {theme.label}
        </h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--tp-mfg)' }}>
          {t.headings.replace('{font}', theme.fontDisplay).replace('{radius}', theme.radius).replace('{motion}', theme.motion)}
        </p>

        {/* Sample card + button */}
        <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--tp-card)', border: '1px solid var(--tp-border)' }}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{t.sampleCard}</span>
            <button
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{ background: 'var(--tp-primary)', color: 'var(--tp-pfg)', borderRadius: theme.radius }}
            >
              {t.button}
            </button>
          </div>
        </div>

        {/* Swatches */}
        <div className="mt-4 flex flex-wrap gap-2">
          {swatches.map(([name, val]) => (
            <div key={name} className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-md" style={{ background: val, border: '1px solid var(--tp-border)' }} />
              <span className="text-[11px]" style={{ color: 'var(--tp-mfg)' }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Routing keywords */}
      <div className="px-6 pb-5" style={{ background: 'var(--tp-bg)' }}>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tp-mfg)' }}>
          {t.triggersOn}
        </p>
        {theme.keywords.length === 0 ? (
          <span className="text-xs" style={{ color: 'var(--tp-mfg)' }}>
            {t.defaultWhenNoMatch}
          </span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {theme.keywords.slice(0, 10).map((k) => (
              <span
                key={k}
                className="rounded-md px-2 py-0.5 text-[11px]"
                style={{ background: 'var(--tp-muted)', color: 'var(--tp-mfg)' }}
              >
                {k}
              </span>
            ))}
            {theme.keywords.length > 10 && (
              <span className="text-[11px]" style={{ color: 'var(--tp-mfg)' }}>
                +{theme.keywords.length - 10}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ThemesPage() {
  const active = activeSiteTheme();
  const t = pagesDict(await getLocale()).themes;
  const headerUser = await getHeaderUser();
  return (
    <main className="min-h-dvh">
      <ThemeStyle theme={active} />
      <ThemeFX />
      <SiteHeader initialUser={headerUser} />
      <div className="mx-auto max-w-[var(--container-max)] px-6 py-12 sm:px-10">
        <div className="mb-2 flex items-center gap-2">
          <Palette className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-black tracking-tight">{t.title}</h1>
        </div>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          {t.intro.replace('{label}', active.label)}
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((theme) => (
            <Link key={theme.id} href={`/themes/${theme.id}`} className="group block transition-transform hover:-translate-y-1">
              <ThemePreview theme={theme} active={theme.id === active.id} t={t} />
            </Link>
          ))}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
