'use client';

// Superadmin global view of tenant users (site_users): search, see which
// organization each belongs to, reassign their organization and set status.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/hooks/use-locale';
import { dashDict } from '@/lib/dashboard-dict';

type TUser = { id: string; name: string; email: string; status: string; siteId: string; siteName: string; siteSlug: string; createdAt: string };
type Org = { id: string; name: string; slug: string };

const STATUS_CLS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-600',
  approved: 'bg-green-500/15 text-green-600',
  rejected: 'bg-red-500/15 text-red-500',
  suspended: 'bg-red-500/15 text-red-500',
};

export function TenantUsers() {
  const d = dashDict(useLocale().locale);
  const t = d.tenantUsers;
  const [users, setUsers] = useState<TUser[] | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [draftOrg, setDraftOrg] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    fetch('/api/admin/tenant-users').then((r) => r.json()).then((d) => { setUsers(d.users ?? []); setOrgs(d.organizations ?? []); }).catch(() => setUsers([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  const assign = async (u: TUser) => {
    const target = draftOrg[u.id] ?? u.siteId;
    if (target === u.siteId) return;
    setBusy(u.id);
    setError('');
    try {
      const res = await fetch('/api/admin/tenant-users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assign-org', userId: u.id, targetSiteId: target }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t.error);
        return;
      }
      load();
    } catch {
      setError(t.error);
    } finally {
      setBusy('');
    }
  };
  const setStatus = async (u: TUser, status: string) => {
    setBusy(u.id);
    await fetch('/api/admin/tenant-users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set-status', userId: u.id, status }) });
    setBusy(''); load();
  };

  if (users === null) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const filtered = users.filter((u) => `${u.name} ${u.email} ${u.siteName} ${u.siteSlug}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="h-10 pl-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border/60 text-sm text-muted-foreground">
          <Users className="mr-2 h-5 w-5" /> {t.noUsers}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const meta = { label: d.members.status[u.status as keyof typeof d.members.status] ?? u.status, cls: STATUS_CLS[u.status] ?? STATUS_CLS.approved };
            const target = draftOrg[u.id] ?? u.siteId;
            return (
              <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{(u.name || u.email).charAt(0).toUpperCase()}</div>
                <div className="min-w-0 basis-full flex-1 sm:min-w-[220px] sm:basis-auto">
                  <p className="truncate text-sm font-medium">{u.name || t.noName} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span></p>
                  <p className="truncate text-xs text-muted-foreground">{u.email} · {t.now} {u.siteName} (/s/{u.siteSlug})</p>
                </div>
                <select value={target} onChange={(e) => setDraftOrg((d) => ({ ...d, [u.id]: e.target.value }))}
                  className="h-9 max-w-44 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary">
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <Button size="sm" className="gap-1.5" disabled={busy === u.id || target === u.siteId} onClick={() => assign(u)}>
                  {busy === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t.assign}
                </Button>
                {u.status !== 'approved' ? (
                  <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => setStatus(u, 'approved')}>{t.approve}</Button>
                ) : (
                  <Button size="sm" variant="outline" className="border-red-500/40 text-red-500 hover:bg-red-500/10" disabled={busy === u.id} onClick={() => setStatus(u, 'suspended')}>{t.suspend}</Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
