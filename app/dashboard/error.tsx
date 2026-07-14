'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';

const COPY = {
  ru: { title: 'Не удалось загрузить раздел', text: 'Данные не потеряны. Повторите загрузку — если ошибка сохранится, вернитесь в обзор.', retry: 'Попробовать снова' },
  en: { title: 'This section could not load', text: 'Your data is safe. Try loading it again; if the issue persists, return to the overview.', retry: 'Try again' },
  hy: { title: 'Բաժինը չհաջողվեց բեռնել', text: 'Տվյալները չեն կորել։ Փորձեք կրկին բեռնել բաժինը։', retry: 'Փորձել կրկին' },
} as const;

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useLocale().locale as keyof typeof COPY;
  const t = COPY[locale] ?? COPY.en;
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500"><AlertTriangle className="h-7 w-7" /></span>
      <h1 className="mt-4 text-2xl font-black tracking-tight">{t.title}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t.text}</p>
      <Button onClick={reset} className="mt-6 gap-2"><RefreshCw className="h-4 w-4" /> {t.retry}</Button>
    </div>
  );
}
