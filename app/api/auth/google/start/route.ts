import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { getGoogleConfig, buildGoogleAuthUrl, platformBase } from '@/lib/google-auth';

export const runtime = 'nodejs';

/** Anti-CSRF state cookie for the OAuth round-trip (also carries the post-login
 *  redirect target). Short-lived; consumed by the callback. */
export const GOOGLE_STATE_COOKIE = 'cwk_g_oauth';

/**
 * GET /api/auth/google/start?next=/dashboard
 * Begin the Google OAuth flow: mint a random `state`, stash it (+ the safe
 * `next` path) in an httpOnly cookie, and redirect to Google's consent screen.
 */
export async function GET(request: Request) {
  if (!getGoogleConfig().configured) {
    return NextResponse.redirect(new URL('/login?error=google_not_configured', platformBase()));
  }

  const url = new URL(request.url);
  const nextParam = url.searchParams.get('next');
  // Reject protocol-relative URLs (`//evil.example`), which URL resolves as an
  // external host even when a trusted base URL is supplied.
  const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';

  const state = randomBytes(16).toString('base64url');
  const jar = await cookies();
  jar.set(GOOGLE_STATE_COOKIE, `${state}|${next}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60, // 10 minutes to complete the consent
  });

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
