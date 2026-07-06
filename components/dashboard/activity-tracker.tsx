'use client';

// Records each dashboard route change for the current staff member (throttled,
// deduped). Server-side the endpoint is a no-op for non-staff. Mounted once by
// the shell for staff users only.

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ActivityTracker() {
  const pathname = usePathname();
  const last = useRef('');

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    last.current = pathname;
    const id = setTimeout(() => {
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}
