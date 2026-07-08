'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Loader2, ArrowRight, Gift } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { billingDict, fill } from '@/lib/billing-dict';
import {
  defaultPlanDTOs,
  formatPrice,
  monthlyEquivalentDTO,
  yearlySavingPctDTO,
  type BillingInterval,
  type PlanDTO,
  type PlanId,
} from '@/lib/billing/plans';

export function PricingCards({
  currentPlan,
  plans,
}: {
  currentPlan?: PlanId | null;
  plans?: PlanDTO[];
}) {
  const { locale } = useLocale();
  const t = billingDict(locale);
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [loading, setLoading] = useState<PlanId | null>(null);
  const list = plans && plans.length ? plans : defaultPlanDTOs();
  const priceLocale = locale === 'en' ? 'en-US' : locale;

  const choose = async (planId: PlanId) => {
    setLoading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      });
      if (res.status === 401) {
        router.push(`/login?next=/checkout/${planId}?interval=${interval}`);
        return;
      }
      const data = await res.json();
      if (data.url) router.push(data.url);
    } finally {
      setLoading(null);
    }
  };

  const savingSample = list.find((p) => p.popular) ?? list[0];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-10 flex items-center justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1 backdrop-blur">
          {(['month', 'year'] as BillingInterval[]).map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={cn(
                'relative rounded-full px-5 py-2 text-sm font-medium transition-all',
                interval === iv ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {iv === 'month' ? t.pricing.monthly : t.pricing.yearly}
              {iv === 'year' && savingSample && (
                <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {fill(t.pricing.save, { n: yearlySavingPctDTO(savingSample) })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {list.map((plan) => {
          const price = monthlyEquivalentDTO(plan, interval);
          const isCurrent = currentPlan === plan.id;
          const popular = plan.popular;
          return (
            <div
              key={plan.id}
              className={cn(
                'group relative flex flex-col rounded-2xl border bg-card p-6 backdrop-blur transition-all duration-300',
                'hover:-translate-y-1 hover:shadow-2xl',
                popular ? 'border-primary/60 shadow-lg md:-translate-y-2' : 'border-border',
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `radial-gradient(120% 120% at 50% 0%, ${plan.accent}22, transparent 60%)` }}
              />
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                  <Sparkles className="mr-1 inline size-3" />
                  {t.pricing.popular}
                </span>
              )}

              <div className="relative">
                <h3 className="text-xl font-bold" style={{ color: plan.accent }}>
                  {plan.name || t.planName[plan.id]}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline || t.planTagline[plan.id]}</p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{formatPrice(price, plan.currency, priceLocale)}</span>
                  <span className="mb-1 text-sm text-muted-foreground">{t.pricing.perMonth}</span>
                </div>
                {interval === 'year' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fill(t.pricing.billedYearly, { price: formatPrice(plan.priceYear, plan.currency) })}
                  </p>
                )}
                {plan.trialDays > 0 && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Gift className="size-3" />
                    {fill(t.pricing.trialBadge, { n: plan.trialDays })}
                  </p>
                )}

                <Button
                  onClick={() => choose(plan.id)}
                  disabled={loading !== null || isCurrent}
                  variant={popular ? 'default' : 'outline'}
                  className="mt-6 w-full"
                >
                  {loading === plan.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isCurrent ? (
                    t.pricing.current
                  ) : (
                    <>
                      {t.pricing.choose}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>

                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-start gap-2 font-medium">
                    <Check className="mt-0.5 size-4 shrink-0" style={{ color: plan.accent }} />
                    {plan.sites === null ? t.limits.sitesUnlimited : fill(t.limits.sites, { n: plan.sites })}
                  </li>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: plan.accent }} />
                      {t.feature[f]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
