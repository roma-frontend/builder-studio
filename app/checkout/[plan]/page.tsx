import { notFound } from 'next/navigation';
import { isInterval, isPlanId, type BillingInterval, type PlanId } from '@/lib/billing/plans';
import { isCurrency, type Currency } from '@/lib/billing/currency';
import { getEffectivePlan } from '@/lib/billing/plan-config';
import { CheckoutClient } from '@/components/billing/checkout-client';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ plan: string }>;
  searchParams: Promise<{ interval?: string; currency?: string }>;
}) {
  const { plan } = await params;
  const { interval, currency } = await searchParams;
  if (!isPlanId(plan)) notFound();
  const iv: BillingInterval = isInterval(interval) ? interval : 'month';
  const cur: Currency = isCurrency(currency) ? currency : 'usd';

  return (
    <main className="min-h-screen px-4 py-20">
      <CheckoutClient plan={getEffectivePlan(plan as PlanId)} interval={iv} mode="pay" currency={cur} />
    </main>
  );
}
