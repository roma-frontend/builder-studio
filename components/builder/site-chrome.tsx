import Link from 'next/link';
import type { BuilderDoc } from '@/lib/builder/types';

// Shared header + footer for all builder pages, driven by the BuilderDoc.
export function SiteChrome({ doc, children }: { doc: BuilderDoc; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/site" className="text-lg font-black tracking-tight font-display">
            {doc.brand}
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {doc.nav.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <p className="text-sm text-muted-foreground">{doc.footer.text}</p>
          <nav className="flex flex-wrap items-center gap-4">
            {doc.footer.links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
