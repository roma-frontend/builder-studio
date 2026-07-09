import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import { resetDb } from './helpers';
import { verifyTelegramHash, isSuperadminTelegram, loginOrCreateTelegramUser, linkTelegramToUser, unlinkTelegramFromUser } from '@/lib/telegram-auth';
import { getDb, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

const BOT_TOKEN = '123456:TEST-TOKEN';
const OLD_ENV = { ...process.env };

/** Produce a valid Login Widget hash for the given fields (mirrors Telegram). */
function sign(fields: Record<string, string>, token = BOT_TOKEN): string {
  const dcs = Object.keys(fields)
    .filter((k) => fields[k] !== undefined && fields[k] !== '')
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const secret = createHash('sha256').update(token).digest();
  return createHmac('sha256', secret).update(dcs).digest('hex');
}

beforeEach(() => {
  resetDb();
  process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  delete process.env.SUPERADMIN_TELEGRAM;
});
afterEach(() => { process.env = { ...OLD_ENV }; vi.restoreAllMocks(); });

describe('verifyTelegramHash', () => {
  it('accepts a correctly signed payload', () => {
    const fields = { id: '777', auth_date: '1700000000', first_name: 'Ann', username: 'ann' };
    expect(verifyTelegramHash(fields, sign(fields), BOT_TOKEN)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const fields = { id: '777', auth_date: '1700000000' };
    const hash = sign(fields);
    expect(verifyTelegramHash({ ...fields, id: '778' }, hash, BOT_TOKEN)).toBe(false);
  });

  it('rejects a wrong-token signature', () => {
    const fields = { id: '777', auth_date: '1700000000' };
    expect(verifyTelegramHash(fields, sign(fields, 'other:token'), BOT_TOKEN)).toBe(false);
  });
});

describe('isSuperadminTelegram', () => {
  it('matches env handles case-insensitively and ignores @', () => {
    process.env.SUPERADMIN_TELEGRAM = '@Owner, second';
    expect(isSuperadminTelegram('owner')).toBe(true);
    expect(isSuperadminTelegram('SECOND')).toBe(true);
    expect(isSuperadminTelegram('nobody')).toBe(false);
    expect(isSuperadminTelegram(undefined)).toBe(false);
  });
});

describe('loginOrCreateTelegramUser', () => {
  const freshAuthDate = () => String(Math.floor(Date.now() / 1000));

  it('creates a user on first login (first account becomes superadmin)', () => {
    const fields = { id: '1001', auth_date: freshAuthDate(), first_name: 'Ann', username: 'ann' };
    const res = loginOrCreateTelegramUser({ ...fields, hash: sign(fields) } as never);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.created).toBe(true);
      expect(res.user.telegramId).toBe('1001');
      expect(res.user.telegramUsername).toBe('ann');
      expect(res.user.email).toBe('tg_1001@telegram.local');
      expect(res.user.role).toBe('superadmin'); // first account bootstraps owner
    }
  });

  it('finds the existing user on repeat login (no duplicate)', () => {
    const fields = { id: '2002', auth_date: freshAuthDate(), username: 'bob' };
    loginOrCreateTelegramUser({ ...fields, hash: sign(fields) } as never); // seed owner+ this
    const fields2 = { id: '2002', auth_date: freshAuthDate(), username: 'bob' };
    const res = loginOrCreateTelegramUser({ ...fields2, hash: sign(fields2) } as never);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.created).toBe(false);
    const count = getDb().select().from(users).all().filter((u) => u.telegramId === '2002').length;
    expect(count).toBe(1);
  });

  it('links a superadmin Telegram handle to the existing (email) superadmin — one account', async () => {
    const { createUser } = await import('@/lib/auth');
    const emailSuper = createUser('owner@example.com', 'pw-123456', 'Owner'); // first account → superadmin
    expect(emailSuper.role).toBe('superadmin');
    process.env.SUPERADMIN_TELEGRAM = 'owner';

    const fields = { id: '9009', auth_date: freshAuthDate(), username: 'owner', first_name: 'Owner' };
    const res = loginOrCreateTelegramUser({ ...fields, hash: sign(fields) } as never);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.created).toBe(false); // linked, not created
      expect(res.user.id).toBe(emailSuper.id); // same account
      expect(res.user.email).toBe('owner@example.com'); // real email preserved
      expect(res.user.telegramId).toBe('9009');
      expect(res.user.role).toBe('superadmin');
    }
    // Exactly one superadmin account exists.
    const supers = getDb().select().from(users).all().filter((u) => u.role === 'superadmin');
    expect(supers.length).toBe(1);
  });

  it('rejects a bad signature', () => {
    const fields = { id: '3003', auth_date: freshAuthDate() };
    const res = loginOrCreateTelegramUser({ ...fields, hash: 'deadbeef' } as never);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('bad_signature');
  });

  it('rejects a stale authorization (replay guard)', () => {
    const stale = String(Math.floor(Date.now() / 1000) - 48 * 3600);
    const fields = { id: '4004', auth_date: stale };
    const res = loginOrCreateTelegramUser({ ...fields, hash: sign(fields) } as never);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('expired');
  });

  it('returns not_configured without a bot token', () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const fields = { id: '5005', auth_date: freshAuthDate() };
    const res = loginOrCreateTelegramUser({ ...fields, hash: sign(fields) } as never);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('not_configured');
  });
});

