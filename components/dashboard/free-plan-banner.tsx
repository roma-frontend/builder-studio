'use client';

// Value-first nudge: free-plan owners can build unlimited sites; publishing,
// custom domains and extra AI video are the paid moments. Instead of locking
// the whole dashboard we show this slim, dismissible banner with a direct
// upgrade CTA. Self-contained i18n (ru/en/hy).

import Link from 'next/link';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { usePref } from '@/hooks/use-user-prefs';

const COPY: Record<'ru' | 'en' | 'hy', { text: string; cta: string; dismiss: string }> = {
  ru: { text: 'Вы на бесплатном плане — стройте без ограничений. Чтобы опубликовать сайт, подключить домен и снять лимит AI-видео — оформите план.', cta: 'Выбрать план', dismiss: 'Скрыть' },
  en: { text: 'You’re on the free plan — build all you want. To publish, connect a domain and lift the AI-video limit, pick a plan.', cta: 'Choose a plan', dismiss: 'Dismiss' },
  hy: { text: 'Դուք անվճար պլանում եք — կառուցեք առանց սահմանափակման։ Հրապարակելու, դոմեն միացնելու և AI-վիդեոյի սահմանը բարձրացնելու համար ընտրեք պլան։', cta: 'Ընտրել պլան', dismiss: 'Թաքցնել' },
};

export function FreePlanBanner() {
  const { locale } = useLocale();
  const c = COPY[(locale as 'ru' | 'en' | 'hy')] ?? COPY.en;
  const [dismissed, setDismissed] = usePref<boolean>('free-banner-dismissed', false);
  if (dismissed) return null;
  return (
    <div className="flex items-center gap-3 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-4 py-2 text-sm sm:px-6">
      <Sparkles className="h-4 w-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 truncate text-foreground/90" title={c.text}>{c.text}</p>
      <Link
        href="/pricing"
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
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
