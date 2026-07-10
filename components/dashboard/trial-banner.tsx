'use client';

// Honest framing of the complimentary onboarding trial: a brand-new org owner
// did NOT buy anything — we grant Pro features free for a few days so they can
// taste the full product. This slim banner makes that explicit (no surprise
// "subscription"), states there's no card / no auto-charge, and links to plans.
// Self-contained i18n (ru/en/hy).

import Link from 'next/link';
import { Gift, ArrowRight, X } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { usePref } from '@/hooks/use-user-prefs';

const COPY: Record<'ru' | 'en' | 'hy', { text: (d: string) => string; cta: string; dismiss: string }> = {
  ru: {
    text: (d) => `Pro-функции включены бесплатно до ${d} — это пробный доступ, карта не нужна и автосписания не будет.`,
    cta: 'Посмотреть планы',
    dismiss: 'Скрыть',
  },
  en: {
    text: (d) => `Pro features are on us until ${d} — a free trial, no card and no auto-charge.`,
    cta: 'See plans',
    dismiss: 'Dismiss',
  },
  hy: {
    text: (d) => `Pro-ֆունկցիաներն անվճار են մինչև ${d} — փորձնական մուտք է, քարտ պետք չէ, ավտոմատ գանձում չի լինի։`,
    cta: 'Դիտել պլանները',
    dismiss: 'Թաքցնել',
  },
};

export function TrialBanner({ endsOn }: { endsOn: string }) {
  const { locale } = useLocale();
  const c = COPY[(locale as 'ru' | 'en' | 'hy')] ?? COPY.en;
  const [dismissed, setDismissed] = usePref<boolean>('trial-banner-dismissed', false);
  if (dismissed) return null;
  const text = c.text(endsOn);
  return (
    <div className="flex items-center gap-3 border-b border-sky-500/20 bg-gradient-to-r from-sky-500/10 to-transparent px-4 py-2 text-sm sm:px-6">
      <Gift className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
      <p className="min-w-0 flex-1 truncate text-foreground/90" title={text}>{text}</p>
      <Link
        href="/pricing"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        {c.cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <button type="button" onClick={() => setDismissed(true)} aria-label={c.dismiss} title={c.dismiss}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
