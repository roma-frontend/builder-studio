'use client';

// Visitor-facing light/dark toggle for tenant sites. Flips the `dark` class on
// the document and remembers the choice in localStorage. The tenant theme
// defines both light and dark palettes (ThemeStyle → :root + .dark), so this
// switches the whole site instantly.

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const KEY = 'cwk-site-theme';

export function SiteThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const isDark = stored ? stored === 'dark' : document.documentElement.classList.contains('dark');
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem(KEY, next ? 'dark' : 'light'); } catch { /* ignore */ }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
