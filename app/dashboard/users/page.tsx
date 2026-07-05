import { redirect } from 'next/navigation';
import { getCurrentUser, isStaff, isSuperadmin } from '@/lib/auth';
import { listUsers } from '@/lib/admin';
import { PageHeader } from '@/components/dashboard/ui';
import { UsersTable } from '@/components/dashboard/users-table';

export const metadata = { title: 'Пользователи — Cinematic Kit' };
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/users');
  if (!isStaff(me)) redirect('/dashboard');

  const users = listUsers();
  const canEdit = isSuperadmin(me);

  return (
    <>
      <PageHeader
        title="Пользователи"
        description={canEdit ? 'Управляйте ролями и смотрите активность аккаунтов.' : 'Список аккаунтов платформы.'}
      />
      <UsersTable users={users} canEdit={canEdit} meId={me.id} />
    </>
  );
}
