import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getLocale } from '@/lib/i18n';
import { billingDict } from '@/lib/billing-dict';
import { getActiveSubscription, listUserPayments } from '@/lib/billing/subscriptions';
import { stripeConfigured } from '@/lib/billing/provider';
import { BillingClient, type MySubDTO, type InvoiceDTO } from '@/components/billing/billing-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = billingDict(await getLocale());
  return { title: `${t.mine.title} — Cinematic Kit` };
}

export default async function MyBillingPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/billing');

  const sub = getActiveSubscription(me.id);
  const payments = listUserPayments(me.id);

  const subDTO: MySubDTO | null = sub
    ? {
        planId: sub.planId,
        status: sub.status,
        interval: sub.interval,
        amount: sub.amount,
        currency: sub.currency,
        currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        provider: sub.provider,
      }
    : null;

  const invoices: InvoiceDTO[] = payments.map((p) => ({
    id: p.id,
    invoiceNumber: p.invoiceNumber,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  }));

  return <BillingClient sub={subDTO} invoices={invoices} stripeMode={stripeConfigured()} />;
}
