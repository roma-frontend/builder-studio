'use client';

// Superadmin capability matrix: toggle which dashboard sections each managed
// role (currently `admin`) may access. Talks to /api/admin/access.

import { useEffect, useState } from 'react';
import { Loader2, Check, X, Clock } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { dashDict } from '@/lib/dashboard-dict';

interface Grant { role: string; capability: string; expiresAt: string }
interface Matrix { matrix: Record<string, Record<string, boolean>>; capabilities: { key: string; kind: string }[]; grants: Grant[] }

const CHROME = {
  ru: { loading: 'Загрузка…', saveErr: 'Не удалось сохранить', enabled: 'Включено', disabled: 'Выключено', section: 'Раздел', grant: 'Выдать на 1 ч', granted: 'до', revoke: 'Отозвать', legend: 'Суперадмин не ограничивается. Переключатели управляют доступом роли к разделам дашборда. Для выключенного раздела можно выдать временный доступ на час.' },
  en: { loading: 'Loading…', saveErr: 'Could not save', enabled: 'Enabled', disabled: 'Disabled', section: 'Section', grant: 'Grant for 1h', granted: 'until', revoke: 'Revoke', legend: 'Superadmin is never restricted. Toggles control each role\u2019s access to dashboard sections. A disabled section can be granted temporarily for an hour.' },
  hy: { loading: 'Բեռնում…', saveErr: 'Չհաջողվեց պահել', enabled: 'Միացված', disabled: 'Անջատված', section: 'Բաժին', grant: 'Տալ 1 ժ', granted: 'մինչև', revoke: 'Հետ կանչել', legend: 'Գերադմինը չի սահմանափակվում։ Փոխարկիչները կառավարում են հասանելիությունը։ Անջատված բաժնի համար կարելի է տալ ժամանակավոր հասանելիություն։' },
} as const;

export function AccessMatrix() {
  const locale = useLocale().locale as keyof typeof CHROME;
  const t = dashDict(locale);
  const c = CHROME[locale] ?? CHROME.en;
  const [data, setData] = useState<Matrix | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/admin/access').then((r) => r.json()).then(setData).catch(() => setErr(c.saveErr));
  }, [c.saveErr]);

  const label = (key: string) => (t.nav as Record<string, string>)[key] ?? key;

  const send = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    setErr('');
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || c.saveErr);
      setData({ matrix: json.matrix, capabilities: json.capabilities, grants: json.grants });
    } catch {
      setErr(c.saveErr);
    } finally {
      setBusy(null);
    }
  };

  const toggle = (role: string, capability: string, next: boolean) => send(`${role}:${capability}`, { role, capability, enabled: next });
  const grant = (role: string, capability: string) => send(`g:${role}:${capability}`, { role, capability, action: 'grant', minutes: 60 });
  const revoke = (role: string, capability: string) => send(`g:${role}:${capability}`, { role, capability, action: 'revoke' });
  const grantFor = (role: string, capability: string) => data?.grants.find((g) => g.role === role && g.capability === capability);

  if (!data) {
    return <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {c.loading}</div>;
  }

  const roles = Object.keys(data.matrix);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{c.legend}</p>
      {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      <div className="overflow-hidden rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">{c.section}</th>
              {roles.map((r) => (
                <th key={r} className="px-4 py-3 text-center font-semibold">{(t.roles as Record<string, string>)[r] ?? r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.capabilities.map((cap) => (
              <tr key={cap.key} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{label(cap.key)}</td>
                {roles.map((role) => {
                  const on = data.matrix[role][cap.key];
                  const id = `${role}:${cap.key}`;
                  const g = grantFor(role, cap.key);
                  return (
                    <td key={role} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busy === id}
                          onClick={() => toggle(role, cap.key, !on)}
                          aria-pressed={on}
                          aria-label={`${label(cap.key)} — ${on ? c.enabled : c.disabled}`}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted'} ${busy === id ? 'opacity-60' : ''}`}
                        >
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-background shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}>
                            {busy === id ? <Loader2 className="h-3 w-3 animate-spin" /> : on ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-muted-foreground" />}
                          </span>
                        </button>
                        {!on && (
                          g ? (
                            <button
                              type="button"
                              disabled={busy === `g:${id}`}
                              onClick={() => revoke(role, cap.key)}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
                            >
                              <Clock className="h-2.5 w-2.5" /> {c.granted} {new Date(g.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {c.revoke}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy === `g:${id}`}
                              onClick={() => grant(role, cap.key)}
                              className="text-[10px] font-medium text-primary hover:underline disabled:opacity-60"
                            >
                              {busy === `g:${id}` ? '…' : c.grant}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
