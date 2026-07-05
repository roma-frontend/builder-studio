'use client';

// Professional self-service account for a tenant site's end-users. Themed with
// the tenant's own tokens, wired to the isolated /api/site-auth (scoped by
// siteId). Tabs: Профиль · Безопасность · Обращения · Настройки.

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Shield, FileText, Settings, LogOut, Loader2, Check, Mail, Phone, Lock,
  Eye, EyeOff, Monitor, Smartphone, Trash2, Save, CalendarDays, ShieldCheck, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { iconCls, passwordScore, StrengthMeter } from '@/components/auth/auth-ui';

type Me = {
  id: string; email: string; name: string; phone: string; avatarColor: string;
  emailNotify: boolean; marketing: boolean; locale: string;
  createdAt: string | number | Date; lastLoginAt: string | number | Date | null;
};
type SessionRow = { id: string; userAgent: string; ip: string; createdAt: string | number | Date; lastActiveAt: string | number | Date | null; current: boolean };
type Submission = { id: string; formId: string; data: Record<string, unknown>; createdAt: string | number | Date };

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#64748b'];

async function api(action: string, body: Record<string, unknown>) {
  try {
    const res = await fetch('/api/site-auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: data.error as string | undefined, user: data.user as Me | undefined };
  } catch {
    return { ok: false, error: 'Сеть недоступна, попробуйте ещё раз.' };
  }
}

function fmtDate(v: string | number | Date | null | undefined) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDay(v: string | number | Date | null | undefined) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}
function initials(name: string, email: string) {
  const n = name.trim();
  if (n) return n.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  return (email[0] ?? '?').toUpperCase();
}
function deviceLabel(ua: string) {
  if (!ua) return 'Неизвестное устройство';
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let os = 'Устройство';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  let br = '';
  if (/Edg\//i.test(ua)) br = 'Edge';
  else if (/Chrome\//i.test(ua)) br = 'Chrome';
  else if (/Firefox\//i.test(ua)) br = 'Firefox';
  else if (/Safari\//i.test(ua)) br = 'Safari';
  return { label: `${br ? br + ' · ' : ''}${os}`, mobile };
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-background/60 px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {desc && <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>}
      </span>
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 flex-none rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'left-0.5 translate-x-5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

const TABS = [
  { id: 'profile', label: 'Профиль', icon: User },
  { id: 'security', label: 'Безопасность', icon: Shield },
  { id: 'activity', label: 'Обращения', icon: FileText },
  { id: 'settings', label: 'Настройки', icon: Settings },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function SiteAccount({ siteId, base, brand }: { siteId: string; base: string; brand: string }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('profile');
  const [loggingOut, setLoggingOut] = useState(false);

  const refresh = useCallback(() => {
    return fetch(`/api/site-auth?site=${encodeURIComponent(siteId)}`)
      .then((r) => r.json()).then((d) => setMe(d.user ?? null)).catch(() => {});
  }, [siteId]);

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);

  const logout = async () => { setLoggingOut(true); await api('logout', { siteId }); router.push(`${base}/login`); router.refresh(); };

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!me) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-muted-foreground">Вы не вошли в аккаунт.</p>
        <div className="flex gap-3">
          <Link href={`${base}/login`}><Button size="lg">Войти</Button></Link>
          <Link href={`${base}/register`}><Button size="lg" variant="outline">Регистрация</Button></Link>
        </div>
      </main>
    );
  }

  const color = me.avatarColor || AVATAR_COLORS[0];

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background px-4 py-8 sm:py-12">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-[-15%] top-[-20%] h-[500px] w-[500px] rounded-full" style={{ background: 'radial-gradient(circle, var(--primary), transparent 70%)', filter: 'blur(90px)', opacity: 0.25 }} />
      </div>
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-background/80 p-5 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg" style={{ background: color }}>
              {initials(me.name, me.email)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight">{me.name || 'Личный кабинет'}</h1>
              <p className="truncate text-sm text-muted-foreground">{me.email}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{brand}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link href={base || '/'}><Button variant="ghost" size="sm">На сайт</Button></Link>
            <Button onClick={logout} disabled={loggingOut} variant="outline" size="sm" className="gap-2">
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Выйти
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
          {/* Sidebar / tabs */}
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-background/80 p-2 shadow-sm backdrop-blur-md sm:h-max sm:flex-col sm:overflow-visible">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex flex-none items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors sm:w-full ${active ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="rounded-2xl border border-border bg-background/80 p-5 shadow-xl backdrop-blur-md sm:p-6">
            {tab === 'profile' && <ProfileTab siteId={siteId} me={me} onSaved={setMe} />}
            {tab === 'security' && <SecurityTab siteId={siteId} />}
            {tab === 'activity' && <ActivityTab siteId={siteId} />}
            {tab === 'settings' && <SettingsTab siteId={siteId} base={base} me={me} onSaved={setMe} router={router} />}
          </div>
        </div>
      </div>
    </main>
  );
}

function Notice({ kind, children }: { kind: 'ok' | 'err'; children: React.ReactNode }) {
  const cls = kind === 'ok'
    ? 'border-green-500/20 bg-green-500/10 text-green-600'
    : 'border-red-500/20 bg-red-500/10 text-red-500';
  return <div role="alert" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${cls}`}>{kind === 'ok' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{children}</div>;
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
    </div>
  );
}

function ProfileTab({ siteId, me, onSaved }: { siteId: string; me: Me; onSaved: (u: Me) => void }) {
  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone);
  const [avatarColor, setAvatarColor] = useState(me.avatarColor || AVATAR_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const dirty = name !== me.name || phone !== me.phone || avatarColor !== (me.avatarColor || AVATAR_COLORS[0]);

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await api('update-profile', { siteId, name, phone, avatarColor });
    setBusy(false);
    if (!r.ok || !r.user) { setMsg({ kind: 'err', text: r.error || 'Не удалось сохранить' }); return; }
    onSaved(r.user); setMsg({ kind: 'ok', text: 'Профиль обновлён' });
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <SectionTitle title="Профиль" desc="Ваши личные данные и оформление аккаунта." />
      <div className="space-y-2">
        <label className="text-sm font-medium">Имя</label>
        <div className="relative">
          <User className={iconCls} />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как к вам обращаться" className="h-11 pl-10" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Телефон</label>
        <div className="relative">
          <Phone className={iconCls} />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" inputMode="tel" className="h-11 pl-10" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <div className="relative">
          <Mail className={iconCls} />
          <Input value={me.email} readOnly disabled className="h-11 pl-10 opacity-70" />
        </div>
        <p className="text-xs text-muted-foreground">Email используется для входа и не меняется.</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Цвет аватара</label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setAvatarColor(c)} aria-label={`Цвет ${c}`}
              className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition ${avatarColor === c ? 'ring-foreground' : 'ring-transparent'}`}
              style={{ background: c }}>
              {avatarColor === c && <Check className="mx-auto h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">С нами с</span>
        <span className="ml-auto font-medium">{fmtDay(me.createdAt)}</span>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Button type="submit" size="lg" disabled={busy || !dirty} className="gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Сохранить
      </Button>
    </form>
  );
}

function SecurityTab({ siteId }: { siteId: string }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const score = useMemo(() => passwordScore(next), [next]);

  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [sesBusy, setSesBusy] = useState('');

  const loadSessions = useCallback(() => {
    fetch(`/api/site-auth?site=${encodeURIComponent(siteId)}&resource=sessions`)
      .then((r) => r.json()).then((d) => setSessions(d.sessions ?? [])).catch(() => setSessions([]));
  }, [siteId]);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const changePw = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (next.length < 6) { setMsg({ kind: 'err', text: 'Пароль должен быть не короче 6 символов' }); return; }
    if (next !== confirm) { setMsg({ kind: 'err', text: 'Пароли не совпадают' }); return; }
    setBusy(true);
    const r = await api('change-password', { siteId, currentPassword: current, newPassword: next });
    setBusy(false);
    if (!r.ok) { setMsg({ kind: 'err', text: r.error || 'Не удалось изменить пароль' }); return; }
    setMsg({ kind: 'ok', text: 'Пароль изменён' }); setCurrent(''); setNext(''); setConfirm('');
  };

  const revoke = async (id: string) => { setSesBusy(id); await api('revoke-session', { siteId, sessionId: id }); setSesBusy(''); loadSessions(); };
  const revokeOthers = async () => { setSesBusy('all'); await api('revoke-others', { siteId }); setSesBusy(''); loadSessions(); };

  return (
    <div className="space-y-8">
      <form onSubmit={changePw} className="space-y-5">
        <SectionTitle title="Смена пароля" desc="Для смены пароля подтвердите текущий." />
        <div className="space-y-2">
          <label className="text-sm font-medium">Текущий пароль</label>
          <div className="relative">
            <Lock className={iconCls} />
            <Input type={show ? 'text' : 'password'} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className="h-11 pl-10 pr-10" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Показать пароль">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Новый пароль</label>
          <div className="relative">
            <Lock className={iconCls} />
            <Input type={show ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="Минимум 6 символов" className="h-11 pl-10" />
          </div>
          <StrengthMeter score={score} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Повторите новый пароль</label>
          <div className="relative">
            <Lock className={iconCls} />
            <Input type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="h-11 pl-10" />
          </div>
        </div>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        <Button type="submit" size="lg" disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Обновить пароль
        </Button>
      </form>

      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle title="Активные сеансы" desc="Устройства, на которых выполнен вход." />
          {sessions && sessions.length > 1 && (
            <Button type="button" size="sm" variant="outline" onClick={revokeOthers} disabled={sesBusy === 'all'} className="flex-none gap-2">
              {sesBusy === 'all' && <Loader2 className="h-4 w-4 animate-spin" />} Выйти на других
            </Button>
          )}
        </div>
        {!sessions ? (
          <div className="py-4 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет активных сеансов.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const dev = deviceLabel(s.userAgent);
              const label = typeof dev === 'string' ? dev : dev.label;
              const mobile = typeof dev === 'string' ? false : dev.mobile;
              return (
                <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
                  {mobile ? <Smartphone className="h-5 w-5 flex-none text-muted-foreground" /> : <Monitor className="h-5 w-5 flex-none text-muted-foreground" />}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{label}</span>
                      {s.current && <span className="flex-none rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-600">текущий</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{s.ip || 'IP скрыт'} · активность {fmtDate(s.lastActiveAt || s.createdAt)}</p>
                  </div>
                  {!s.current && (
                    <button type="button" onClick={() => revoke(s.id)} disabled={sesBusy === s.id} aria-label="Завершить сеанс" className="flex-none rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500">
                      {sesBusy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ActivityTab({ siteId }: { siteId: string }) {
  const [items, setItems] = useState<Submission[] | null>(null);
  useEffect(() => {
    fetch(`/api/site-auth?site=${encodeURIComponent(siteId)}&resource=submissions`)
      .then((r) => r.json()).then((d) => setItems(d.submissions ?? [])).catch(() => setItems([]));
  }, [siteId]);

  return (
    <div>
      <SectionTitle title="Мои обращения" desc="Заявки и сообщения, отправленные через формы сайта." />
      {!items ? (
        <div className="py-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">Пока нет обращений.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const fields = Object.entries(it.data).filter(([k]) => k !== 'formId').slice(0, 6);
            return (
              <li key={it.id} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{it.formId}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(it.createdAt)}</span>
                </div>
                <dl className="grid gap-1 text-sm">
                  {fields.map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="min-w-24 flex-none capitalize text-muted-foreground">{k}</dt>
                      <dd className="min-w-0 break-words font-medium">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SettingsTab({ siteId, base, me, onSaved, router }: { siteId: string; base: string; me: Me; onSaved: (u: Me) => void; router: ReturnType<typeof useRouter> }) {
  const [emailNotify, setEmailNotify] = useState(me.emailNotify);
  const [marketing, setMarketing] = useState(me.marketing);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [confirmDel, setConfirmDel] = useState(false);
  const [delText, setDelText] = useState('');
  const [delBusy, setDelBusy] = useState(false);

  const savePrefs = async (nextEmail: boolean, nextMkt: boolean) => {
    setEmailNotify(nextEmail); setMarketing(nextMkt); setBusy(true); setMsg(null);
    const r = await api('update-profile', { siteId, emailNotify: nextEmail, marketing: nextMkt });
    setBusy(false);
    if (!r.ok || !r.user) { setMsg({ kind: 'err', text: r.error || 'Не удалось сохранить' }); return; }
    onSaved(r.user); setMsg({ kind: 'ok', text: 'Настройки сохранены' });
  };

  const del = async () => {
    setDelBusy(true);
    const r = await api('delete-account', { siteId });
    if (!r.ok) { setDelBusy(false); setMsg({ kind: 'err', text: r.error || 'Не удалось удалить аккаунт' }); return; }
    router.push(base || '/'); router.refresh();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SectionTitle title="Уведомления" desc="Управляйте письмами, которые вы получаете." />
        {busy && <p className="text-xs text-muted-foreground">Сохранение…</p>}
        <Toggle checked={emailNotify} onChange={(v) => savePrefs(v, marketing)} label="Сервисные уведомления" desc="Важные письма о вашем аккаунте и обращениях." />
        <Toggle checked={marketing} onChange={(v) => savePrefs(emailNotify, v)} label="Новости и акции" desc="Рассылка с новостями и специальными предложениями." />
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      </div>

      <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-500"><Trash2 className="h-4 w-4" /> Удаление аккаунта</h3>
          <p className="mt-1 text-sm text-muted-foreground">Аккаунт и все связанные данные будут удалены безвозвратно.</p>
        </div>
        {!confirmDel ? (
          <Button type="button" variant="outline" className="border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-500" onClick={() => setConfirmDel(true)}>
            Удалить аккаунт
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">Для подтверждения введите <span className="font-mono font-semibold">УДАЛИТЬ</span>:</p>
            <Input value={delText} onChange={(e) => setDelText(e.target.value)} placeholder="УДАЛИТЬ" className="h-11 max-w-xs" />
            <div className="flex gap-2">
              <Button type="button" disabled={delText.trim().toUpperCase() !== 'УДАЛИТЬ' || delBusy} onClick={del}
                className="gap-2 bg-red-600 text-white hover:bg-red-700">
                {delBusy && <Loader2 className="h-4 w-4 animate-spin" />} Удалить навсегда
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setConfirmDel(false); setDelText(''); }}>Отмена</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
