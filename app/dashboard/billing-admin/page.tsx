import { redirect } from 'next/navigation';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { getLocale } from '@/lib/i18n';
import { billingDict } from '@/lib/billing-dict';
import { computeMetrics, listSubscriptions, listPayments } from '@/lib/billing/subscriptions';
import { getEffectivePlans } from '@/lib/billing/plan-config';
import { BillingAdminClient } from '@/components/billing/billing-admin-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = billingDict(await getLocale());
  return { title: `${t.admin.title} — Cinematic Kit` };
}

export default async function BillingAdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/billing-admin');
  if (!isSuperadmin(me)) redirect('/dashboard');

  const metrics = computeMetrics();
  const subscriptions = listSubscriptions();
  const payments = listPayments();

  return <BillingAdminClient metrics={metrics} subscriptions={subscriptions} payments={payments} plans={getEffectivePlans()} />;
}
