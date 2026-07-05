'use client';

import { useEffect, useState, type ReactNode } from 'react';

// Header shell that is transparent at the top of the page and gains a solid,
// blurred background once the user scrolls (common professional pattern).
export function ScrollHeader({ behavior, children }: { behavior: string; children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (behavior !== 'transparent') return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [behavior]);

  const transparentTop = behavior === 'transparent' && !scrolled;
  const cls = transparentTop
    ? 'relative sticky top-0 z-40 border-b border-transparent bg-transparent transition-colors duration-300'
    : 'relative sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors duration-300';
  return <header className={cls}>{children}</header>;
}
