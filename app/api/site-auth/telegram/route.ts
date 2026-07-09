import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, sites } from '@/lib/db';
import { rateLimit } from '@/lib/auth';
import { getTelegramConfig } from '@/lib/telegram';
import {
  verifyTelegramHash,
  TELEGRAM_AUTH_MAX_AGE_MS,
  type TelegramAuthPayload,
} from '@/lib/telegram-auth';
import { loginOrCreateSiteTelegramUser } from '@/lib/site-telegram-auth';
import { createSiteOauthHandoff } from '@/lib/site-auth-codes';
import { notifyOwnerOfPendingMember } from '@/lib/site-membership';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';

/**
 * POST /api/site-auth/telegram   (runs on the PLATFORM host)
 *
 * The Telegram Login Widget only works on the single domain registered in
 * BotFather (the platform host), so — unlike the tenant Google/Apple OAuth
 * which redirects — the widget is rendered on a platform-host page
 * (/site-auth/telegram) that POSTs the signed payload here. We re-verify the
 * HMAC server-side (never trusting the client), find-or-create the tenant
 * member, mint the same provider-agnostic one-time handoff token used by
 * Google/Apple, and return the tenant `next` URL with `?g_handoff=<token>`.
 * The tenant login page then trades it for a session cookie on its own host
 * (the existing `google-exchange` action).
 */
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`site-tg-auth:${ip}`, 20)) {
    return NextResponse.json({ error: 'too_many' }, { status: 429 });
  }

  let body: Partial<TelegramAuthPayload> & { site?: string; next?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const siteId = (body.site ?? '').trim();
  const nextParam = (body.next ?? '').trim();
  if (!siteId || !body.id || !body.auth_date || !body.hash) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  // Only allow returning to an absolute http(s) URL (the tenant site page).
  let next = '';
  try {
    const u = new URL(nextParam);
    if (u.protocol === 'http:' || u.protocol === 'https:') next = u.toString();
  } catch { /* invalid */ }
  if (!next) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const site = getDb()
    .select({ id: sites.id, memberApproval: sites.memberApproval })
    .from(sites)
    .where(eq(sites.id, siteId))
    .get();
  if (!site) return NextResponse.json({ error: 'site_not_found' }, { status: 404 });

  const token = getTelegramConfig().token;
  if (!token) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  // Reconstruct exactly the fields Telegram signed (omit empty/optional ones).
  const payload: TelegramAuthPayload = {
    id: String(body.id),
    first_name: body.first_name,
    last_name: body.last_name,
    username: body.username,
    photo_url: body.photo_url,
    auth_date: String(body.auth_date),
    hash: String(body.hash),
  };
  const fields: Record<string, string> = { id: payload.id, auth_date: payload.auth_date };
  if (payload.first_name) fields.first_name = payload.first_name;
  if (payload.last_name) fields.last_name = payload.last_name;
  if (payload.username) fields.username = payload.username;
  if (payload.photo_url) fields.photo_url = payload.photo_url;

  if (!verifyTelegramHash(fields, payload.hash, token)) {
    return NextResponse.json({ error: 'bad_signature' }, { status: 401 });
  }
  const authDateMs = Number(payload.auth_date) * 1000;
  if (!Number.isFinite(authDateMs) || Date.now() - authDateMs > TELEGRAM_AUTH_MAX_AGE_MS) {
    return NextResponse.json({ error: 'expired' }, { status: 401 });
  }

  const { user, created } = loginOrCreateSiteTelegramUser(siteId, payload, Boolean(site.memberApproval));
  if (created) {
    recordAudit({ id: user.id, email: user.email }, 'site.register', siteId, `telegram status=${user.status}`);
    if (user.status === 'pending') void notifyOwnerOfPendingMember(siteId, user.email, user.name);
  }

  // Hand the authenticated identity off to the tenant host (same token flow as
  // Google/Apple, so the tenant `google-exchange` action consumes it).
  const { token: handoff } = createSiteOauthHandoff({ id: user.id, email: user.email, siteId });
  const dest = new URL(next);
  dest.searchParams.set('g_handoff', handoff);
  recordAudit({ id: user.id, email: user.email }, 'site.login', siteId, `ip=${ip} telegram`);
  return NextResponse.json({ ok: true, redirect: dest.toString() });
}
