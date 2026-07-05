import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/dashboard/ui';
import { OrgOnboarding } from '@/components/dashboard/org-onboarding';

export const metadata = { title: 'Организация — Cinematic Kit' };
export const dynamic = 'force-dynamic';

export default async function JoinOrgPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/join');

  return (
    <>
      <PageHeader title="Организация" description="Создайте свою организацию или присоединитесь к существующей. Заявку рассмотрит суперадмин." />
      <OrgOnboarding />
    </>
  );
}
