'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';

// Member-facing plan picker / paywall. Shown in the tenant account area: if the
// org sells plans and the member has no active subscription, they pick one and
// are sent to Stripe Checkout on the platform account. Returning with
// ?sub=success&session_id=... reconciles + activates the subscription.

interface Plan {
  id: string; name: string; description: string; amountCents: number;
  currency: string; interval: 'month' | 'year'; perks: string[]; active: boolean;
}
interface Membership { plans: Plan[]; active: boolean; subscription: { status: string } | null }

const DICT = {
  ru: { title: 'Выберите план', subtitle: 'Оформите подписку, чтобы получить доступ к материалам организации.',
    active: 'Подписка активна', month: '/мес', year: '/год', subscribe: 'Оформить', redirecting: 'Переходим к оплате…',
    confirming: 'Подтверждаем оплату…', canceled: 'Оплата отменена.', failed: 'Оплата сейчас недоступна. Обратитесь к администратору платформы.',
    successTitle: 'Оплата прошла успешно', successBody: 'Подписка активирована. Теперь вам доступны материалы, курсы и документы организации.',
    goDashboard: 'Перейти в кабинет' },
  en: { title: 'Choose a plan', subtitle: 'Subscribe to unlock the organization’s content.',
    active: 'Subscription active', month: '/mo', year: '/yr', subscribe: 'Subscribe', redirecting: 'Redirecting to payment…',
    confirming: 'Confirming payment…', canceled: 'Payment canceled.', failed: 'Payment is unavailable right now. Contact the platform admin.',
    successTitle: 'Payment successful', successBody: 'Your subscription is active. You can now access the organization’s materials, courses, and documents.',
    goDashboard: 'Go to dashboard' },
  hy: { title: 'Ընտրեք պլան', subtitle: 'Բաժանորդագրվեք՝ կազմակերպության նյութերը բացելու համար։',
    active: 'Բաժանորդագրությունն ակտիվ է', month: '/ամիս', year: '/տարի', subscribe: 'Բաժանորդագրվել', redirecting: 'Անցում վճարման…',
    confirming: 'Հաստատում ենք վճարումը…', canceled: 'Վճարումը չեղարկվեց։', failed: 'Վճարումն այժմ անհասանելի է։ Դիմեք հարթակի ադմինին։',
    successTitle: 'Վճարումը հաջողվեց', successBody: 'Բաժանորդագրությունն ակտիվ է։ Այժմ հասանելի են կազմակերպության նյութերը, դասընթացները և փաստաթղթերը։',
    goDashboard: 'Անցնել կաբինետ' },
} as const;

async function api(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch('/api/site-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json().catch(() => ({}));
}

export function MemberPlans({ siteId }: { siteId: string }) {
  const locale = useLocale().locale as keyof typeof DICT;
  const t = DICT[locale] ?? DICT.en;
  const [data, setData] = useState<Membership | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [justPaid, setJustPaid] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/site-auth?site=${encodeURIComponent(siteId)}&resource=membership`);
    const d = await res.json().catch(() => ({}));
    if (d && Array.isArray(d.plans)) setData({ plans: d.plans, active: Boolean(d.active), subscription: d.subscription ?? null });
  }, [siteId]);

  // On return from Stripe (?sub=success|cancel) reconcile, then load status.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = new URLSearchParams(window.location.search);
        const sub = p.get('sub');
        if (sub === 'success' && p.get('session_id')) {
          setBusy('confirm'); setNote(t.confirming);
          const confirmed = await api({ action: 'subscribe-confirm', siteId, sessionId: p.get('session_id') });
          setJustPaid(Boolean(confirmed.active) || confirmed.ok !== false);
        } else if (sub === 'cancel') {
          setNote(t.canceled);
        }
        if (sub) {
          const url = new URL(window.location.href);
          url.searchParams.delete('sub'); url.searchParams.delete('session_id');
          window.history.replaceState(null, '', url.toString());
        }
      } catch { /* no window */ }
      if (alive) { setBusy(null); await load(); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const money = (cents: number, cur: string) =>
    new Intl.NumberFormat(locale === 'hy' ? 'hy-AM' : locale, { style: 'currency', currency: cur.toUpperCase(), maximumFractionDigits: 2 }).format(cents / 100);

  const subscribe = async (planId: string) => {
    setBusy(planId); setNote(t.redirecting);
    const d = await api({ action: 'subscribe', siteId, planId });
    if (typeof d.url === 'string') { window.location.assign(d.url); return; }
    setBusy(null); setNote(typeof d.error === 'string' ? d.error : t.failed);
    void load();
  };

  // Nothing to show: no plans, or already subscribed.
  if (!data || data.plans.length === 0) return null;
  if (data.active && justPaid) {
    return (
      <section className="mb-8 overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-card to-primary/10 p-6 shadow-xl shadow-emerald-500/10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t.successTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t.successBody}</p>
          <Button onClick={() => window.location.assign(window.location.pathname)} className="mt-6 gap-2">
            {t.goDashboard}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    );
  }
  if (data.active) {
    return (
      <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
        <Check className="h-4 w-4" /> {t.active}
      </div>
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-border bg-card/50 p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight">{t.title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.plans.map((p) => (
          <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-background/60 p-5">
            <h3 className="font-semibold">{p.name}</h3>
            <div className="mt-1 text-2xl font-bold">
              {money(p.amountCents, p.currency)}
              <span className="text-sm font-normal text-muted-foreground">{p.interval === 'year' ? t.year : t.month}</span>
            </div>
            {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
            {p.perks.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {p.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {perk}</li>
                ))}
              </ul>
            )}
            <Button onClick={() => subscribe(p.id)} disabled={busy !== null} className="mt-5 w-full gap-2">
              {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.subscribe}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
