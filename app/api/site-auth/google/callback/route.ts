import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb, sites } from '@/lib/db';
import { exchangeGoogleCode, getSiteGoogleRedirectUri, platformBase } from '@/lib/google-auth';
import { loginOrCreateSiteGoogleUser } from '@/lib/site-google-auth';
import { createSiteOauthHandoff } from '@/lib/site-auth-codes';
import { notifyOwnerOfPendingMember } from '@/lib/site-membership';
import { recordAudit } from '@/lib/audit';
import { SITE_GOOGLE_STATE_COOKIE } from '../start/route';

export const runtime = 'nodejs';

/**
 * GET /api/site-auth/google/callback?code=..&state=..
 * Runs on the PLATFORM host. Verifies state, exchanges the code, find-or-creates
 * the tenant member, then mints a one-time handoff token and bounces the user
 * back to the tenant page (`?g_handoff=<token>`), where the tenant host trades
 * the token for a session cookie on its own domain.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  const jar = await cookies();
  const stored = jar.get(SITE_GOOGLE_STATE_COOKIE)?.value ?? '';
  jar.delete(SITE_GOOGLE_STATE_COOKIE);
  const [expectedState, siteId, next] = stored.split('|');

  // Prefer bouncing errors back to the tenant page when we know it.
  const failTo = (code: string) => {
    if (next) {
      try {
        const u = new URL(next);
        u.searchParams.set('error', code);
        return NextResponse.redirect(u.toString());
      } catch { /* fall through */ }
    }
    return NextResponse.redirect(new URL(`/login?error=${code}`, platformBase()));
  };

  if (oauthError) return failTo('google_cancelled');
  if (!code || !state) return failTo('google_bad_request');
  if (!expectedState || expectedState !== state || !siteId || !next) return failTo('google_state_mismatch');

  const site = getDb().select({ id: sites.id, memberApproval: sites.memberApproval }).from(sites).where(eq(sites.id, siteId)).get();
  if (!site) return failTo('google_bad_request');

  const exchange = await exchangeGoogleCode(code, getSiteGoogleRedirectUri());
  if (!exchange.ok) return failTo(`google_${exchange.error}`);

  const { user, created } = loginOrCreateSiteGoogleUser(siteId, exchange.profile, Boolean(site.memberApproval));

  if (created) {
    recordAudit({ id: user.id, email: user.email }, 'site.register', siteId, `google status=${user.status}`);
    if (user.status === 'pending') void notifyOwnerOfPendingMember(siteId, user.email, user.name);
  }

  // Hand the authenticated identity off to the tenant host.
  const { token } = createSiteOauthHandoff({ id: user.id, email: user.email, siteId });
  const dest = new URL(next);
  dest.searchParams.set('g_handoff', token);
  return NextResponse.redirect(dest.toString());
}
