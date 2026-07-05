import { redirect } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { listSubmissionsForUser } from '@/lib/sites';
import { PageHeader, EmptyState } from '@/components/dashboard/ui';

export const metadata = { title: 'Заявки — Cinematic Kit' };
export const dynamic = 'force-dynamic';

function fields(json: string): [string, string][] {
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    return Object.entries(obj).map(([k, v]) => [k, String(v)]);
  } catch {
    return [];
  }
}

export default async function SubmissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard/submissions');

  const rows = listSubmissionsForUser(user.id);

  return (
    <>
      <PageHeader title="Заявки" description="Все обращения из форм на ваших сайтах." />
      {rows.length === 0 ? (
        <EmptyState icon={Inbox} title="Пока нет заявок" description="Как только посетитель отправит форму, она появится здесь." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/60 bg-card/50 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-2 py-0.5 font-semibold uppercase">{r.formId}</span>
                <span className="font-medium text-foreground">{r.siteName}</span>
                <span className="text-muted-foreground/70">/s/{r.siteSlug}</span>
                <span className="ml-auto">{r.createdAt.toLocaleString('ru-RU')}</span>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {fields(r.data).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="shrink-0 font-medium text-muted-foreground">{k}:</span>
                    <span className="min-w-0 break-words">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
