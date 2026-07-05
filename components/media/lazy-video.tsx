'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Convert an "16:9" aspect string to a CSS aspect-ratio value. */
function toAspect(ratio?: string) {
  return (ratio || '16:9').replace(':', ' / ');
}

/**
 * A looping background video that only mounts once it scrolls near the viewport
 * (IntersectionObserver), so a page full of clips doesn't fetch/decode them all
 * up front. The poster image paints instantly and acts as the LCP-friendly
 * placeholder until the muted, autoplaying loop takes over.
 */
export function LazyVideo({
  src,
  poster,
  ratio,
  className,
}: {
  src: string;
  poster?: string;
  ratio?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={cn('relative overflow-hidden bg-muted', className)} style={{ aspectRatio: toAspect(ratio) }}>
      {visible ? (
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Play className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
