'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck, Lock, ArrowLeft, Gift } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { Button } from '@/components/ui/button';
import { billingDict, fill } from '@/lib/billing-dict';
import { type BillingInterval, type PlanDTO } from '@/lib/billing/plans';
import { type Currency, planAmount, formatMoney } from '@/lib/billing/currency';

export function CheckoutClient({
  plan,
  interval,
  mode,
  currency = 'usd',
}: {
  plan: PlanDTO;
  interval: BillingInterval;
  mode: 'pay' | 'confirm';
  currency?: Currency;
}) {
  const { locale } = useLocale();
  const t = billingDict(locale);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const amount = currency === 'usd' ? (interval === 'year' ? plan.priceYear : plan.priceMonth) : planAmount(plan.id, interval, currency);
  const money = (minor: number) => formatMoney(minor, currency);
  const per = interval === 'year' ? t.pricing.perYear : t.pricing.perMonth;
  const hasTrial = plan.trialDays > 0;

  const submit = async () => {
    setLoading(true);
    try {
      const endpoint = mode === 'confirm' ? '/api/billing/confirm' : '/api/billing/checkout';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, interval, currency }),
      });
      if (res.status === 401) {
        router.push(`/login?next=/checkout/${plan.id}?interval=${interval}%26currency=${currency}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (mode === 'confirm') {
        router.push(res.ok ? '/billing/success' : '/billing/cancel');
      } else if (data.url) {
        router.push(data.url);
      } else {
        router.push('/billing/cancel');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <Link href="/pricing" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t.checkout.back}
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/70 p-8 shadow-xl backdrop-blur">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${plan.accent}, transparent)` }}
        />
        <h1 className="text-2xl font-bold">{t.checkout.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.checkout.summary}</p>

        <div className="mt-6 space-y-4 rounded-xl border border-border/60 bg-muted/30 p-5">
          <Row label={t.checkout.plan} value={plan.name || t.planName[plan.id]} accent={plan.accent} />
          <Row label={t.checkout.interval} value={t.interval[interval]} />
          <div className="my-2 h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">{t.checkout.total}</span>
            <span className="text-2xl font-extrabold" style={{ color: plan.accent }}>
              {money(amount)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">{per}</span>
            </span>
          </div>
          {hasTrial && (
            <p className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Gift className="size-3.5" />
              {fill(t.pricing.trialBadge, { n: plan.trialDays })} · {fill(t.pricing.trialThen, { price: money(amount), per })}
            </p>
          )}
        </div>

        {hasTrial && (
          <p className="mt-4 rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            {fill(t.checkout.trialNote, { n: plan.trialDays })}
          </p>
        )}
        {mode === 'confirm' && !hasTrial && (
          <p className="mt-4 rounded-lg bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
            {t.checkout.manualNote}
          </p>
        )}

        <Button onClick={submit} disabled={loading} size="lg" className="mt-6 w-full">
          {loading ? <Loader2 className="size-5 animate-spin" /> : (
            <>
              <Lock className="size-4" />
              {hasTrial ? t.checkout.startTrial : mode === 'confirm' ? t.checkout.confirmManual : t.checkout.pay}
            </>
          )}
        </Button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          {t.checkout.securedBy}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
    </div>
  );
}
