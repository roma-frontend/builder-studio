'use client';

// Superadmin tool: pick a user and reset their onboarding tours (clears every
// "tour:*" seen-flag in their prefs), so the tours auto-play again on their
// next visit. Calls the superadmin-guarded /api/admin/users/[id] reset-tours
// action. Localized inline (ru/en/hy) to stay self-contained.

import { useState } from 'react';
import { Loader2, RotateCcw, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';

type PickUser = { id: string; name: string; email: string };

const DICT = {
  ru: {
    title: 'Онбординг-туры',
    desc: 'Выберите пользователя и сбросьте его туры — они снова запустятся автоматически при следующем заходе.',
    pick: 'Выберите пользователя…',
    reset: 'Сбросить туры',
    you: ' (вы)',
    done: 'Сброшено флагов: {n} — {email}',
    none: 'У этого пользователя не было пройденных туров.',
    err: 'Не удалось сбросить.',
  },
  en: {
    title: 'Onboarding tours',
    desc: 'Pick a user and reset their tours — they will auto-play again on the user’s next visit.',
    pick: 'Select a user…',
    reset: 'Reset tours',
    you: ' (you)',
    done: 'Cleared {n} flag(s) — {email}',
    none: 'This user had no completed tours.',
    err: 'Could not reset.',
  },
  hy: {
    title: 'Ներածական շրջայցեր',
    desc: 'Ընտրեք օգտատեր և զրոյացրեք նրա շրջայցերը — դրանք նորից ավտոմատ կմեկնարկեն հաջորդ այցի ժամանակ։',
    pick: 'Ընտրեք օգտատեր…',
    reset: 'Զրոյացնել շրջայցերը',
    you: ' (դուք)',
    done: 'Զրոյացվեց {n} դրոշ — {email}',
    none: 'Այս օգտատերը չուներ ավարտված շրջայցեր։',
    err: 'Չհաջողվեց զրոյացնել։',
  },
} as const;

export function TourReset({ users, meId }: { users: PickUser[]; meId: string }) {
  const locale = useLocale().locale;
  const t = DICT[locale] ?? DICT.en;
  const [uid, setUid] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const reset = async () => {
    if (!uid) return;
    setBusy(true); setMsg('');
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-tours' }),
      });
      const d = await res.json();
      if (res.ok) {
        setOk(true);
        const email = users.find((u) => u.id === uid)?.email ?? '';
        setMsg(d.cleared > 0 ? t.done.replace('{n}', String(d.cleared)).replace('{email}', email) : t.none);
      } else {
        setOk(false); setMsg(d.error || t.err);
      }
    } catch {
      setOk(false); setMsg(t.err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-border/60 bg-card/50 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight"><GraduationCap className="h-4 w-4 text-primary" /> {t.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={uid}
          onChange={(e) => { setUid(e.target.value); setMsg(''); }}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 sm:max-w-md"
          aria-label={t.pick}
        >
          <option value="">{t.pick}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {(u.name ? `${u.name} — ${u.email}` : u.email) + (u.id === meId ? t.you : '')}
            </option>
          ))}
        </select>
        <Button onClick={reset} disabled={!uid || busy} className="gap-1.5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} {t.reset}
        </Button>
      </div>
      {msg && <p className={`mt-2 text-sm ${ok ? 'text-primary' : 'text-red-500'}`}>{msg}</p>}
    </div>
  );
}
