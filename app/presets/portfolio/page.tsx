import mediaData from '@/data/media.json';
import { padEntries as pad, type MediaEntry } from '@/lib/media';
import { SiteHeader } from '@/components/site-header';
import { SplitHero } from '@/components/media/split-hero';
import { VideoMosaic } from '@/components/media/video-mosaic';
import { VideoCardGrid } from '@/components/media/video-card';
import { Reveal } from '@/components/reveal';
import { ThemeStyle } from '@/components/theme-style';
import { ThemeFX } from '@/components/theme-fx';
import { pickTheme } from '@/lib/themes';
import { getLocale } from '@/lib/i18n';
import { pagesDict } from '@/lib/pages-dict';

export async function generateMetadata() {
  const t = pagesDict(await getLocale()).presetPages.portfolio;
  return { title: t.metaTitle, description: t.metaDesc };
}

export default async function PortfolioPreset() {
  const dict = pagesDict(await getLocale()).presetPages;
  const p = dict.portfolio;
  const media = mediaData as MediaEntry[];
  const cards = media.filter((m) => m.section === 'card');
  const pool = cards.length ? cards : media;
  const intro = media.find((m) => m.section === 'hero') ?? pool[0];

  if (!intro) {
    return (
      <main className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
          {dict.noClips}
        </div>
      </main>
    );
  }

  const brief = media.map((m) => `${m.title} ${m.subtitle ?? ''} ${m.prompt ?? ''}`).join(' ');
  const theme = pickTheme(brief);

  return (
    <main className="min-h-dvh">
      <ThemeStyle theme={theme} />
      <ThemeFX />
      <SiteHeader />

      {/* 1 — Split intro: who we are + a signature clip */}
      <SplitHero
        entry={{
          ...intro,
          subtitle: intro.subtitle ?? p.introSubtitle,
          prompt: intro.prompt ?? p.introPrompt,
          ctaLabel: p.introCta,
          ctaHref: '#works',
        }}
      />

      {/* 2 — The works: editorial mosaic with big accent tiles */}
      <div id="works">
        <Reveal>
          <div className="mx-auto max-w-[var(--container-max)] px-6 pt-8 sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight">{p.worksTitle}</h2>
            <p className="text-sm text-muted-foreground">{p.worksDesc}</p>
          </div>
          <VideoMosaic entries={pad(pool, 9)} />
        </Reveal>
      </div>

      {/* 3 — Process: mirrored split block */}
      <Reveal>
        <SplitHero
          reverse
          entry={{
            ...(pool[1] ?? intro),
            subtitle: p.processSubtitle,
            title: p.processTitle,
            prompt: p.processPrompt,
            ctaLabel: p.processCta,
            ctaHref: '/site/contact',
          }}
        />
      </Reveal>

      {/* 4 — Compact catalog of everything else */}
      <div className="mx-auto max-w-[var(--container-max)] px-6 pb-16 sm:px-10">
        <Reveal>
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{p.allProjectsTitle}</h2>
          <VideoCardGrid entries={pad(pool, 6)} />
        </Reveal>
      </div>
    </main>
  );
}
