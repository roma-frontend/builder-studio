'use client';

// Live badge for pending site-member (organization) join requests on the
// «Мои сайты» nav item. Polls the aggregate count across the owner's sites,
// plays a soft chime when a NEW request arrives, and blinks until the owner
// opens a site's members panel (which dispatches the 'seen' event).

import { useCallback, useEffect, useRef, useState } from 'react';
import { playChime } from '@/components/dashboard/chime';

const SEEN_KEY = 'cwk-site-members-seen';
export const SITE_MEMBERS_SEEN_EVENT = 'cwk:site-members-seen';

const readSeen = () => {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(SEEN_KEY) ?? '0') || 0;
};

export function SiteMembersBadge({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [seen, setSeen] = useState(0);
  const prev = useRef(initialCount);

  useEffect(() => {
    setSeen(readSeen());
  }, []);

  const poll = useCallback(() => {
    fetch('/api/site-members')
      .then((r) => (r.ok ? r.json() : { pending: 0 }))
      .then((d) => {
        const n = typeof d.pending === 'number' ? d.pending : 0;
        setCount(n);
        if (n > prev.current && n > readSeen()) playChime();
        prev.current = n;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(poll, 20000);
    return () => clearInterval(id);
  }, [poll]);

  // A site members panel dispatches this once its pending list is shown.
  useEffect(() => {
    const onSeen = (e: Event) => {
      const n = (e as CustomEvent<number>).detail ?? count;
      localStorage.setItem(SEEN_KEY, String(n));
      setSeen(n);
    };
    window.addEventListener(SITE_MEMBERS_SEEN_EVENT, onSeen as EventListener);
    return () => window.removeEventListener(SITE_MEMBERS_SEEN_EVENT, onSeen as EventListener);
  }, [count]);

  if (count <= 0) return null;
  const blink = count > seen;

  return (
    <span className="relative ml-auto flex items-center">
      {blink && <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-amber-500/60" />}
      <span
        className={`relative flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white ${
          blink ? 'bg-amber-500' : 'bg-amber-500/70'
        }`}
      >
        {count}
      </span>
    </span>
  );
}
