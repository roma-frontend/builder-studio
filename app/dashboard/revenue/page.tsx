import { redirect } from 'next/navigation';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { OrgRevenue } from '@/components/dashboard/org-revenue';

export const metadata = { title: 'Выручка — Builder Studio', robots: { index: false, follow: false } as const };
export const dynamic = 'force-dynamic';

// Superadmin-only: platform-managed commerce console (per-org revenue + payouts).
export default async function RevenuePage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/revenue');
  if (!isSuperadmin(me)) redirect('/dashboard');
  return <OrgRevenue />;
}
