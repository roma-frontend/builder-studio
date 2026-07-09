'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { authDict } from '@/lib/auth-dict';

// Platform-host bridge for TENANT Telegram login. The Telegram Login Widget
// only works on the single domain registered in BotFather (this platform
// host), so a tenant site can't render it directly. Its social row instead
// links here with ?site=<id>&next=<absolute tenant URL>. We run the widget,
// POST the signed payload to /api/site-auth/telegram (which verifies the HMAC,
// find-or-creates the member and mints a one-time handoff token), then bounce
// the browser to the returned tenant URL (`?g_handoff=`) where the tenant host
// trades it for a session cookie on its own domain.

interface TelegramAuthUser {
  id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string; auth_date: number; hash: string;
}
type TelegramLogin = {
  auth: (opts: { bot_id: string | number; request_access?: string | boolean }, cb: (u: TelegramAuthUser | false) => void) => void;
};
const SCRIPT_ID = 'telegram-widget-js';
const windowTelegram = (): TelegramLogin | undefined =>
  (window as unknown as { Telegram?: { Login?: TelegramLogin } }).Telegram?.Login;

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff" aria-hidden="true">
      <path d="M21.94 4.6 18.7 19.86c-.24 1.08-.88 1.35-1.79.84l-4.94-3.64-2.38 2.29c-.26.26-.49.49-1 .49l.36-5.08 9.24-8.35c.4-.36-.09-.56-.62-.2L6.34 13.07l-4.92-1.54c-1.07-.34-1.09-1.07.22-1.59l19.24-7.42c.89-.33 1.67.2 1.38 1.68z" />
    </svg>
  );
}

/** Validate that `next` is an absolute http(s) URL (never an open redirect). */
function safeNext(raw: string | null): string {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch { /* invalid */ }
  return '';
}

export function SiteTelegramBridge() {
  const t = authDict(useLocale().locale);
  const search = useSearchParams();
  const site = (search.get('site') || '').trim();
  const next = safeNext(search.get('next'));

  const [botId, setBotId] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(() => typeof window !== 'undefined' && !!windowTelegram());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const badParams = !site || !next;

  // Public numeric bot id (no secret) — null when Telegram login isn't configured.
  useEffect(() => {
    let alive = true;
    fetch('/api/auth/telegram')
      .then((r) => (r.ok ? r.json() : { botId: null }))
      .then((d) => alive && setBotId(d.botId ?? null))
      .catch(() => alive && setBotId(null));
    return () => { alive = false; };
  }, []);

  // Load the widget script once (only for its Login.auth API).
  useEffect(() => {
    if (typeof window === 'undefined' || windowTelegram()) return;
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) { existing.addEventListener('load', () => setScriptReady(true)); return; }
    const s = document.createElement('script');
    s.id = SCRIPT_ID; s.src = 'https://telegram.org/js/telegram-widget.js?22'; s.async = true;
    s.onload = () => setScriptReady(true);
    document.body.appendChild(s);
  }, []);

  const onAuth = useCallback(async (u: TelegramAuthUser) => {
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/site-auth/telegram', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site, next,
          id: String(u.id), first_name: u.first_name, last_name: u.last_name,
          username: u.username, photo_url: u.photo_url, auth_date: String(u.auth_date), hash: u.hash,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.redirect) { setError(t.telegram.failed); setBusy(false); return; }
      window.location.assign(data.redirect);
    } catch { setError(t.networkError); setBusy(false); }
  }, [site, next, t]);

  const click = () => {
    const login = windowTelegram();
    if (!login || !botId) return;
    login.auth({ bot_id: botId, request_access: 'write' }, (user) => {
      if (user) void onAuth(user);
      else setError(t.telegram.cancelled);
    });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#229ED9]">
          <TelegramIcon />
        </div>
        <h1 className="text-lg font-semibold">{t.telegram.login}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t.telegram.continueHint}</p>

        {badParams ? (
          <p role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">{t.telegram.badRequest}</p>
        ) : botId === null ? (
          <p className="mt-5 text-sm text-muted-foreground">{t.telegram.notConfigured}</p>
        ) : (
          <>
            <button
              type="button"
              onClick={click}
              disabled={!scriptReady || busy}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e8bc0] disabled:opacity-60"
            >
              {busy || !scriptReady ? <Loader2 className="h-4 w-4 animate-spin" /> : <TelegramIcon />}
              {t.telegram.login}
            </button>
            {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
