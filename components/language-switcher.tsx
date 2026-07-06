'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { ui } from '@/lib/ui-dict';
import { LOCALES, type Locale } from '@/lib/seo';

const META: Record<Locale, { short: string; name: string; flag: string }> = {
  ru: { short: 'RU', name: 'Русский', flag: '🇷🇺' },
  en: { short: 'EN', name: 'English', flag: '🇬🇧' },
  hy: { short: 'HY', name: 'Հայերեն', flag: '🇦🇲' },
};

/**
 * Language switcher (RU / EN / HY). Dependency-free (no i18next): persists the
 * choice via the NEXT_LOCALE cookie and refreshes server components.
 */
export function LanguageSwitcher() {
  const { locale, changeLocale } = useLocale();
  const t = ui(locale);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.a11y.language}: ${META[locale].short}`}
        title={t.a11y.language}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        {META[locale].short}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border/60 bg-background/95 p-1 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              role="menuitemradio"
              aria-checked={l === locale}
              onClick={() => {
                changeLocale(l);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                l === locale ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="text-base leading-none">{META[l].flag}</span>
              <span className="flex-1 text-left">{META[l].name}</span>
              {l === locale && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
