'use client';

// Visitor-facing light/dark toggle for tenant sites. Flips the `dark` class on
// the document and remembers the choice in localStorage; for a signed-in site
// member the choice is also saved to their account (site_users.theme) and wins
// over localStorage, so it follows them across browsers. The tenant theme
// defines both light and dark palettes (ThemeStyle → :root + .dark), so this
// switches the whole site instantly.

import { useEffect, useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { siteRt } from '@/lib/site-runtime-dict';

const KEY = 'cwk-site-theme';
const THEME_EVENT = 'cwk:site-theme';

// The `dark` class on <html> is the source of truth; every toggle instance
// subscribes to it, so the state can't drift between header/footer copies.
const subscribe = (cb: () => void) => {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
};

function apply(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function SiteThemeToggle({ className = '', siteId = '' }: { className?: string; siteId?: string }) {
  const rt = siteRt(useLocale().locale);
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains('dark'),
    () => true, // tenant sites SSR dark by default
  );

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) apply(stored === 'dark');

    // A signed-in member's saved theme overrides the browser-local choice.
    if (!siteId) return;
    fetch(`/api/site-auth?site=${encodeURIComponent(siteId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const t = d?.user?.theme;
        if (t !== 'dark' && t !== 'light') return;
        apply(t === 'dark');
        try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
      })
      .catch(() => {});
  }, [siteId]);

  const toggle = () => {
    const next = !dark;
    apply(next);
    try { localStorage.setItem(KEY, next ? 'dark' : 'light'); } catch { /* ignore */ }
    if (siteId) {
      // Fire-and-forget: only succeeds for a signed-in member, 401 otherwise.
      fetch('/api/site-auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'update-profile', siteId, theme: next ? 'dark' : 'light' }),
      }).catch(() => {});
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? rt.lightTheme : rt.darkTheme}
      title={dark ? rt.lightTheme : rt.darkTheme}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
