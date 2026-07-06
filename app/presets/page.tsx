import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { ThemeStyle } from '@/components/theme-style';
import { ThemeFX } from '@/components/theme-fx';
import { siteTheme } from '@/lib/site-theme';
import { LayoutTemplate, ArrowRight, Sparkles } from 'lucide-react';
import { getLocale } from '@/lib/i18n';
import { pagesDict } from '@/lib/pages-dict';

export async function generateMetadata() {
  const t = pagesDict(await getLocale()).presets;
  return { title: t.metaTitle, description: t.metaDesc };
}

const PRESET_DEFS = [
  { key: 'product', href: '/presets/product', blocks: ['VideoHero', 'SplitHero', 'BeforeAfter', 'StickyShowcase', 'VideoMosaic'] },
  { key: 'portfolio', href: '/presets/portfolio', blocks: ['SplitHero', 'VideoMosaic', 'VideoCardGrid'] },
  { key: 'story', href: '/presets/story', blocks: ['VideoHero', 'StickyShowcase', 'VideoSection'] },
] as const;

/**
 * The real preset page rendered small: a desktop-width iframe scaled to 1/4.
 * It is purely decorative here — hidden from AT and keyboard, clicks fall
 * through to the card link.
 */
function LivePreview({ href, title }: { href: string; title: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
      <iframe
        src={href}
        title={title}
        aria-hidden
        tabIndex={-1}
        loading="lazy"
        scrolling="no"
        className="pointer-events-none absolute left-0 top-0 select-none"
        style={{ width: '400%', height: '400%', transform: 'scale(0.25)', transformOrigin: 'top left', border: 0 }}
      />
      <div className="absolute inset-0" />
    </div>
  );
}

export default async function PresetsIndex() {
  const t = pagesDict(await getLocale()).presets;
  const presets = PRESET_DEFS.map((p) => ({ ...p, title: t.items[p.key].title, desc: t.items[p.key].desc }));
  return (
    <main className="min-h-dvh">
      <ThemeStyle theme={siteTheme()} />
      <ThemeFX />
      <SiteHeader />
      <div className="mx-auto max-w-[var(--container-max)] px-6 py-12 sm:px-10">
        <div className="mb-2 flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-black tracking-tight">{t.title}</h1>
        </div>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          {t.intro}
        </p>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {presets.map((p) => (
            <Link key={p.title} href={p.href} className="group">
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur transition-shadow hover:shadow-lg">
                <LivePreview href={p.href} title={t.previewOf.replace('{title}', p.title)} />
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-tight">{p.title}</h2>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="flex-1 text-sm text-muted-foreground">{p.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.blocks.map((b) => (
                      <span key={b} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-2 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          {t.customTitle}
        </div>
      </div>
    </main>
  );
}
