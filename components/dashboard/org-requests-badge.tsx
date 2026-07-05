'use client';

// Live badge for pending organization requests on the superadmin «Организации»
// nav item. Polls the count, plays a soft chime when a NEW request arrives, and
// blinks until the superadmin opens the requests (which dispatches 'seen').

import { useCallback, useEffect, useRef, useState } from 'react';

const SEEN_KEY = 'cwk-org-req-seen';
export const ORG_REQ_SEEN_EVENT = 'cwk:org-requests-seen';

/** Gentle two-tone chime via Web Audio (no asset needed). */
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [880, 1174.66]; // A5 → D6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.14;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.34);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    /* autoplay may be blocked until the first user gesture — ignore */
  }
}

const readSeen = () => {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(SEEN_KEY) ?? '0') || 0;
};

export function OrgRequestsBadge({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [seen, setSeen] = useState(0);
  const prev = useRef(initialCount);

  useEffect(() => { setSeen(readSeen()); }, []);

  const poll = useCallback(() => {
    fetch('/api/admin/org-requests?status=pending')
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d) => {
        const n = Array.isArray(d.requests) ? d.requests.length : 0;
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

  // The Organizations page dispatches this once its requests are shown.
  useEffect(() => {
    const onSeen = (e: Event) => {
      const n = (e as CustomEvent<number>).detail ?? count;
      localStorage.setItem(SEEN_KEY, String(n));
      setSeen(n);
    };
    window.addEventListener(ORG_REQ_SEEN_EVENT, onSeen as EventListener);
    return () => window.removeEventListener(ORG_REQ_SEEN_EVENT, onSeen as EventListener);
  }, [count]);

  if (count <= 0) return null;
  const blink = count > seen;

  return (
    <span className="relative ml-auto flex items-center">
      {blink && <span className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-amber-500/60" />}
      <span className={`relative flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white ${blink ? 'bg-amber-500' : 'bg-amber-500/70'}`}>
        {count}
      </span>
    </span>
  );
}
