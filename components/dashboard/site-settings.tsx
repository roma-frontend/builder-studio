'use client';

// Per-site settings: identity (name/slug), custom domains with DNS
// instructions + verification, form submissions inbox, danger zone.

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Save, Globe, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Inbox, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SiteInfo {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
}
interface DomainRow {
  id: string;
  hostname: string;
  verified: boolean;
}
interface SubmissionRow {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export function SiteSettings({
  appHost,
  site,
  initialDomains,
  initialSubmissions,
}: {
  appHost: string;
  site: SiteInfo;
  initialDomains: DomainRow[];
  initialSubmissions: SubmissionRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState(site.name);
  const [slug, setSlug] = useState(site.slug);
  const [savedSlug, setSavedSlug] = useState(site.slug);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [domains, setDomains] = useState(initialDomains);
  const [newDomain, setNewDomain] = useState('');
  const [domBusy, setDomBusy] = useState<string | null>(null);
  const [domErr, setDomErr] = useState('');

  const appHostname = appHost.split(':')[0];

  const saveIdentity = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`/api/sites/${site.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Сохранено.');
        setSlug(data.site.slug);
        setSavedSlug(data.site.slug);
        router.refresh();
      } else setMsg(data.error || 'Ошибка.');
    } catch {
      setMsg('Сеть недоступна.');
    } finally {
      setSaving(false);
    }
  };

  const addDomain = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setDomBusy('add');
    setDomErr('');
    try {
      const res = await fetch(`/api/sites/${site.id}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: newDomain }),
      });
      const data = await res.json();
      if (res.ok) {
        setDomains((d) => [...d, { id: data.domain.id, hostname: data.domain.hostname, verified: false }]);
        setNewDomain('');
      } else setDomErr(data.error || 'Ошибка.');
    } finally {
      setDomBusy(null);
    }
  };

  const checkDomain = async (domainId: string) => {
    setDomBusy(domainId);
    setDomErr('');
    try {
      const res = await fetch(`/api/sites/${site.id}/domains`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });
      const data = await res.json();
      if (res.ok) {
        setDomains((list) => list.map((d) => (d.id === domainId ? { ...d, verified: data.verified } : d)));
        if (!data.verified) setDomErr(`DNS ещё не указывает на платформу (${(data.details || []).join(' · ')})`);
      } else setDomErr(data.error || 'Ошибка проверки.');
    } finally {
      setDomBusy(null);
    }
  };

  const removeDomain = async (domainId: string) => {
    setDomBusy(domainId);
    try {
      const res = await fetch(`/api/sites/${site.id}/domains?domainId=${encodeURIComponent(domainId)}`, { method: 'DELETE' });
      if (res.ok) setDomains((list) => list.filter((d) => d.id !== domainId));
    } finally {
      setDomBusy(null);
    }
  };

  const deleteSite = async () => {
    if (!window.confirm(`Удалить сайт «${site.name}» безвозвратно? Страницы, домены и заявки будут удалены.`)) return;
    const res = await fetch(`/api/sites/${site.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/dashboard');
  };

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Мои сайты
          </Link>
          <span className="font-semibold tracking-tight">/ {site.name}</span>
          <Link href={`/s/${savedSlug}?draft=1`} target="_blank" className="ml-auto">
            <Button size="sm" variant="outline" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Открыть сайт</Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {/* Identity */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold tracking-tight">Основное</h2>
          <form onSubmit={saveIdentity} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="site-name" className="text-sm font-medium">Название</label>
              <Input id="site-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="site-slug" className="text-sm font-medium">Адрес (slug)</label>
              <Input id="site-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Сайт доступен по {appHost}/s/<b>{slug || '…'}</b>
                {appHostname !== 'localhost' && <> и <b>{slug || '…'}</b>.{appHostname}</>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Сохранить
              </Button>
              {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
            </div>
          </form>
        </section>

        {/* Domains */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight"><Globe className="h-4 w-4 text-primary" /> Свои домены</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Направьте домен на платформу: запись <b>CNAME → {appHostname}</b> (для поддоменов) или <b>A-запись → IP сервера</b>, затем нажмите «Проверить».
          </p>

          <form onSubmit={addDomain} className="mt-4 flex gap-2">
            <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="example.com" className="max-w-xs" aria-label="Новый домен" />
            <Button type="submit" disabled={domBusy === 'add' || !newDomain.trim()} className="gap-1.5">
              {domBusy === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Привязать
            </Button>
          </form>
          {domErr && <p className="mt-2 text-sm text-destructive" role="alert">{domErr}</p>}

          {domains.length > 0 && (
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
              {domains.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="font-medium">{d.hostname}</span>
                  {d.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> подтверждён</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><AlertCircle className="h-3.5 w-3.5" /> ждёт DNS</span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <Button size="sm" variant="ghost" disabled={domBusy === d.id} onClick={() => checkDomain(d.id)} className="gap-1.5" title="Проверить DNS">
                      {domBusy === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Проверить
                    </Button>
                    <Button size="sm" variant="ghost" disabled={domBusy === d.id} onClick={() => removeDomain(d.id)} title="Отвязать домен">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Submissions */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight"><Inbox className="h-4 w-4 text-primary" /> Заявки с форм</h2>
          {initialSubmissions.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Пока пусто. Заявки с форм на опубликованном сайте будут появляться здесь.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {initialSubmissions.map((s) => (
                <li key={s.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{s.formId}</span>
                    <time dateTime={s.createdAt}>{new Date(s.createdAt).toLocaleString('ru-RU')}</time>
                  </div>
                  <dl className="mt-2 space-y-1 text-sm">
                    {Object.entries(s.data)
                      .filter(([k]) => k !== 'formId')
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="w-28 shrink-0 text-muted-foreground">{k}</dt>
                          <dd className="break-all">{String(v)}</dd>
                        </div>
                      ))}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm">
          <h2 className="font-semibold tracking-tight text-destructive">Опасная зона</h2>
          <p className="mt-1 text-sm text-muted-foreground">Удаление сайта необратимо: страницы, домены и заявки будут стёрты.</p>
          <Button variant="outline" onClick={deleteSite} className="mt-3 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" /> Удалить сайт
          </Button>
        </section>
      </div>
    </main>
  );
}
