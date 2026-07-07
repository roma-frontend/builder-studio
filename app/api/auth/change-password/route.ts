// Self-service password change for a logged-in platform user. Used by the
// forced "must change password" flow after a superadmin issues a temporary
// password, and available for voluntary changes too.
//
// The user must prove knowledge of their current password. On success the new
// hash is stored, the "must change" flag is cleared, any lockout is reset, and
// every OTHER session is revoked (the current one is kept so the user stays
// signed in). A leaked temp password therefore can't outlive the change.

import { NextResponse } from 'next/server';
import { and, eq, ne } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { getCurrentUser, hashPassword, verifyPassword, rateLimit, SESSION_COOKIE } from '@/lib/auth';
import { getDb, sessions, users } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { getLocale } from '@/lib/i18n';
import { apiErrors } from '@/lib/api-errors-dict';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`chpw:${me.id}:${ip}`, 10)) {
    return NextResponse.json({ error: t.tooManyRequests }, { status: 429 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const current = body.currentPassword ?? '';
  const next = body.newPassword ?? '';
  if (next.length < 8) return NextResponse.json({ error: t.newPasswordMin8 }, { status: 400 });
  if (next.length > 200) return NextResponse.json({ error: t.passwordTooLong }, { status: 400 });

  if (!verifyPassword(current, me.passwordHash)) {
    recordAudit({ id: me.id, email: me.email }, 'auth.password_change_failed', me.email, `ip=${ip}`);
    return NextResponse.json({ error: t.wrongCurrentPassword }, { status: 400 });
  }
  if (verifyPassword(next, me.passwordHash)) {
    return NextResponse.json({ error: t.changePasswordFailed }, { status: 400 });
  }

  const db = getDb();
  db.update(users)
    .set({ passwordHash: hashPassword(next), failedAttempts: 0, lockedUntil: null, mustChangePassword: false })
    .where(eq(users.id, me.id))
    .run();

  // Keep the current session, drop the rest.
  const raw = (await cookies()).get(SESSION_COOKIE)?.value ?? '';
  const currentSessionId = raw ? createHash('sha256').update(raw).digest('hex') : '';
  db.delete(sessions).where(and(eq(sessions.userId, me.id), ne(sessions.id, currentSessionId))).run();

  recordAudit({ id: me.id, email: me.email }, 'auth.password_change', me.email, `ip=${ip}`);
  return NextResponse.json({ ok: true });
}
