'use client';

// Forced / voluntary password change for a logged-in platform user. Reached
// automatically after a superadmin issues a temporary password (the dashboard
// layout redirects here while `mustChangePassword` is set). Reuses the auth
// shell for a consistent look.

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { iconCls, passwordScore, StrengthMeter, Shell, Brand } from '@/components/auth/auth-ui';
import { useLocale } from '@/hooks/use-locale';
import type { Locale } from '@/lib/seo';

const DICT: Record<Locale, {
  title: string; subtitle: string; forced: string; current: string; next: string; confirm: string;
  submit: string; success: string; mismatch: string; short: string; generic: string; network: string; show: string; hide: string;
}> = {
  ru: {
    title: 'Смена пароля',
    subtitle: 'Задайте новый пароль для вашего аккаунта',
    forced: 'Администратор выдал вам временный пароль. Для продолжения задайте новый постоянный пароль.',
    current: 'Текущий (временный) пароль',
    next: 'Новый пароль',
    confirm: 'Повторите новый пароль',
    submit: 'Сохранить пароль',
    success: 'Пароль изменён. Перенаправляем…',
    mismatch: 'Пароли не совпадают.',
    short: 'Пароль должен быть не короче 8 символов.',
    generic: 'Не удалось изменить пароль.',
    network: 'Сеть недоступна.',
    show: 'Показать', hide: 'Скрыть',
  },
  en: {
    title: 'Change password',
    subtitle: 'Set a new password for your account',
    forced: 'An administrator issued you a temporary password. Set a new permanent password to continue.',
    current: 'Current (temporary) password',
    next: 'New password',
    confirm: 'Repeat new password',
    submit: 'Save password',
    success: 'Password changed. Redirecting…',
    mismatch: 'Passwords do not match.',
    short: 'Password must be at least 8 characters.',
    generic: 'Could not change the password.',
    network: 'Network unavailable.',
    show: 'Show', hide: 'Hide',
  },
  hy: {
    title: 'Փոխել գաղտնաբառը',
    subtitle: 'Սահմանեք նոր գաղտնաբառ ձեր հաշվի համար',
    forced: 'Ադմինիստրատորը ձեզ տրամադրել է ժամանակավոր գաղտնաբառ։ Շարունակելու համար սահմանեք նոր մշտական գաղտնաբառ։',
    current: 'Ընթացիկ (ժամանակավոր) գաղտնաբառ',
    next: 'Նոր գաղտնաբառ',
    confirm: 'Կրկնեք նոր գաղտնաբառը',
    submit: 'Պահպանել գաղտնաբառը',
    success: 'Գաղտնաբառը փոխված է։ Վերահղում…',
    mismatch: 'Գաղտնաբառերը չեն համընկնում։',
    short: 'Գաղտնաբառը պետք է լինի առնվազն 8 նիշ։',
    generic: 'Չհաջողվեց փոխել գաղտնաբառը։',
    network: 'Ցանցն անհասանելի է։',
    show: 'Ցույց տալ', hide: 'Թաքցնել',
  },
};

export function ForcePasswordChange({ forced }: { forced: boolean }) {
  const router = useRouter();
  const t = DICT[useLocale().locale] ?? DICT.en;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const score = passwordScore(next);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (next.length < 8) { setErr(t.short); return; }
    if (next !== confirm) { setErr(t.mismatch); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error || t.generic); return; }
      setDone(true);
      router.push('/dashboard');
      router.refresh();
    } catch {
      setErr(t.network);
    } finally {
      setBusy(false);
    }
  };

  const type = show ? 'text' : 'password';

  return (
    <Shell>
      <Brand title={t.title} subtitle={t.subtitle} icon={ShieldCheck} />
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur">
        {forced && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{t.forced}
          </p>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t.current}</label>
          <div className="relative">
            <Lock className={iconCls} />
            <Input type={type} value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" className="h-11 pl-10" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t.next}</label>
          <div className="relative">
            <Lock className={iconCls} />
            <Input type={type} value={next} onChange={(e) => setNext(e.target.value)} required autoComplete="new-password" className="h-11 pl-10 pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t.hide : t.show} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {next && <StrengthMeter score={score} />}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">{t.confirm}</label>
          <div className="relative">
            <Lock className={iconCls} />
            <Input type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" className="h-11 pl-10" />
          </div>
        </div>

        {err && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-500" role="alert">{err}</p>}
        {done && <p className="flex items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400"><Check className="h-4 w-4" />{t.success}</p>}

        <Button type="submit" disabled={busy || done} className="h-11 w-full gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{t.submit}
        </Button>
      </form>
    </Shell>
  );
}
