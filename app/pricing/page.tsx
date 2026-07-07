import { getCurrentUser } from '@/lib/auth';
import { getActiveSubscription } from '@/lib/billing/subscriptions';
import { getEffectivePlans } from '@/lib/billing/plan-config';
import { getLocale } from '@/lib/i18n';
import { billingDict } from '@/lib/billing-dict';
import { PricingCards } from '@/components/billing/pricing-cards';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import type { PlanId } from '@/lib/billing/plans';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = billingDict(await getLocale());
  return { title: `${t.pricing.title} — Cinematic Kit` };
}

export default async function PricingPage() {
  const t = billingDict(await getLocale());
  const me = await getCurrentUser();
  const sub = me ? getActiveSubscription(me.id) : null;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="relative overflow-hidden px-4 py-20">
        {/* Ambient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t.pricing.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t.pricing.subtitle}</p>
        </div>
        <PricingCards currentPlan={(sub?.planId as PlanId | undefined) ?? null} plans={getEffectivePlans()} />
      </main>
      <SiteFooter />
    </div>
  );
}
