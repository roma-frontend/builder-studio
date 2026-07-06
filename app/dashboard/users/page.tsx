import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff, isSuperadmin } from '@/lib/auth';
import { listUsers } from '@/lib/admin';
import { PageHeader } from '@/components/dashboard/ui';
import { UsersTable } from '@/components/dashboard/users-table';
import { getLocale } from '@/lib/i18n';
import { staffDict } from '@/lib/staff-dict';

export async function generateMetadata() {
  const t = staffDict(await getLocale());
  return { title: `${t.usersMetaTitle} — Cinematic Kit` };
}
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/users');
  if (!isStaff(me)) redirect('/dashboard');

  const t = staffDict(await getLocale());
  const users = listUsers();
  const canEdit = isSuperadmin(me);

  return (
    <>
      <PageHeader
        title={t.usersTitle}
        description={canEdit ? t.usersDescEdit : t.usersDescView}
      />
      <UsersTable users={users} canEdit={canEdit} meId={me.id} />
    </>
  );
}
