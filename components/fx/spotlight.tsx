'use client';

import { useEffect, useRef } from 'react';

/**
 * A cursor-following radial spotlight, tinted with the active theme's --primary.
 * Drop inside a `relative` container; it attaches to the parent's pointer moves
 * and fades in on hover. Pure CSS paint, no re-renders.
 */
export function Spotlight({ size = 420, strength = 30 }: { size?: number; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    let raf = 0;
    let cx = 0;
    let cy = 0;
    // Write the CSS vars at most once per frame (raw mousemove can fire 120+/s
    // on high-refresh mice; repainting the big radial that often is what janks).
    const apply = () => {
      raf = 0;
      const r = parent.getBoundingClientRect();
      el.style.setProperty('--x', `${cx - r.left}px`);
      el.style.setProperty('--y', `${cy - r.top}px`);
    };
    const onMove = (e: MouseEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      el.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      el.style.opacity = '0';
    };
    parent.addEventListener('mousemove', onMove, { passive: true });
    parent.addEventListener('mouseleave', onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      parent.removeEventListener('mousemove', onMove);
      parent.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300"
      style={{
        background: `radial-gradient(${size}px circle at var(--x, 50%) var(--y, 50%), color-mix(in oklab, var(--primary) ${strength}%, transparent), transparent 70%)`,
      }}
    />
  );
}
