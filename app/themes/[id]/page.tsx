import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, Star, Zap, Shield, Sparkles, Play } from 'lucide-react';
import { THEMES, getTheme, FONT_VAR } from '@/lib/themes';
import { ThemeStyle } from '@/components/theme-style';
import { ThemeFX } from '@/components/theme-fx';
import { getLocale } from '@/lib/i18n';
import { themeDemoDict } from '@/lib/theme-demo-dict';

// Static params so every theme demo prerenders.
export function generateStaticParams() {
  return THEMES.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const theme = THEMES.find((t) => t.id === id);
  if (!theme) return {};
  const t = themeDemoDict(await getLocale());
  return { title: `${theme.label} — ${t.metaSuffix}`, description: t.metaDesc.replace('{label}', theme.label) };
}

/**
 * Full, themed demo landing for a single theme. Purely for showcasing the look
 * & feel — every control is a plain link/redirect, no forms or real logic.
 */
export default async function ThemeDemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!THEMES.some((t) => t.id === id)) notFound();
  const theme = getTheme(id);
  const t = themeDemoDict(await getLocale());
  const display = { fontFamily: FONT_VAR[theme.fontDisplay] } as const;

  const features = [
    { icon: Zap, title: t.features[0].title, body: t.features[0].body },
    { icon: Shield, title: t.features[1].title, body: t.features[1].body },
    { icon: Sparkles, title: t.features[2].title, body: t.features[2].body },
  ];

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <ThemeStyle theme={theme} />
      <ThemeFX />

      {/* Demo top bar — links only */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/themes" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t.backToThemes}
          </Link>
          <span className="hidden text-sm font-semibold sm:block" style={display}>{theme.label}</span>
          <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{t.previewBadge}</span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[130px]" />
        </div>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-primary" /> {t.heroEyebrow}
          </span>
          <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl" style={display}>
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">{t.heroSubtitle}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="group inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5">
              {t.ctaPrimary} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/themes" className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card/60 px-6 py-3 font-semibold transition-colors hover:border-primary/40">
              <Play className="h-4 w-4 text-primary" /> {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl" style={display}>{t.featuresTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t.featuresSubtitle}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold" style={display}>{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase split */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-10 rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black tracking-tight" style={display}>{t.showcaseTitle}</h2>
            <p className="mt-4 text-muted-foreground">{t.showcaseBody}</p>
            <ul className="mt-6 space-y-3">
              {t.showcasePoints.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="h-3 w-3" /></span>
                  <span className="text-sm">{p}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
              {t.ctaPrimary} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-background p-5 shadow-lg">
            <div className="flex items-center gap-1.5 pb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-primary/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            </div>
            <div className="space-y-3">
              <div className="h-3 w-2/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-4/5 rounded bg-muted" />
              <div className="mt-4 flex items-center justify-between rounded-[var(--radius)] bg-primary/10 p-3">
                <div className="h-3 w-24 rounded bg-primary/40" />
                <span className="rounded-[var(--radius)] bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{t.button}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing (links only) */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl" style={display}>{t.pricingTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t.pricingSubtitle}</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {t.plans.map((plan, i) => {
            const featured = i === 1;
            return (
              <div
                key={plan.name}
                className={`rounded-[calc(var(--radius)*1.25)] border p-7 shadow-sm ${featured ? 'border-primary bg-card ring-2 ring-primary/40' : 'border-border bg-card'}`}
              >
                {featured && <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">{t.popular}</span>}
                <h3 className="text-lg font-bold" style={display}>{plan.name}</h3>
                <p className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-black tracking-tight" style={display}>{plan.price}</span>
                  <span className="pb-1 text-sm text-muted-foreground">{t.perMonth}</span>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${featured ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'border border-border bg-background hover:border-primary/40'}`}
                >
                  {t.choosePlan}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.testimonials.map((r) => (
            <figure key={r.name} className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="text-sm leading-relaxed">{r.quote}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{r.name.charAt(0)}</span>
                <span>
                  <span className="block text-sm font-semibold">{r.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-primary/10 p-10 text-center sm:p-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-72 w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
          </div>
          <h2 className="text-balance text-4xl font-black tracking-tight sm:text-5xl" style={display}>{t.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t.finalSubtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="group inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5">
              {t.ctaPrimary} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/themes" className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card/60 px-7 py-3.5 font-semibold transition-colors hover:border-primary/40">
              {t.backToThemes}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer (static links) */}
      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span style={display} className="font-bold text-foreground">{theme.label}</span>
          <span>{t.footerNote}</span>
          <Link href="/themes" className="transition-colors hover:text-foreground">{t.backToThemes}</Link>
        </div>
      </footer>
    </main>
  );
}
