import mediaData from '@/data/media.json';
import siteConfig from '@/data/site.json';
import type { MediaEntry } from '@/lib/media';
import { ThemeStyle } from '@/components/theme-style';
import { getTheme } from '@/lib/themes';
import { activeSiteTheme } from '@/lib/site-theme';
import { ThemeFX } from '@/components/theme-fx';
import { SiteHeader } from '@/components/site-header';
import { PageComposer } from '@/components/page-composer';
import { Film } from 'lucide-react';

// data/media.json is produced by the pipeline (scripts/media-pipeline). Static
// import → a rebuild picks up new clips; `next dev` hot-reloads them.
export default async function Home({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const sp = await searchParams;
  const media = mediaData as MediaEntry[];
  const hasContent = media.length > 0;

  // Theme priority: ?theme= preview  →  active site theme (saved or content-derived).
  const savedLayout = (siteConfig as { layout?: string[] | null }).layout ?? undefined;
  const theme = sp.theme ? getTheme(sp.theme) : activeSiteTheme();

  return (
    <main className="min-h-dvh">
      <ThemeStyle theme={theme} />
      <ThemeFX />
      <SiteHeader />

      {hasContent ? (
        <PageComposer theme={theme} media={media} layoutOverride={savedLayout as never} />
      ) : (
        <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <Film className="h-12 w-12 text-primary" />
          <h1 className="font-display text-3xl font-black tracking-tight sm:text-5xl">Кинематографический веб-кит</h1>
          <p className="max-w-xl text-muted-foreground">
            Генерируйте кинематографические ИИ-видео, автоматически оптимизируйте их в <code>.webm</code> и
            выводите в красивых секциях. Запустите пайплайн, чтобы наполнить эту страницу.
          </p>
          <pre className="mt-2 max-w-full overflow-x-auto rounded-xl border bg-muted px-4 py-3 text-left text-xs">
{`MUAPI_KEY=sk-... npm run media -- \\
  --prompt "Cinematic macro shot of brake discs, sparks, slow motion" \\
  --section hero --title "Engineered to Stop" --subtitle "Performance"`}
          </pre>
        </section>
      )}
    </main>
  );
}
