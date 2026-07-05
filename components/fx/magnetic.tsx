'use client';

import { useRef, type ReactNode } from 'react';

/**
 * Magnetic hover: the wrapped element gently pulls toward the cursor. Great for
 * primary CTAs. Inline-block so it hugs its content.
 */
export function Magnetic({ children, pull = 0.25 }: { children: ReactNode; pull?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${(x * pull).toFixed(1)}px, ${(y * pull).toFixed(1)}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ display: 'inline-block', transition: 'transform 0.2s ease-out', willChange: 'transform' }}
    >
      {children}
    </span>
  );
}
