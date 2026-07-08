import { SiteHeader } from '@/components/site-header';
import { WebVitals } from '@/components/web-vitals';
import { PlatformThemeStyle } from '@/components/platform-theme-style';
import { ThemeFX } from '@/components/theme-fx';
import { Gauge } from 'lucide-react';
import { getLocale } from '@/lib/i18n';
import { pagesDict } from '@/lib/pages-dict';

export async function generateMetadata() {
  const t = pagesDict(await getLocale()).vitals;
  return { title: t.metaTitle, description: t.metaDesc };
}

export default async function VitalsPage() {
  const t = pagesDict(await getLocale()).vitals;
  return (
    <main className="min-h-dvh">
      <PlatformThemeStyle />
      <ThemeFX />
      <SiteHeader />
      <div className="mx-auto max-w-[var(--container-max)] px-6 py-12 sm:px-10">
        <div className="mb-2 flex items-center gap-2">
          <Gauge className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-black tracking-tight">{t.title}</h1>
        </div>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          {t.intro}
        </p>

        <WebVitals />

        <div className="mt-10 grid gap-4 rounded-2xl border border-border bg-card/60 p-6 text-sm text-muted-foreground backdrop-blur sm:grid-cols-3">
          <div>
            <p className="font-semibold text-foreground">{t.lcpTitle}</p>
            <p className="mt-1">{t.lcpDesc}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">{t.scoresTitle}</p>
            <p className="mt-1">
              <span className="text-green-500">{t.good}</span>{t.scoresDesc.split('{good}')[1]?.split('{medium}')[0]}<span className="text-amber-400">{t.medium}</span>{t.scoresDesc.split('{medium}')[1]?.split('{bad}')[0]}<span className="text-red-500">{t.bad}</span>{t.scoresDesc.split('{bad}')[1]}
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">{t.prodDevTitle}</p>
            <p className="mt-1">{t.prodDevDesc}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
