'use client';

import type { ReactNode } from 'react';
import { CursorGlow } from './cursor-glow';
import { ScrollProgress } from './landing-sections';

/**
 * Ambient effect shell for the platform landing (/).
 *
 * The landing can be taken over by the visual builder (published node doc). To
 * make sure publishing / saving never strips the page of its atmosphere, this
 * wraps the rendered content with the *ambient* effects that live outside the
 * document tree:
 *   - a fixed animated aurora backdrop (shows through transparent sections),
 *   - the custom cursor glow,
 *   - the scroll-progress bar.
 *
 * These are code-only and independent of the builder document, so no edit or
 * publish inside the builder can remove them. Section-level effects (gradient
 * headings, glass cards, aurora section backgrounds, reveal/hover animations)
 * live in the document itself and are preserved on save as well.
 */
export function LandingEffectsShell({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Ambient animated backdrop — behind normal flow, visible through any
          section whose background is transparent (bg: none). */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="b-aurora absolute inset-0 opacity-70" />
      </div>
      <CursorGlow />
      <ScrollProgress />
      {children}
    </>
  );
}
