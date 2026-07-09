import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb, sites } from '@/lib/db';
import { getAppleConfig, buildAppleAuthUrl, getSiteAppleRedirectUri } from '@/lib/apple-auth';
import { platformBase } from '@/lib/google-auth';

export const runtime = 'nodejs';

/** State cookie for the TENANT Apple flow. Carries state|siteId|returnUrl. */
export const SITE_APPLE_STATE_COOKIE = 'cwk_site_a_oauth';

/**
 * GET /api/site-auth/apple/start?site=<id>&next=<absolute tenant URL>
 * Runs on the PLATFORM host. Apple returns via cross-site form_post, so the
 * state cookie is SameSite=None; Secure in production.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteId = (url.searchParams.get('site') || '').trim();
  const nextParam = (url.searchParams.get('next') || '').trim();

  const fail = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, platformBase()));

  if (!getAppleConfig().configured) return fail('apple_not_configured');
  if (!siteId) return fail('apple_bad_request');
  const site = getDb().select({ id: sites.id }).from(sites).where(eq(sites.id, siteId)).get();
  if (!site) return fail('apple_bad_request');

  let next = '';
  try {
    const u = new URL(nextParam);
    if (u.protocol === 'http:' || u.protocol === 'https:') next = u.toString();
  } catch { /* invalid */ }
  if (!next) return fail('apple_bad_request');

  const state = randomBytes(16).toString('base64url');
  const prod = process.env.NODE_ENV === 'production';
  const jar = await cookies();
  jar.set(SITE_APPLE_STATE_COOKIE, `${state}|${siteId}|${next}`, {
    httpOnly: true,
    sameSite: prod ? 'none' : 'lax',
    secure: prod,
    path: '/',
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(buildAppleAuthUrl(state, getSiteAppleRedirectUri()));
}
