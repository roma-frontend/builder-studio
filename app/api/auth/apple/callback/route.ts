import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession, setSessionCookie, requestMeta } from '@/lib/auth';
import { exchangeAppleCode, loginOrCreateAppleUser } from '@/lib/apple-auth';
import { recordAudit } from '@/lib/audit';
import { notifyRegistration } from '@/lib/notify';
import { APPLE_STATE_COOKIE } from '../start/route';

export const runtime = 'nodejs';

function fail(request: Request, code: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
}

/**
 * POST /api/auth/apple/callback  (Apple uses response_mode=form_post)
 * Verify state, exchange the code, find-or-create the user, issue a session,
 * then redirect to the stashed `next`.
 */
export async function POST(request: Request) {
  let form: FormData;
  try { form = await request.formData(); } catch { return fail(request, 'apple_bad_request'); }

  const code = String(form.get('code') ?? '');
  const state = String(form.get('state') ?? '');
  if (form.get('error')) return fail(request, 'apple_cancelled');
  if (!code || !state) return fail(request, 'apple_bad_request');

  const jar = await cookies();
  const stored = jar.get(APPLE_STATE_COOKIE)?.value ?? '';
  jar.delete(APPLE_STATE_COOKIE);
  const [expectedState, storedNext] = stored.split('|');
  if (!expectedState || expectedState !== state) return fail(request, 'apple_state_mismatch');
  const next = storedNext && storedNext.startsWith('/') ? storedNext : '/dashboard';

  const exchange = await exchangeAppleCode(code);
  if (!exchange.ok) return fail(request, `apple_${exchange.error}`);

  const result = loginOrCreateAppleUser(exchange.profile);
  if (!result.ok) return fail(request, `apple_${result.error}`);

  const { user, created } = result;
  const { token, expiresAt } = createSession(user.id, requestMeta(request));
  await setSessionCookie(token, expiresAt);

  if (created) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    recordAudit({ id: user.id, email: user.email }, 'auth.register', user.email, `apple ip=${ip}`);
    notifyRegistration({ name: user.name, email: user.email, role: user.role });
  }

  return NextResponse.redirect(new URL(next, request.url), 303);
}
