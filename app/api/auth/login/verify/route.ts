// Step 2 of the login: exchange a challenge id + the emailed 6-digit code for
// a real session. The challenge id alone is worthless — it only pairs a browser
// with a pending code; the code itself never leaves the email.

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { createSession, rateLimit, requestMeta, setSessionCookie } from '@/lib/auth';
import { verifyLoginOtp, verifyTotpLogin, getChallenge } from '@/lib/auth-codes';
import { getDb, users } from '@/lib/db';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`otp-verify:${ip}`, 30)) {
    return NextResponse.json({ error: 'Слишком много попыток, подождите немного.' }, { status: 429 });
  }

  let body: { challenge?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const challenge = body.challenge ?? '';
  const code = (body.code ?? '').trim();
  // TOTP challenges verify against the user's authenticator secret; email OTP
  // challenges verify against the stored one-time code.
  const info = getChallenge(challenge);
  let verdict;
  if (info?.purpose === 'totp_login') {
    const u = getDb().select().from(users).where(eq(users.id, info.userId)).get();
    verdict = verifyTotpLogin(challenge, code, u?.totpSecret ?? null);
  } else {
    verdict = verifyLoginOtp(challenge, code);
  }
  if (verdict.status === 'expired') {
    return NextResponse.json({ error: 'Код устарел. Войдите заново, мы отправим новый.' }, { status: 401 });
  }
  if (verdict.status === 'too_many') {
    return NextResponse.json({ error: 'Слишком много неверных попыток. Войдите заново.' }, { status: 429 });
  }
  if (verdict.status === 'invalid') {
    return NextResponse.json(
      { error: `Неверный код. Осталось попыток: ${verdict.attemptsLeft}.` },
      { status: 401 },
    );
  }

  const user = getDb().select().from(users).where(eq(users.id, verdict.userId)).get();
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Аккаунт заблокирован администратором.' }, { status: 403 });
  }

  const { token, expiresAt } = createSession(user.id, requestMeta(request));
  await setSessionCookie(token, expiresAt);
  recordAudit({ id: user.id, email: user.email }, 'auth.login', user.email, `ip=${ip} otp`);
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
}
