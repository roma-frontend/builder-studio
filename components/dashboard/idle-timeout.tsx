'use client';

// Security: inactivity auto-logout warning. Mounted once by the dashboard
// shell. Shows a modal with a live countdown once the user has been idle; they
// can stay signed in or log out immediately, and are logged out automatically
// when the countdown hits zero.

import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIdleTimer } from '@/hooks/use-idle-timer';
import { useLocale } from '@/hooks/use-locale';

const DICT = {
  ru: { title: 'Вы всё ещё здесь?', body: 'Сессия будет завершена из-за неактивности через', unit: 'сек', stay: 'Остаться в системе', logout: 'Выйти сейчас' },
  en: { title: 'Still there?', body: 'You will be signed out due to inactivity in', unit: 'sec', stay: 'Stay signed in', logout: 'Log out now' },
  hy: { title: 'Դեռ այստե՞ղ եք', body: 'Անգործության պատճառով դուրս կգրվեք', unit: 'վրկ', stay: 'Մնալ համակարգում', logout: 'Դուրս գալ հիմա' },
} as const;

export function IdleTimeout({ onLogout }: { onLogout: () => void }) {
  const locale = useLocale().locale as keyof typeof DICT;
  const t = DICT[locale] ?? DICT.en;
  const { showWarning, countdownSeconds, extendSession } = useIdleTimer({ onLogout });

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h2 className="text-lg font-bold tracking-tight">{t.title}</h2>
          <p className="text-sm text-muted-foreground">
            {t.body}{' '}
            <span className="font-mono text-2xl font-black tabular-nums text-amber-500">{countdownSeconds}</span>{' '}
            {t.unit}
          </p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500 transition-[width] duration-1000 ease-linear"
              style={{ width: `${Math.max(0, Math.min(100, (countdownSeconds / 60) * 100))}%` }}
            />
          </div>
          <div className="mt-2 flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={onLogout}>{t.logout}</Button>
            <Button className="flex-1" onClick={extendSession}>{t.stay}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
