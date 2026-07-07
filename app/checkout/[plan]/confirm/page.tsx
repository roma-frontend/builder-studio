import { notFound } from 'next/navigation';
import { isInterval, isPlanId, type BillingInterval, type PlanId } from '@/lib/billing/plans';
import { getEffectivePlan } from '@/lib/billing/plan-config';
import { CheckoutClient } from '@/components/billing/checkout-client';

export const dynamic = 'force-dynamic';

export default async function CheckoutConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ plan: string }>;
  searchParams: Promise<{ interval?: string }>;
}) {
  const { plan } = await params;
  const { interval } = await searchParams;
  if (!isPlanId(plan)) notFound();
  const iv: BillingInterval = isInterval(interval) ? interval : 'month';

  return (
    <main className="min-h-screen px-4 py-20">
      <CheckoutClient plan={getEffectivePlan(plan as PlanId)} interval={iv} mode="confirm" />
    </main>
  );
}
