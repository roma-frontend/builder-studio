import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Crown } from 'lucide-react';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { getSiteForUser, getSite, listDomains, listSubmissions, APP_HOST } from '@/lib/sites';
import type { Site } from '@/lib/db';
import { getUserById } from '@/lib/admin';
import { listSiteUsers } from '@/lib/site-auth';
import { SiteSettings } from '@/components/dashboard/site-settings';
import { SiteMembers } from '@/components/dashboard/site-members';
import { OrgInviteQr } from '@/components/dashboard/org-invite-qr';
import { SitePlans } from '@/components/dashboard/site-plans';
import { listPlansForAdmin } from '@/lib/site-plans';
import { orgBilling } from '@/lib/org-billing';
import { TourLauncher } from '@/components/tour/tour-launcher';
import { getLocale } from '@/lib/i18n';
import { siteSettingsDict } from '@/lib/site-settings-dict';
import { siteUrl } from '@/lib/seo';
import { signSiteInvite } from '@/lib/site-invite';

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

export default async function SiteSettingsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/dashboard');

  const { id } = await params;
  const requestedTab = (await searchParams).tab;
  // Owner sees their own site; a superadmin may open ANY org to manage its data
  // (the underlying APIs already allow superadmin via requireSiteOwner).
  let site: Site | null = getSiteForUser(user.id, id);
  if (!site && isSuperadmin(user)) site = getSite(id);
  if (!site) notFound();

  const locale = await getLocale();
  const managingAsSuper = site.userId !== user.id; // superadmin on someone else's org
  const owner = managingAsSuper ? getUserById(site.userId) : null;
  const bt = BANNER[locale] ?? BANNER.en;

  // Platform-managed commerce: this org's earnings snapshot (collected on the
  // platform Stripe, settled by the superadmin). Shown to the admin as balance.
  const billing = orgBilling(site.id);
  const fmtMoney = (cents: number) =>
    new Intl.NumberFormat(locale === 'hy' ? 'hy-AM' : locale, { style: 'currency', currency: billing.currency.toUpperCase(), maximumFractionDigits: 2 }).format(cents / 100);
  const balT = ({
    ru: { title: 'Ваш баланс', earned: 'Заработано', paidOut: 'Выплачено', balance: 'К выплате', hint: 'Оплаты участников собираются платформой; выплаты обрабатывает суперадмин.' },
    en: { title: 'Your balance', earned: 'Earned', paidOut: 'Paid out', balance: 'Owed to you', hint: 'Member payments are collected by the platform; payouts are handled by the superadmin.' },
    hy: { title: 'Ձեր մնացորդը', earned: 'Վաստակած', paidOut: 'Վճարված', balance: 'Ձեզ ենթակա', hint: 'Վճարումները հավաքում է հարթակը, վճարումները՝ սուպերադմինը։' },
  } as Record<string, { title: string; earned: string; paidOut: string; balance: string; hint: string }>)[locale] ?? { title: 'Your balance', earned: 'Earned', paidOut: 'Paid out', balance: 'Owed to you', hint: '' };

  // Shareable invite: QR + link to this org's registration page. Generated as a
  // data-URL server-side (no runtime third-party calls). Not for superadmins —
  // they run the platform, they don't own an organization to invite people to.
  const canInvite = !isSuperadmin(user);
  const joinUrl = `${siteUrl(site.slug, '/register')}?invite=${signSiteInvite(site.id)}`;
  const qrDataUrl = canInvite
    ? await QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#0a0a0a', light: '#ffffff' },
      })
    : '';

  const settings = (
    <SiteSettings
      appHost={APP_HOST}
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
        provisioningProvider: d.provisioningProvider,
        provisioningStatus: d.provisioningStatus,
        provisioningError: d.provisioningError,
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
      {canInvite && (
        <OrgInviteQr
          orgName={site.name}
          slug={site.slug}
          joinUrl={joinUrl}
          qrDataUrl={qrDataUrl}
          memberApproval={Boolean(site.memberApproval)}
        />
      )}
      {billing.collectedCents > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <h3 className="font-bold tracking-tight">{balT.title}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">{balT.earned}</p>
              <p className="mt-1 text-2xl font-bold">{fmtMoney(billing.collectedCents - billing.feeCents)}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-xs text-muted-foreground">{balT.paidOut}</p>
              <p className="mt-1 text-2xl font-bold">{fmtMoney(billing.paidOutCents)}</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">{balT.balance}</p>
              <p className="mt-1 text-2xl font-bold text-primary">{fmtMoney(billing.balanceCents)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{balT.hint}</p>
        </section>
      )}
      <SitePlans siteId={site.id} initial={listPlansForAdmin(site.id)} />
      <SiteMembers siteId={site.id} memberApproval={site.memberApproval} settings={settings} initialTab={requestedTab === 'members' ? 'members' : undefined} />
      <TourLauncher tour="site-content" />
    </div>
  );
}
