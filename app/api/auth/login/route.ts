import { NextResponse } from 'next/server';
import {
  DUMMY_HASH,
  clearLoginFailures,
  createSession,
  findUserByEmail,
  lockRemainingMs,
  rateLimit,
  recordLoginFailure,
  requestMeta,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`login:${ip}`, 15)) {
    return NextResponse.json({ error: 'Слишком много попыток, подождите немного.' }, { status: 429 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const user = findUserByEmail(body.email ?? '');

  // Account lockout after repeated failures (checked before the password so a
  // locked account can't be brute-forced at all).
  if (user) {
    const remaining = lockRemainingMs(user);
    if (remaining > 0) {
      const minutes = Math.ceil(remaining / 60_000);
      return NextResponse.json(
        { error: `Аккаунт временно заблокирован из-за неудачных попыток входа. Попробуйте через ${minutes} мин.` },
        { status: 429 },
      );
    }
  }

  // Always verify against something so a missing user costs the same time
  // as a wrong password (no account-enumeration timing oracle).
  const ok = user
    ? verifyPassword(body.password ?? '', user.passwordHash)
    : (verifyPassword('invalid', DUMMY_HASH), false);

  if (!ok || !user) {
    if (user) {
      const lockedNow = recordLoginFailure(user);
      recordAudit(
        { id: user.id, email: user.email },
        lockedNow ? 'auth.lockout' : 'auth.login_failed',
        user.email,
        `ip=${ip}`,
      );
    }
    return NextResponse.json({ error: 'Неверный email или пароль.' }, { status: 401 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: 'Аккаунт заблокирован администратором.' }, { status: 403 });
  }

  clearLoginFailures(user);
  const { token, expiresAt } = createSession(user.id, requestMeta(request));
  await setSessionCookie(token, expiresAt);
  recordAudit({ id: user.id, email: user.email }, 'auth.login', user.email, `ip=${ip}`);
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
}
