import mediaData from '@/data/media.json';
import type { MediaEntry } from '@/lib/media';
import { VideoHero } from '@/components/media/video-hero';
import { VideoSection } from '@/components/media/video-section';
import { VideoCardGrid } from '@/components/media/video-card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Film, Sparkles } from 'lucide-react';
import Link from 'next/link';

// data/media.json is produced by the pipeline (scripts/media-pipeline). Static
// import → a rebuild picks up new clips; `next dev` hot-reloads them.
export default function Home() {
  const media = mediaData as MediaEntry[];
  const hero = media.find((m) => m.section === 'hero');
  const backgrounds = media.filter((m) => m.section === 'background');
  const cards = media.filter((m) => m.section === 'card');

  return (
    <main className="min-h-dvh">
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <Link href="/studio">
          <Button size="sm" className="gap-1.5 shadow-lg"><Sparkles className="h-4 w-4" /> Studio</Button>
        </Link>
      </div>

      {hero ? (
        <VideoHero entry={hero} />
      ) : (
        <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <Film className="h-12 w-12 text-primary" />
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Cinematic Web Kit</h1>
          <p className="max-w-xl text-muted-foreground">
            Generate AI cinematic videos, auto-optimize them to <code>.webm</code>, and render them in
            beautiful sections. Run the pipeline to populate this page.
          </p>
          <pre className="mt-2 max-w-full overflow-x-auto rounded-xl border bg-muted px-4 py-3 text-left text-xs">
{`MUAPI_KEY=sk-... npm run media -- \\
  --prompt "Cinematic macro shot of brake discs, sparks, slow motion" \\
  --section hero --title "Engineered to Stop" --subtitle "Performance" \\
  --cta "Shop now" --ctaHref "/products"`}
          </pre>
        </section>
      )}

      <div className="mx-auto max-w-[var(--container-max)] px-6 py-16 sm:px-10">
        <div className="mb-8 flex items-center gap-2">
          <Film className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Featured clips</h2>
        </div>
        {cards.length > 0 ? (
          <VideoCardGrid entries={cards} />
        ) : (
          <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No <code>card</code> clips yet. Add one:{' '}
            <code>npm run media -- --from ./clip.mp4 --section card --title &quot;Filters&quot;</code>
          </p>
        )}
      </div>

      {backgrounds.map((entry) => (
        <div key={entry.id} className="my-8">
          <VideoSection entry={entry} />
        </div>
      ))}
    </main>
  );
}
