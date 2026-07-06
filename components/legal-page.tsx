import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ThemeStyle } from '@/components/theme-style';
import { ThemeFX } from '@/components/theme-fx';
import { siteTheme } from '@/lib/site-theme';
import { SITE_NAME, APP_URL } from '@/lib/seo';
import { Info } from 'lucide-react';
import type { LegalDoc } from '@/lib/legal-dict';

/** Resolve {SITE}/{EMAIL} placeholders in legal copy. */
function interpolate(text: string, site: string, email: string): string {
  return text.replaceAll('{SITE}', site).replaceAll('{EMAIL}', email);
}

/**
 * Shared server renderer for platform legal pages. Renders header, a readable
 * prose article (title, tagline, sections), an "Updated {date}" line and a
 * muted disclaimer callout, then the footer.
 */
export function LegalPage({
  doc,
  updatedLabel,
  disclaimer,
  updated,
}: {
  doc: LegalDoc;
  updatedLabel: string;
  disclaimer: string;
  updated: string;
}) {
  const site = SITE_NAME;
  // Contact fallback: configured sender, else info@<app host>.
  const host = APP_URL.replace(/^https?:\/\//, '').split(':')[0];
  const email = process.env.EMAIL_FROM || `info@${host}`;
  const fill = (s: string) => interpolate(s, site, email);

  return (
    <main className="min-h-dvh">
      <ThemeStyle theme={siteTheme()} />
      <ThemeFX />
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
        <header className="mb-8 border-b border-border/60 pb-8">
          <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">{doc.title}</h1>
          <p className="mt-3 text-base text-muted-foreground">{fill(doc.tagline)}</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {updatedLabel} {updated}
          </p>
        </header>

        <div className="space-y-8">
          {doc.sections.map((section, i) => (
            <section key={i}>
              <h2 className="mb-3 text-xl font-bold tracking-tight">{fill(section.heading)}</h2>
              <div className="space-y-3">
                {section.body.map((p, j) => (
                  <p key={j} className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {fill(p)}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="mt-12 flex items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="leading-relaxed">{fill(disclaimer)}</p>
        </aside>
      </article>
      <SiteFooter />
    </main>
  );
}
