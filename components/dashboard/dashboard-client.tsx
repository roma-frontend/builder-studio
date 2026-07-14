'use client';

// Sites manager (content only — chrome comes from the dashboard shell):
// create a site, toggle publish, quick links to studio / preview / settings.

import { useState, useEffect, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Loader2, Pencil, ExternalLink, Settings2, Globe, Rocket, CircleDashed, Clock, Users, QrCode, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader, EmptyState } from '@/components/dashboard/ui';
import { PublishCelebration } from '@/components/dashboard/publish-celebration';
import { SITE_MEMBERS_SEEN_EVENT } from '@/components/dashboard/site-members-badge';
import { useLocale } from '@/hooks/use-locale';
import { dashDict } from '@/lib/dashboard-dict';
import { TourLauncher } from '@/components/tour/tour-launcher';
import type { ReadinessReport } from '@/lib/site-readiness';

export interface DashSite {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  updatedAt: string;
  pendingMembers?: number;
  liveUrl: string;
}

export function DashboardClient({ initialSites, canInvite = true, autoCreate = false, userName = '' }: { initialSites: DashSite[]; canInvite?: boolean; autoCreate?: boolean; userName?: string }) {
  const router = useRouter();
  const locale = useLocale().locale;
  const d = dashDict(locale);
  const t = d.sites;
  const automationHint = locale === 'ru'
    ? 'Следующий шаг уже подготовлен: проверьте название и создайте сайт.'
    : locale === 'hy'
      ? 'Հաջորդ քայլն արդեն պատրաստ է․ ստուգեք անունը և ստեղծեք կայքը։'
      : 'Your next step is ready: review the name and create your site.';
  const c = d.command;
  const [sites, setSites] = useState(initialSites);
  const [newName, setNewName] = useState(() => autoCreate && userName.trim() ? `${userName.trim()} — первый сайт` : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pubBusy, setPubBusy] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<{ url: string; readiness?: ReadinessReport } | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Opening «Мои сайты» = the owner has seen the pending requests surfaced here,
  // so clear the blinking nav badge.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(SITE_MEMBERS_SEEN_EVENT));
  }, []);

  useEffect(() => {
    if (!autoCreate) return;
    const timer = window.setTimeout(() => {
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [autoCreate]);

  const createSite = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t.createFailed); return; }
      router.push(`/studio/builder?site=${data.site.id}`);
    } catch {
      setError(t.networkError);
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (site: DashSite) => {
    setPubBusy(site.id);
    try {
      const res = await fetch(`/api/sites/${site.id}/publish`, { method: site.published ? 'DELETE' : 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSites((list) => list.map((s) => (s.id === site.id ? { ...s, published: !site.published } : s)));
        // Publishing (not unpublishing) is the "moment of delight".
        if (!site.published) setCelebrate({ url: site.liveUrl, readiness: data.readiness });
      } else if (res.status === 403) {
        // Value-first: publishing is a paid moment — send free users to pricing.
        router.push('/pricing');
      } else setError(data.error || t.publishError);
    } finally {
      setPubBusy(null);
    }
  };

  return (
    <>
      <PageHeader title={t.title} description={t.subtitle} />

      {autoCreate && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/[0.07] px-4 py-3 text-sm text-foreground" role="status">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span>{automationHint}</span>
        </div>
      )}
      <form onSubmit={createSite} className={`flex flex-col gap-2 rounded-2xl border bg-card/50 p-4 sm:flex-row sm:items-center ${autoCreate ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-border/60'}`} data-tour="create-site">
        <Input
          ref={nameInputRef}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t.newNamePlaceholder}
          className="sm:max-w-md"
          aria-label={t.newNamePlaceholder}
        />
        <Button type="submit" disabled={busy || !newName.trim()} className="gap-1.5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t.create}
        </Button>
        {error && <p className="text-sm text-red-500 sm:ml-2" role="alert">{error}</p>}
      </form>

      {sites.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Globe} title={t.emptyTitle} description={t.emptyDesc} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {sites.map((site, idx) => (
            <div key={site.id} data-tour={idx === 0 ? 'site-card' : undefined} className="group rounded-2xl border border-border/60 bg-card/50 p-5 transition-all hover:border-primary/35 hover:shadow-md">
              <div className="mb-5">
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"><span>{c.launchPath}</span><span className={site.published ? 'text-green-500' : 'text-primary'}>{site.published ? t.published : c.inProgress}</span></div>
                <div className="mt-2 flex gap-1.5" aria-label={site.published ? t.published : c.inProgress}>
                  <span className="h-1.5 flex-1 rounded-full bg-primary" />
                  <span className="h-1.5 flex-1 rounded-full bg-primary" />
                  <span className={`h-1.5 flex-1 rounded-full ${site.published ? 'bg-green-500' : 'bg-muted'}`} />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{c.idea}</span><span>{c.design}</span><span>{c.launch}</span></div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold tracking-tight">{site.name}</h2>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{site.liveUrl.replace(/^https?:\/\//, '')}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${site.published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {site.published ? <Rocket className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
                  {site.published ? t.published : t.draft}
                </span>
              </div>

              {!!site.pendingMembers && (
                <Link
                  href={`/dashboard/sites/${site.id}?tab=members`}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/15 dark:text-amber-400"
                >
                  <Clock className="h-4 w-4" />
                  {site.pendingMembers === 1 ? t.reqOne : t.reqMany.replace('{n}', String(site.pendingMembers))}
                  <span className="ml-auto text-xs font-normal opacity-80">{t.review}</span>
                </Link>
              )}
              <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.05] px-3 py-2.5">
                <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-foreground">{site.published ? c.readiness : c.nextStep}</span><span className={`font-black ${site.published ? 'text-green-500' : 'text-primary'}`}>{site.published ? '100%' : '55%'}</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${site.published ? 'bg-green-500' : 'bg-primary'}`} style={{ width: site.published ? '100%' : '55%' }} /></div>
                {!site.published && <p className="mt-2 text-xs text-muted-foreground">{c.draftTip}</p>}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={`/studio/builder?site=${site.id}`} data-tour={idx === 0 ? 'site-edit' : undefined}>
                  <Button size="sm" className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> {t.edit}</Button>
                </Link>
                <Link href={site.published ? site.liveUrl : `/s/${site.slug}?draft=1`} target="_blank">
                  <Button size="sm" variant="outline" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> {t.open}</Button>
                </Link>
                <Button size="sm" variant="outline" disabled={pubBusy === site.id} onClick={() => togglePublish(site)} className="gap-1.5">
                  {pubBusy === site.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                  {site.published ? t.unpublish : t.publish}
                </Button>
                {canInvite && (
                  <Link href={`/dashboard/sites/${site.id}#invite`}>
                    <Button size="sm" variant="outline" className="gap-1.5"><QrCode className="h-3.5 w-3.5" /> {t.invite}</Button>
                  </Link>
                )}
                <Link href={`/dashboard/sites/${site.id}?tab=members`}>
                  <Button size="sm" variant="outline" className="gap-1.5"><Users className="h-3.5 w-3.5" /> {t.members}</Button>
                </Link>
                <Link href={`/dashboard/sites/${site.id}`} data-tour={idx === 0 ? 'site-settings' : undefined}>
                  <Button size="sm" variant="ghost" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" /> {t.settings}</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      <TourLauncher tour="dashboard-sites" />
      <PublishCelebration open={!!celebrate} liveUrl={celebrate?.url ?? ''} readiness={celebrate?.readiness} onClose={() => setCelebrate(null)} />
    </>
  );
}
