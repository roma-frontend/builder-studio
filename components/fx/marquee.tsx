import type { ReactNode } from 'react';

/**
 * Infinite horizontal marquee (pure CSS). Duplicates its items so the loop is
 * seamless. Pauses on hover. Use for feature strips / logo rows / taglines.
 */
export function Marquee({
  items,
  className,
  reverse = false,
}: {
  items: ReactNode[];
  className?: string;
  reverse?: boolean;
}) {
  const row = (key: string) => (
    <div className="marquee-row flex shrink-0 items-center gap-10 pr-10" aria-hidden={key === 'b'} key={key}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          {it}
          <span className="text-primary">•</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`group relative flex overflow-hidden ${className ?? ''}`} style={reverse ? { ['--marquee-dir' as string]: 'reverse' } : undefined}>
      {row('a')}
      {row('b')}
    </div>
  );
}
