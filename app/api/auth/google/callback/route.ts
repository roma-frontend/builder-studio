import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession, setSessionCookie, requestMeta } from '@/lib/auth';
import { exchangeGoogleCode, loginOrCreateGoogleUser, platformBase } from '@/lib/google-auth';
import { recordAudit } from '@/lib/audit';
import { notifyRegistration } from '@/lib/notify';
import { GOOGLE_STATE_COOKIE } from '../start/route';

export const runtime = 'nodejs';

/** Redirect back to /login with a machine-readable error code. Built from the
 *  configured platform base (NOT request.url), which behind a proxy (Fly) is an
 *  internal host like http://localhost:3000 and would leak into the Location. */
function fail(code: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${code}`, platformBase()));
}

/**
 * GET /api/auth/google/callback?code=...&state=...
 * Google redirects here after consent. Verify the `state` (CSRF), exchange the
 * code for the verified profile, find-or-create the user, issue a session and
 * redirect to the stashed `next` (default /dashboard).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) return fail('google_cancelled');
  if (!code || !state) return fail('google_bad_request');

  // Verify + consume the anti-CSRF state cookie.
  const jar = await cookies();
  const stored = jar.get(GOOGLE_STATE_COOKIE)?.value ?? '';
  jar.delete(GOOGLE_STATE_COOKIE);
  const [expectedState, storedNext] = stored.split('|');
  if (!expectedState || expectedState !== state) return fail('google_state_mismatch');
  const next = storedNext && storedNext.startsWith('/') ? storedNext : '/dashboard';

  const exchange = await exchangeGoogleCode(code);
  if (!exchange.ok) return fail(`google_${exchange.error}`);

  const result = loginOrCreateGoogleUser(exchange.profile);
  if (!result.ok) return fail(`google_${result.error}`);

  const { user, created } = result;
  const { token, expiresAt } = createSession(user.id, requestMeta(request));
  await setSessionCookie(token, expiresAt);

  if (created) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    recordAudit({ id: user.id, email: user.email }, 'auth.register', user.email, `google ip=${ip}`);
    notifyRegistration({ name: user.name, email: user.email, role: user.role });
  }

  return NextResponse.redirect(new URL(next, platformBase()));
}
