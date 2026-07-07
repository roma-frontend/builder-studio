import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { getSiteForUser, getSite, listDomains, listSubmissions, APP_HOST } from '@/lib/sites';
import type { Site } from '@/lib/db';
import { getUserById } from '@/lib/admin';
import { listSiteUsers } from '@/lib/site-auth';
import { SiteSettings } from '@/components/dashboard/site-settings';
import { SiteMembers } from '@/components/dashboard/site-members';
import { TourLauncher } from '@/components/tour/tour-launcher';
import { getLocale } from '@/lib/i18n';
import { siteSettingsDict } from '@/lib/site-settings-dict';

// Superadmin-mode banner copy (inline ru/en/hy to stay self-contained).
const BANNER = {
  ru: { title: 'Режим суперадмина — вы управляете чужой организацией', owner: 'Владелец', back: 'К консоли организаций' },
  en: { title: 'Superadmin mode — you are managing another organization', owner: 'Owner', back: 'Back to org console' },
  hy: { title: 'Սուպերադմինի ռեժիմ — դուք կառավարում եք այլ կազմակերպություն', owner: 'Սեփականատեր', back: 'Դեպի կազմակերպությունների վահանակ' },
} as const;

export async function generateMetadata() {
  const t = siteSettingsDict(await getLocale());
  return { title: `${t.metaTitle} — Builder Studio` };
}
export const dynamic = 'force-dynamic';

export default async function SiteSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');

  const { id } = await params;
  // Owner sees their own site; a superadmin may open ANY org to manage its data
  // (the underlying APIs already allow superadmin via requireSiteOwner).
  let site: Site | null = getSiteForUser(user.id, id);
  if (!site && isSuperadmin(user)) site = getSite(id);
  if (!site) notFound();

  const locale = await getLocale();
  const managingAsSuper = site.userId !== user.id; // superadmin on someone else's org
  const owner = managingAsSuper ? getUserById(site.userId) : null;
  const bt = BANNER[locale] ?? BANNER.en;

  const settings = (
    <SiteSettings
      appHost={APP_HOST}
      serverIp={process.env.SERVER_IP || ''}
      site={{
        id: site.id,
        name: site.name,
        slug: site.slug,
        published: Boolean(site.publishedDoc),
        publishedAt: site.publishedAt?.toISOString() ?? null,
      }}
      initialDomains={listDomains(site.id).map((d) => ({
        id: d.id,
        hostname: d.hostname,
        verified: d.verified,
      }))}
      initialSubmissions={listSubmissions(site.id, 100).map((s) => ({
        id: s.id,
        formId: s.formId,
        data: JSON.parse(s.data) as Record<string, unknown>,
        createdAt: s.createdAt.toISOString(),
      }))}
      initialSiteUsers={listSiteUsers(site.id, 500).map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  );

  return (
    <div className="space-y-6">
      {managingAsSuper && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
          <Crown className="h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">{bt.title}</p>
            <p className="truncate opacity-90">{bt.owner}: {owner?.name || '—'}{owner?.email ? ` · ${owner.email}` : ''}</p>
          </div>
          <Link href="/dashboard/organizations" className="shrink-0 rounded-lg border border-amber-500/40 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-amber-500/15">
            {bt.back}
          </Link>
        </div>
      )}
      <SiteMembers siteId={site.id} memberApproval={site.memberApproval} settings={settings} />
      <TourLauncher tour="site-content" />
    </div>
  );
}
