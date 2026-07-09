import { NextResponse } from 'next/server';
import { getCurrentUser, rateLimit } from '@/lib/auth';
import { getTelegramConfig } from '@/lib/telegram';
import { linkTelegramToUser, unlinkTelegramFromUser, type TelegramAuthPayload } from '@/lib/telegram-auth';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';

/** GET → current Telegram link status of the signed-in user (+ whether the
 *  feature is configured, so the UI can hide it). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const configured = Boolean(getTelegramConfig().token);
  return NextResponse.json({ configured, linked: Boolean(user.telegramId), username: user.telegramUsername ?? null });
}

/** POST → link a verified Telegram identity to the signed-in account. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit(`tg-link:${user.id}:${ip}`, 20)) {
    return NextResponse.json({ error: 'too_many' }, { status: 429 });
  }

  let body: Partial<TelegramAuthPayload>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }
  if (!body.id || !body.auth_date || !body.hash) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const result = linkTelegramToUser(user.id, {
    id: String(body.id),
    first_name: body.first_name,
    last_name: body.last_name,
    username: body.username,
    photo_url: body.photo_url,
    auth_date: String(body.auth_date),
    hash: String(body.hash),
  });

  if (!result.ok) {
    const status = result.error === 'telegram_taken' ? 409 : result.error === 'not_configured' ? 503 : 401;
    return NextResponse.json({ error: result.error }, { status });
  }

  recordAudit({ id: user.id, email: user.email }, 'account.telegram_linked', user.email, `@${result.username ?? ''} ip=${ip}`);
  return NextResponse.json({ ok: true, linked: true, username: result.username });
}

/** DELETE → unlink Telegram from the signed-in account. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  unlinkTelegramFromUser(user.id);
  recordAudit({ id: user.id, email: user.email }, 'account.telegram_unlinked', user.email, '');
  return NextResponse.json({ ok: true, linked: false });
}
