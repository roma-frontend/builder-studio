import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, ChevronRight, Building2 } from 'lucide-react';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { listSitesForUser } from '@/lib/sites';
import { pendingCountsBySite } from '@/lib/site-membership';
import { getLocale } from '@/lib/i18n';
import { dashDict } from '@/lib/dashboard-dict';

export async function generateMetadata() {
  return { title: `${dashDict(await getLocale()).nav.members} — Builder Studio` };
}
export const dynamic = 'force-dynamic';

const COPY: Record<string, { title: string; subtitle: string; empty: string; create: string; pending: (n: number) => string }> = {
  ru: {
    title: 'Пользователи организации',
    subtitle: 'Выберите организацию, чтобы просмотреть её участников.',
    empty: 'У вас пока нет организации. Создайте её, чтобы приглашать участников.',
    create: 'К организациям',
    pending: (n) => `${n} на рассмотрении`,
  },
  en: {
    title: 'Organization users',
    subtitle: 'Pick an organization to view its members.',
    empty: "You don't have an organization yet. Create one to invite members.",
    create: 'Go to organizations',
    pending: (n) => `${n} pending`,
  },
  hy: {
    title: 'Կազմակերպության օգտատերեր',
    subtitle: 'Ընտրեք կազմակերպությունը՝ դրա մասնակիցները դիտելու համար։',
    empty: 'Դուք դեռ չունեք կազմակերպություն։ Ստեղծեք այն՝ մասնակիցներ հրավիրելու համար։',
    create: 'Դեպի կազմակերպություններ',
    pending: (n) => `${n} սպասման մեջ`,
  },
};

export default async function MembersRouterPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard/members');
  // Superadmins run the platform; they don't own an organization to manage members for.
  if (isSuperadmin(user)) redirect('/dashboard/organizations');

  const owned = listSitesForUser(user.id);

  const locale = await getLocale();
  const t = COPY[locale] ?? COPY.en;
  const pending = pendingCountsBySite(owned.map((s) => s.id));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      {owned.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">{t.empty}</p>
          <Link href="/dashboard/join" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Building2 className="h-4 w-4" /> {t.create}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {owned.map((s) => {
            const p = pending[s.id] ?? 0;
            return (
              <li key={s.id}>
                <Link
                  href={`/dashboard/sites/${s.id}?tab=members`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-3 transition hover:border-primary/40 hover:bg-muted/40"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">/{s.slug}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {p > 0 && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600">{t.pending(p)}</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
