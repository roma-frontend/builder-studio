import { redirect } from 'next/navigation';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { listAllSites } from '@/lib/admin';
import { PageHeader, EmptyState } from '@/components/dashboard/ui';
import { OrgManager } from '@/components/dashboard/org-manager';
import { Building2 } from 'lucide-react';

export const metadata = { title: 'Организации — Cinematic Kit' };
export const dynamic = 'force-dynamic';

export default async function OrganizationsPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/organizations');
  if (!isSuperadmin(me)) redirect('/dashboard');

  const sites = listAllSites().map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    ownerName: s.ownerName,
    ownerEmail: s.ownerEmail,
    published: s.published,
  }));

  return (
    <>
      <PageHeader title="Организации" description="Выберите организацию, чтобы увидеть её данные и назначить администратора." />
      {sites.length === 0 ? <EmptyState icon={Building2} title="Организаций пока нет" /> : <OrgManager sites={sites} />}
    </>
  );
}
