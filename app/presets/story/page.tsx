import mediaData from '@/data/media.json';
import { padEntries as pad, type MediaEntry } from '@/lib/media';
import { SiteHeader } from '@/components/site-header';
import { VideoHero } from '@/components/media/video-hero';
import { StickyShowcase } from '@/components/media/sticky-showcase';
import { VideoSection } from '@/components/media/video-section';
import { VideoCardGrid } from '@/components/media/video-card';
import { Reveal } from '@/components/reveal';
import { ThemeStyle } from '@/components/theme-style';
import { ThemeFX } from '@/components/theme-fx';
import { pickTheme } from '@/lib/themes';
import { getLocale } from '@/lib/i18n';
import { pagesDict } from '@/lib/pages-dict';

export async function generateMetadata() {
  const t = pagesDict(await getLocale()).presetPages.story;
  return { title: t.metaTitle, description: t.metaDesc };
}

export default async function StoryPreset() {
  const dict = pagesDict(await getLocale()).presetPages;
  const p = dict.story;
  const media = mediaData as MediaEntry[];
  const hero = media.find((m) => m.section === 'hero') ?? media[0];
  const bands = media.filter((m) => m.section === 'background');
  const cards = media.filter((m) => m.section === 'card');
  const pool = cards.length ? cards : media;

  if (!hero) {
    return (
      <main className="min-h-dvh">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
          {dict.noClips}
        </div>
      </main>
    );
  }

  const bandEntry = bands[0] ?? pool[0] ?? hero;

  const brief = media.map((m) => `${m.title} ${m.subtitle ?? ''} ${m.prompt ?? ''}`).join(' ');
  const theme = pickTheme(brief);

  return (
    <main className="min-h-dvh">
      <ThemeStyle theme={theme} />
      <ThemeFX />
      <SiteHeader />

      {/* 1 — Full-bleed opening shot */}
      <VideoHero entry={hero} />

      {/* 2 — The story itself: sticky chapters over one clip */}
      <StickyShowcase
        entry={hero}
        panels={[
          { eyebrow: p.ch1Eyebrow, title: p.ch1Title, text: p.ch1Text },
          { eyebrow: p.ch2Eyebrow, title: p.ch2Title, text: p.ch2Text },
          { eyebrow: p.ch3Eyebrow, title: p.ch3Title, text: p.ch3Text },
        ]}
      />

      {/* 3 — Full-width video band as a visual pause */}
      <Reveal>
        <VideoSection
          entry={{
            ...bandEntry,
            subtitle: bandEntry.subtitle ?? p.manifestSubtitle,
            title: bandEntry.title || p.manifestTitle,
          }}
        />
      </Reveal>

      {/* 4 — Milestones grid */}
      <div className="mx-auto max-w-[var(--container-max)] px-6 py-16 sm:px-10">
        <Reveal>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">{p.milestonesTitle}</h2>
          <p className="mb-6 text-sm text-muted-foreground">{p.milestonesDesc}</p>
          <VideoCardGrid entries={pad(pool, 3)} />
        </Reveal>
      </div>
    </main>
  );
}
