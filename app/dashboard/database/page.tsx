import { redirect } from 'next/navigation';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { listTables } from '@/lib/db-admin';
import { PageHeader } from '@/components/dashboard/ui';
import { DbBrowser } from '@/components/dashboard/db-browser';
import { StoragePanel } from '@/components/dashboard/storage-panel';

export const metadata = { title: 'База данных — Cinematic Kit' };
export const dynamic = 'force-dynamic';

export default async function DatabasePage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/database');
  if (!isSuperadmin(me)) redirect('/dashboard');

  return (
    <>
      <PageHeader title="База данных" description="Просмотр и редактирование таблиц. Изменения применяются немедленно — будьте внимательны." />
      <StoragePanel />
      <DbBrowser tables={listTables()} />
    </>
  );
}
