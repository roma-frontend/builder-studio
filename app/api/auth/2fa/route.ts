import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { getDb, users } from '@/lib/db';
import { generateTotpSecret, verifyTotp, otpauthUrl } from '@/lib/totp';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';

/** Current 2FA status for the signed-in user. */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ enabled: Boolean(me.totpEnabled) });
}

/**
 * begin  → generate a secret, return it + otpauth URL (not yet enabled).
 * verify → confirm a code against the pending secret and enable 2FA.
 * disable→ remove the secret and turn 2FA off.
 */
export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = getDb();

  let body: { action?: string; code?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }); }

  if (body.action === 'begin') {
    const secret = generateTotpSecret();
    db.update(users).set({ totpSecret: secret, totpEnabled: false }).where(eq(users.id, me.id)).run();
    return NextResponse.json({ ok: true, secret, otpauth: otpauthUrl(secret, me.email) });
  }

  if (body.action === 'verify') {
    const fresh = db.select().from(users).where(eq(users.id, me.id)).get();
    if (!fresh?.totpSecret) return NextResponse.json({ error: 'no_secret' }, { status: 400 });
    if (!verifyTotp(fresh.totpSecret, (body.code ?? '').trim())) {
      return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
    }
    db.update(users).set({ totpEnabled: true }).where(eq(users.id, me.id)).run();
    recordAudit({ id: me.id, email: me.email }, 'auth.2fa_enabled', me.email);
    return NextResponse.json({ ok: true, enabled: true });
  }

  if (body.action === 'disable') {
    db.update(users).set({ totpSecret: null, totpEnabled: false }).where(eq(users.id, me.id)).run();
    recordAudit({ id: me.id, email: me.email }, 'auth.2fa_disabled', me.email);
    return NextResponse.json({ ok: true, enabled: false });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
