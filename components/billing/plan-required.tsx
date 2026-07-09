'use client';

import { Lock } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { billingDict } from '@/lib/billing-dict';
import { PricingCards } from '@/components/billing/pricing-cards';
import type { PlanDTO, PlanId } from '@/lib/billing/plans';

/**
 * Dashboard paywall shown to an organization owner whose subscription is not
 * active (never subscribed / trial ended / period lapsed). Explains why and
 * renders the plan cards so they can subscribe and reopen the org in one place.
 * The superadmin never sees this (handled by the caller).
 */
export function PlanRequired({
  reason,
  plans,
  currentPlan,
}: {
  reason: 'none' | 'trial_ended' | 'lapsed';
  plans?: PlanDTO[];
  currentPlan?: PlanId | null;
}) {
  const { locale } = useLocale();
  const t = billingDict(locale);
  const note = reason === 'trial_ended' ? t.paywall.trialEnded : reason === 'lapsed' ? t.paywall.lapsed : t.paywall.subtitle;

  return (
    <div className="mx-auto w-full max-w-6xl py-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10">
          <Lock className="size-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.paywall.title}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{note}</p>
      </div>
      <PricingCards plans={plans} currentPlan={currentPlan} />
    </div>
  );
}
