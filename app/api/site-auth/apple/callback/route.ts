import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb, sites } from '@/lib/db';
import { exchangeAppleCode, getSiteAppleRedirectUri } from '@/lib/apple-auth';
import { loginOrCreateSiteAppleUser } from '@/lib/site-apple-auth';
import { createSiteOauthHandoff } from '@/lib/site-auth-codes';
import { notifyOwnerOfPendingMember } from '@/lib/site-membership';
import { recordAudit } from '@/lib/audit';
import { SITE_APPLE_STATE_COOKIE } from '../start/route';

export const runtime = 'nodejs';

/**
 * POST /api/site-auth/apple/callback  (Apple form_post, on the platform host)
 * Verify state, exchange the code, find-or-create the tenant member, mint a
 * one-time handoff token and bounce back to the tenant page (`?g_handoff=`),
 * where the tenant host trades it for a session cookie on its own domain.
 */
export async function POST(request: Request) {
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.redirect(new URL('/login?error=apple_bad_request', request.url)); }

  const code = String(form.get('code') ?? '');
  const state = String(form.get('state') ?? '');
  const oauthError = form.get('error');

  const jar = await cookies();
  const stored = jar.get(SITE_APPLE_STATE_COOKIE)?.value ?? '';
  jar.delete(SITE_APPLE_STATE_COOKIE);
  const [expectedState, siteId, next] = stored.split('|');

  const failTo = (c: string) => {
    if (next) {
      try { const u = new URL(next); u.searchParams.set('error', c); return NextResponse.redirect(u.toString(), 303); } catch { /* fall through */ }
    }
    return NextResponse.redirect(new URL(`/login?error=${c}`, request.url), 303);
  };

  if (oauthError) return failTo('apple_cancelled');
  if (!code || !state) return failTo('apple_bad_request');
  if (!expectedState || expectedState !== state || !siteId || !next) return failTo('apple_state_mismatch');

  const site = getDb().select({ id: sites.id, memberApproval: sites.memberApproval }).from(sites).where(eq(sites.id, siteId)).get();
  if (!site) return failTo('apple_bad_request');

  const exchange = await exchangeAppleCode(code, getSiteAppleRedirectUri());
  if (!exchange.ok) return failTo(`apple_${exchange.error}`);

  const { user, created } = loginOrCreateSiteAppleUser(siteId, exchange.profile, Boolean(site.memberApproval));
  if (created) {
    recordAudit({ id: user.id, email: user.email }, 'site.register', siteId, `apple status=${user.status}`);
    if (user.status === 'pending') void notifyOwnerOfPendingMember(siteId, user.email, user.name);
  }

  const { token } = createSiteOauthHandoff({ id: user.id, email: user.email, siteId });
  const dest = new URL(next);
  dest.searchParams.set('g_handoff', token);
  return NextResponse.redirect(dest.toString(), 303);
}
