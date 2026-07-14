'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Inbox, PartyPopper, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';

const COPY = {
  ru: { badge: 'Важное событие', title: 'Первая заявка получена!', text: (site: string) => `Сайт «${site}» начал приносить результат. Новая заявка уже сохранена — откройте её и свяжитесь с клиентом.`, action: 'Открыть заявку', close: 'Закрыть' },
  en: { badge: 'Milestone reached', title: 'Your first lead is here!', text: (site: string) => `“${site}” has started delivering results. The new lead is saved — open it and follow up while interest is high.`, action: 'Open lead', close: 'Close' },
  hy: { badge: 'Կարևոր իրադարձություն', title: 'Առաջին հայտը ստացվել է!', text: (site: string) => `«${site}» կայքն արդեն արդյունք է տալիս։ Նոր հայտը պահպանված է՝ բացեք և կապվեք հաճախորդի հետ։`, action: 'Բացել հայտը', close: 'Փակել' },
} as const;

export function FirstLeadCelebration({ siteName, onClose }: { siteName: string; onClose: () => void }) {
  const locale = useLocale().locale as keyof typeof COPY;
  const t = COPY[locale] ?? COPY.en;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[90] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="first-lead-title">
        <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label={t.close} onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 28, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 25 }} className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/30 bg-background p-7 text-center shadow-2xl">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary),transparent_58%)] opacity-15" />
          <button type="button" onClick={onClose} aria-label={t.close} className="absolute right-3 top-3 z-10 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
          <div className="relative">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-primary text-white shadow-xl shadow-emerald-500/25"><PartyPopper className="h-8 w-8" /></span>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400"><Sparkles className="h-3.5 w-3.5" /> {t.badge}</p>
            <h2 id="first-lead-title" className="mt-2 text-3xl font-black tracking-tight">{t.title}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{t.text(siteName)}</p>
            <Button asChild size="lg" className="mt-6 gap-2 shadow-lg shadow-primary/20">
              <Link href="/dashboard/submissions" onClick={onClose}><Inbox className="h-5 w-5" /> {t.action}</Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
