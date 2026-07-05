import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Rocket, CircleDashed, ExternalLink, LayoutList } from 'lucide-react';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { listAllSites } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { PageHeader, EmptyState } from '@/components/dashboard/ui';

export const metadata = { title: 'Все сайты — Cinematic Kit' };
export const dynamic = 'force-dynamic';

export default async function AllSitesPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login?next=/dashboard/all-sites');
  if (!isStaff(me)) redirect('/dashboard');

  const sites = listAllSites();

  return (
    <>
      <PageHeader title="Все сайты" description="Каждый сайт на платформе и его владелец." />
      {sites.length === 0 ? (
        <EmptyState icon={LayoutList} title="Сайтов пока нет" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Сайт</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Владелец</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Обновлён</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sites.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">/s/{s.slug}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <p className="truncate">{s.ownerName || '—'}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.ownerEmail}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{new Date(s.updatedAt).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {s.published ? <Rocket className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
                      {s.published ? 'Опубликован' : 'Черновик'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/s/${s.slug}?draft=1`} target="_blank">
                      <Button size="sm" variant="ghost" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Открыть</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
