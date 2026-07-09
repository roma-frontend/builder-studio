import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb, sites } from '@/lib/db';
import { getGoogleConfig, buildGoogleAuthUrl, getSiteGoogleRedirectUri } from '@/lib/google-auth';

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

  const fail = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, request.url));

  if (!getGoogleConfig().configured) return fail('google_not_configured');
  if (!siteId) return fail('google_bad_request');

  const site = getDb().select({ id: sites.id }).from(sites).where(eq(sites.id, siteId)).get();
  if (!site) return fail('google_bad_request');

  // Only allow returning to an absolute http(s) URL (the tenant site page).
  let next = '';
  try {
    const u = new URL(nextParam);
    if (u.protocol === 'http:' || u.protocol === 'https:') next = u.toString();
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
