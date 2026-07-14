import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb, sites } from '@/lib/db';
import { APP_HOST, getSiteByHostname } from '@/lib/sites';
import { getGoogleConfig, buildGoogleAuthUrl, getSiteGoogleRedirectUri, platformBase } from '@/lib/google-auth';

export const runtime = 'nodejs';

/** State cookie for the TENANT Google flow. Carries state|siteId|returnUrl. */
export const SITE_GOOGLE_STATE_COOKIE = 'cwk_site_g_oauth';

/**
 * GET /api/site-auth/google/start?site=<id>&next=<absolute tenant URL>
 * Begins the tenant Google flow on the PLATFORM host (single registered
 * redirect URI). `next` is the tenant page to return to (its own host); it's
 * validated to be an absolute http(s) URL so it can't be an open redirect to
 * a foreign scheme.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteId = (url.searchParams.get('site') || '').trim();
  const nextParam = (url.searchParams.get('next') || '').trim();

  const fail = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, platformBase()));

  if (!getGoogleConfig().configured) return fail('google_not_configured');
  if (!siteId) return fail('google_bad_request');

  const site = getDb().select({ id: sites.id, slug: sites.slug }).from(sites).where(eq(sites.id, siteId)).get();
  if (!site) return fail('google_bad_request');

  // Bind the return URL to this exact tenant. Merely requiring HTTP(S) would
  // allow an attacker-controlled host to receive the one-time handoff token.
  let next = '';
  try {
    const u = new URL(nextParam);
    const appHostname = APP_HOST.split(':')[0];
    const sitePath = `/s/${encodeURIComponent(site.slug)}`;
    const pathSite = u.hostname === appHostname && (u.pathname === sitePath || u.pathname.startsWith(`${sitePath}/`));
    const subdomainSite = u.hostname.endsWith(`.${appHostname}`) && u.hostname.slice(0, -(appHostname.length + 1)) === site.slug;
    const customDomainSite = getSiteByHostname(u.hostname)?.id === siteId;
    if ((u.protocol === 'http:' || u.protocol === 'https:') && (pathSite || subdomainSite || customDomainSite)) {
      next = u.toString();
    }
  } catch { /* invalid */ }
  if (!next) return fail('google_bad_request');

  const state = randomBytes(16).toString('base64url');
  const jar = await cookies();
  jar.set(SITE_GOOGLE_STATE_COOKIE, `${state}|${siteId}|${next}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(buildGoogleAuthUrl(state, getSiteGoogleRedirectUri()));
}
