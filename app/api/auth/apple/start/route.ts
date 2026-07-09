import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { getAppleConfig, buildAppleAuthUrl } from '@/lib/apple-auth';

export const runtime = 'nodejs';

export const APPLE_STATE_COOKIE = 'cwk_a_oauth';

/**
 * GET /api/auth/apple/start?next=/dashboard
 * Mint anti-CSRF state (+ safe next path) and redirect to Apple. Because Apple
 * returns via a cross-site form_post, the state cookie is SameSite=None; Secure
 * in production so it survives the POST back to the callback.
 */
export async function GET(request: Request) {
  if (!getAppleConfig().configured) {
    return NextResponse.redirect(new URL('/login?error=apple_not_configured', request.url));
  }
  const url = new URL(request.url);
  const nextParam = url.searchParams.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';

  const state = randomBytes(16).toString('base64url');
  const prod = process.env.NODE_ENV === 'production';
  const jar = await cookies();
  jar.set(APPLE_STATE_COOKIE, `${state}|${next}`, {
    httpOnly: true,
    // form_post is cross-site → the cookie must be SameSite=None to be sent.
    sameSite: prod ? 'none' : 'lax',
    secure: prod,
    path: '/',
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(buildAppleAuthUrl(state));
}
