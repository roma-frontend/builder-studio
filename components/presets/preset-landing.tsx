import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, Check, Star, Zap, Shield, Gauge, Coffee, Leaf, Heart,
  Dumbbell, Flame, Trophy, PenTool, Layers, Sparkles, Gem, Wine, Music, Ticket,
  type LucideIcon,
} from 'lucide-react';
import type { PresetDef } from '@/lib/presets';
import type { PresetContent, PresetCommon } from '@/lib/preset-demo-dict';

const ICONS: Record<string, LucideIcon> = {
  zap: Zap, shield: Shield, gauge: Gauge, coffee: Coffee, leaf: Leaf, heart: Heart,
  dumbbell: Dumbbell, flame: Flame, trophy: Trophy, 'pen-tool': PenTool, layers: Layers,
  sparkles: Sparkles, gem: Gem, wine: Wine, star: Star, music: Music, ticket: Ticket,
};

/**
 * A full, themed demo landing rendered from preset config + localized content.
 * Self-contained (gradient art + type + icons) and 100% link-only — no forms
 * or real logic. The page wrapping this applies the theme via ThemeStyle.
 */
export function PresetLanding({
  def, c, common, label,
}: { def: PresetDef; c: PresetContent; common: PresetCommon; label: string }) {
  const grad = `bg-gradient-to-br ${def.cover}`;
  const display = { fontFamily: 'var(--font-display)' } as const;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Demo top bar — links only */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/presets" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {common.backToPresets}
          </Link>
          <span className="hidden text-sm font-semibold sm:block" style={display}>{label}</span>
          <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{common.previewBadge}</span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-70">
          <div className={`absolute -left-20 top-[-10%] h-[32rem] w-[32rem] rounded-full ${grad} blur-[120px] opacity-40`} />
          <div className={`absolute right-[-10%] top-1/3 h-[28rem] w-[28rem] rounded-full ${grad} blur-[130px] opacity-30`} />
        </div>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> {c.hero.eyebrow}
          </span>
          <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl" style={display}>{c.hero.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">{c.hero.subtitle}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="group inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5">
              {common.ctaPrimary} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/presets" className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-card/60 px-6 py-3 font-semibold transition-colors hover:border-primary/40">
              {common.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {def.sections.map((s) => {
        if (s === 'stats' && c.stats) {
          return (
            <section key="stats" className="mx-auto max-w-5xl px-6 py-10">
              <div className="grid grid-cols-3 gap-4 rounded-[calc(var(--radius)*1.25)] border border-border bg-card p-6 sm:p-8">
                {c.stats.map((st) => (
                  <div key={st.label} className="text-center">
                    <div className="text-3xl font-black tracking-tight sm:text-5xl" style={display}>{st.value}</div>
                    <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground sm:text-sm">{st.label}</div>
                  </div>
                ))}
              </div>
            </section>
          );
        }
        if (s === 'logos' && c.logos) {
          return (
            <section key="logos" className="mx-auto max-w-5xl px-6 py-12">
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
                {c.logos.map((l) => (
                  <span key={l} className="text-lg font-bold tracking-tight text-muted-foreground" style={display}>{l}</span>
                ))}
              </div>
            </section>
          );
        }
        if (s === 'features') {
          return (
            <section key="features" className="mx-auto max-w-6xl px-6 py-16">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {c.features.map((f, i) => {
                  const Icon = ICONS[def.featureIcons[i]] ?? Sparkles;
                  return (
                    <div key={f.title} className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1">
                      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-white ${grad}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold" style={display}>{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        if (s === 'showcase') {
          return (
            <section key="showcase" className="mx-auto max-w-6xl px-6 py-16">
              <div className="grid items-center gap-10 rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-8 sm:p-12 lg:grid-cols-2">
                <div>
                  <h2 className="text-3xl font-black tracking-tight" style={display}>{c.showcase.title}</h2>
                  <p className="mt-4 text-muted-foreground">{c.showcase.body}</p>
                  <ul className="mt-6 space-y-3">
                    {c.showcase.points.map((p) => (
                      <li key={p} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="h-3 w-3" /></span>
                        <span className="text-sm">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`relative aspect-[4/3] overflow-hidden rounded-[var(--radius)] ${grad}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.35),transparent_50%)]" />
                  <div className="absolute inset-x-6 bottom-6 space-y-2">
                    <div className="h-3 w-1/2 rounded bg-white/70" />
                    <div className="h-3 w-3/4 rounded bg-white/40" />
                    <div className="h-3 w-2/3 rounded bg-white/30" />
                  </div>
                </div>
              </div>
            </section>
          );
        }
        if (s === 'gallery') {
          return (
            <section key="gallery" className="mx-auto max-w-6xl px-6 py-16">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl" style={display}>{c.gallery.title}</h2>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{c.gallery.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`relative aspect-[4/3] overflow-hidden rounded-[var(--radius)] ${grad}`} style={{ opacity: 0.55 + (i % 3) * 0.15 }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.3),transparent_55%)]" />
                  </div>
                ))}
              </div>
            </section>
          );
        }
        if (s === 'offer') {
          return (
            <section key="offer" className="mx-auto max-w-6xl px-6 py-16">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl" style={display}>{c.offer.title}</h2>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{c.offer.subtitle}</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {c.offer.items.map((item, i) => {
                  const featured = def.offerStyle === 'pricing' && i === 1;
                  const priceIsTime = def.offerStyle === 'schedule';
                  return (
                    <div key={item.name} className={`rounded-[calc(var(--radius)*1.25)] border p-7 shadow-sm ${featured ? 'border-primary bg-card ring-2 ring-primary/40' : 'border-border bg-card'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold" style={display}>{item.name}</h3>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{item.note}</span>
                      </div>
                      <p className="mt-3 flex items-end gap-1">
                        <span className="text-3xl font-black tracking-tight" style={display}>{item.price}</span>
                        {def.offerStyle === 'pricing' && item.price.startsWith('$') && <span className="pb-1 text-sm text-muted-foreground">{common.perMonth}</span>}
                      </p>
                      <ul className="mt-5 space-y-2.5">
                        {item.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
                          </li>
                        ))}
                      </ul>
                      {!priceIsTime && (
                        <Link href="/register" className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 ${featured ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'border border-border bg-background hover:border-primary/40'}`}>
                          {common.choosePlan}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        if (s === 'testimonials') {
          return (
            <section key="testimonials" className="mx-auto max-w-6xl px-6 py-16">
              <div className="grid gap-5 sm:grid-cols-2">
                {c.testimonials.map((r) => (
                  <figure key={r.name} className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm">
                    <div className="mb-3 flex gap-0.5 text-primary">
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                    </div>
                    <blockquote className="text-sm leading-relaxed">{r.quote}</blockquote>
                    <figcaption className="mt-4 flex items-center gap-3">
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${grad}`}>{r.name.charAt(0)}</span>
                      <span>
                        <span className="block text-sm font-semibold">{r.name}</span>
                        <span className="block text-xs text-muted-foreground">{r.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        }
        return null;
      })}

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <div className="relative overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-10 text-center sm:p-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className={`absolute left-1/2 top-1/2 h-72 w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full ${grad} opacity-25 blur-[120px]`} />
          </div>
          <h2 className="text-balance text-4xl font-black tracking-tight sm:text-5xl" style={display}>{c.final.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{c.final.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="group inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5">
              {common.ctaPrimary} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/presets" className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-background px-7 py-3.5 font-semibold transition-colors hover:border-primary/40">
              {common.allPresets}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span style={display} className="font-bold text-foreground">{label}</span>
          <span>{common.footerNote}</span>
          <Link href="/presets" className="transition-colors hover:text-foreground">{common.allPresets}</Link>
        </div>
      </footer>
    </main>
  );
}