describe('linkTelegramToUser / unlinkTelegramFromUser', () => {
  const freshAuthDate = () => String(Math.floor(Date.now() / 1000));

  it('links a verified Telegram identity to an existing email account (same account → subscription recognized)', async () => {
    const { createUser } = await import('@/lib/auth');
    const emailUser = createUser('buyer@example.com', 'pw-123456', 'Buyer'); // e.g. bought a subscription
    const fields = { id: '7001', auth_date: freshAuthDate(), username: 'buyer_tg' };
    const link = linkTelegramToUser(emailUser.id, { ...fields, hash: sign(fields) } as never);
    expect(link.ok).toBe(true);
    if (link.ok) expect(link.username).toBe('buyer_tg');

    // A subsequent Telegram login now resolves to the SAME account (no new user).
    const login = loginOrCreateTelegramUser({ ...fields, hash: sign(fields) } as never);
    expect(login.ok).toBe(true);
    if (login.ok) {
      expect(login.created).toBe(false);
      expect(login.user.id).toBe(emailUser.id);
      expect(login.user.email).toBe('buyer@example.com');
    }
    const count = getDb().select().from(users).all().length;
    expect(count).toBe(1); // exactly one account
  });

  it('refuses to steal a Telegram id already bound to another account', async () => {
    const { createUser } = await import('@/lib/auth');
    const a = createUser('a@example.com', 'pw-123456', 'A'); // owner of the telegram id
    const fields = { id: '7002', auth_date: freshAuthDate(), username: 'x' };
    expect(linkTelegramToUser(a.id, { ...fields, hash: sign(fields) } as never).ok).toBe(true);

    const b = createUser('b@example.com', 'pw-123456', 'B');
    const res = linkTelegramToUser(b.id, { ...fields, hash: sign(fields) } as never);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('telegram_taken');
  });

  it('rejects a bad signature and unlinks cleanly', async () => {
    const { createUser } = await import('@/lib/auth');
    const u = createUser('c@example.com', 'pw-123456', 'C');
    const fields = { id: '7003', auth_date: freshAuthDate() };
    expect(linkTelegramToUser(u.id, { ...fields, hash: 'bad' } as never).ok).toBe(false);

    // Link then unlink.
    linkTelegramToUser(u.id, { ...fields, hash: sign(fields) } as never);
    unlinkTelegramFromUser(u.id);
    const row = getDb().select().from(users).where(eq(users.id, u.id)).get();
    expect(row?.telegramId ?? null).toBeNull();
  });
});
