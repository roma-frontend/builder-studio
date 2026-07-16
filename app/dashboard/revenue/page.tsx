import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff, isSuperadmin } from '@/lib/auth';
import { isCapabilityEnabled } from '@/lib/access';
import { OrgRevenue } from '@/components/dashboard/org-revenue';

export const metadata = { title: 'Выручка — Builder Studio', robots: { index: false, follow: false } as const };
export const dynamic = 'force-dynamic';

// Capability-gated read access; recording payouts remains superadmin-only.
export default async function RevenuePage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/revenue');
  if (!isStaff(me) || !isCapabilityEnabled(me.role, 'revenue')) redirect('/dashboard');
  return <OrgRevenue canEdit={isSuperadmin(me)} />;
}
