import { redirect } from 'next/navigation';
import { Mail, UserCircle, Crown, ShieldCheck, Calendar } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { statsForUser } from '@/lib/sites';
import { PageHeader } from '@/components/dashboard/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';

export const metadata = { title: 'Аккаунт — Cinematic Kit' };
export const dynamic = 'force-dynamic';

const ROLE = {
  superadmin: { label: 'Суперадмин', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', Icon: Crown },
  admin: { label: 'Админ', cls: 'bg-primary/15 text-primary', Icon: ShieldCheck },
  customer: { label: 'Клиент', cls: 'bg-muted text-muted-foreground', Icon: UserCircle },
} as const;

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard/account');
  const role = (user.role as keyof typeof ROLE) ?? 'customer';
  const meta = ROLE[role] ?? ROLE.customer;
  const stats = statsForUser(user.id);

  return (
    <>
      <PageHeader title="Аккаунт" description="Данные вашего профиля и сессии." />

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-black text-primary">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight">{user.name || 'Без имени'}</h2>
            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
              <meta.Icon className="h-3 w-3" /> {meta.label}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="truncate text-sm font-medium">{user.email}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Регистрация</dt>
              <dd className="truncate text-sm font-medium">{user.createdAt.toLocaleDateString('ru-RU')}</dd>
            </div>
          </div>
        </dl>

        <div className="mt-6 flex gap-6 border-t border-border/60 pt-5 text-sm">
          <div><span className="text-2xl font-black">{stats.sites}</span> <span className="text-muted-foreground">сайтов</span></div>
          <div><span className="text-2xl font-black">{stats.published}</span> <span className="text-muted-foreground">опубликовано</span></div>
          <div><span className="text-2xl font-black">{stats.submissions}</span> <span className="text-muted-foreground">заявок</span></div>
        </div>

        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
