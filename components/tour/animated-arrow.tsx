'use client';

// A pulsing directional arrow that points at the spotlighted element from the
// side facing the tooltip, with an optional "click here" label. Purely visual —
// pointer-events are off so it never blocks the real UI underneath.

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

type Side = 'top' | 'bottom' | 'left' | 'right';

const ICON = { top: ArrowDown, bottom: ArrowUp, left: ArrowRight, right: ArrowLeft } as const;

// Which way the bounce travels (toward the target) per side.
const BOUNCE: Record<Side, { x?: number[]; y?: number[] }> = {
  top: { y: [0, 8, 0] },
  bottom: { y: [0, -8, 0] },
  left: { x: [0, 8, 0] },
  right: { x: [0, -8, 0] },
};

export function AnimatedArrow({ rect, side, label, reduced }: {
  rect: { left: number; top: number; width: number; height: number };
  side: Side;
  label?: string;
  reduced?: boolean;
}) {
  const Icon = ICON[side];
  const gap = 12;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  // Anchor the arrow just outside the chosen edge of the target, pointing in.
  const style: React.CSSProperties = { position: 'fixed', zIndex: 10001, pointerEvents: 'none' };
  if (side === 'top') { style.left = cx; style.top = rect.top - gap; style.transform = 'translate(-50%, -100%)'; }
  else if (side === 'bottom') { style.left = cx; style.top = bottom + gap; style.transform = 'translate(-50%, 0)'; }
  else if (side === 'left') { style.left = rect.left - gap; style.top = cy; style.transform = 'translate(-100%, -50%)'; }
  else { style.left = right + gap; style.top = cy; style.transform = 'translate(0, -50%)'; }

  // Never emit NaN/undefined coordinates (e.g. before the target is measured).
  if (!Number.isFinite(style.left as number) || !Number.isFinite(style.top as number)) return null;

  // The label is only shown on vertical placements (top/bottom): there the gap
  // is vertical and the label extends sideways, so it never collides with the
  // tooltip. On left/right the arrow is icon-only to keep the gap tight.
  const showLabel = label && (side === 'top' || side === 'bottom');

  return (
    <div style={style}>
      <div className="flex items-center gap-1.5">
        <motion.span
          animate={reduced ? { opacity: [0.6, 1, 0.6] } : { ...BOUNCE[side], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-primary/25"
        >
          <Icon className="h-4 w-4" strokeWidth={2.75} />
        </motion.span>
        {showLabel && (
          <span className="whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-md">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
