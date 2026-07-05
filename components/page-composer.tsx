import type { MediaEntry } from '@/lib/media';
import type { Theme, LayoutBlock } from '@/lib/themes';
import { VideoHero } from '@/components/media/video-hero';
import { VideoSection } from '@/components/media/video-section';
import { VideoCardGrid } from '@/components/media/video-card';
import { SplitHero } from '@/components/media/split-hero';
import { VideoMosaic } from '@/components/media/video-mosaic';
import { StickyShowcase } from '@/components/media/sticky-showcase';
import { Reveal } from '@/components/reveal';
import { Film } from 'lucide-react';

/**
 * Renders the page body as an ordered stack of blocks defined by the active
 * theme's `layout`. The same media adapts to different compositions per theme
 * (sport → dense mosaic-led, luxury → big cinematic, tech → split-led).
 */
export function PageComposer({ theme, media }: { theme: Theme; media: MediaEntry[] }) {
  const hero = media.find((m) => m.section === 'hero') ?? media[0];
  const cards = media.filter((m) => m.section === 'card');
  const backgrounds = media.filter((m) => m.section === 'background');
  const pool = cards.length ? cards : media;

  const renderBlock = (block: LayoutBlock, key: string) => {
    switch (block) {
      case 'hero':
        return hero ? <VideoHero key={key} entry={hero} /> : null;

      case 'split': {
        const e = pool[0] ?? hero;
        if (!e) return null;
        return (
          <Reveal key={key}>
            <SplitHero
              entry={{
                ...e,
                subtitle: e.subtitle ?? 'Особенность',
                prompt: e.prompt ?? 'Ключевое преимущество — одним ёмким абзацем, поданным кинематографично.',
                ctaLabel: 'Смотреть каталог',
                ctaHref: '/presets/product',
              }}
            />
          </Reveal>
        );
      }

      case 'cards':
        if (cards.length === 0) return null;
        return (
          <div key={key} className="mx-auto max-w-[var(--container-max)] px-6 py-16 sm:px-10">
            <Reveal>
              <div className="mb-8 flex items-center gap-2">
                <Film className="h-6 w-6 text-primary" />
                <h2 className="font-display text-2xl font-bold tracking-tight">Избранное</h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <VideoCardGrid entries={cards} />
            </Reveal>
          </div>
        );

      case 'mosaic':
        if (pool.length === 0) return null;
        return (
          <div key={key} className="pt-8">
            <Reveal>
              <div className="mx-auto max-w-[var(--container-max)] px-6 sm:px-10">
                <h2 className="font-display text-2xl font-bold tracking-tight">Галерея</h2>
              </div>
              <VideoMosaic entries={pool} />
            </Reveal>
          </div>
        );

      case 'sticky':
        if (!hero) return null;
        return (
          <StickyShowcase
            key={key}
            entry={hero}
            panels={[
              { eyebrow: hero.subtitle, title: hero.title },
              { title: 'Одна идея — целая страница', text: 'Опишите бриф — движок соберёт секции в едином стиле темы.' },
              { title: 'Готово к продакшену', text: 'Оптимизация в .webm + MP4, ленивая загрузка, умный постер — быстрый LCP.' },
            ]}
          />
        );

      case 'background':
        if (backgrounds.length === 0) return null;
        return (
          <div key={key}>
            {backgrounds.map((entry) => (
              <Reveal key={entry.id} className="my-8">
                <VideoSection entry={entry} />
              </Reveal>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return <>{theme.layout.map((block, i) => renderBlock(block, `${block}-${i}`))}</>;
}
