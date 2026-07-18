'use client';

import type { ReactNode } from 'react';
import { useReveal } from '@/hooks/use-reveal';
import { usePrefersReducedMotion } from '@/hooks/use-media-query';

type RevealVariant = 'fade' | 'zoom' | 'slide-left' | 'slide-right' | 'blur';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms (for sequenced groups). */
  delay?: number;
  /** Cinematic transition style variant. */
  variant?: RevealVariant;
};

/**
 * Fades + lifts its children into view when scrolled near the viewport.
 * Progressive enhancement: content is always in the DOM (SSR/no-JS friendly,
 * SEO-safe) and simply starts visible when reduced-motion is requested.
 */
export function Reveal({ children, className = '', delay = 0, variant = 'fade' }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const animate = !reduced;

  let transformValue = 'none';
  let filterValue = 'none';

  if (!visible) {
    if (variant === 'zoom') transformValue = 'scale(0.95) translateY(12px)';
    else if (variant === 'slide-left') transformValue = 'translateX(-30px)';
    else if (variant === 'slide-right') transformValue = 'translateX(30px)';
    else if (variant === 'fade') transformValue = 'translateY(24px)';
    
    if (variant === 'blur') filterValue = 'blur(8px)';
  }

  return (
    <div
      ref={ref}
      className={className}
      style={
        animate
          ? {
              opacity: visible ? 1 : 0,
              transform: transformValue,
              filter: filterValue,
              transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
              willChange: 'opacity, transform, filter',
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
