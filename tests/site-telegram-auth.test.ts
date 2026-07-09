import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { loginOrCreateSiteTelegramUser } from '@/lib/site-telegram-auth';
import { createSiteOauthHandoff, consumeSiteOauthHandoff } from '@/lib/site-auth-codes';
import type { TelegramAuthPayload } from '@/lib/telegram-auth';
import { getDb, siteUsers } from '@/lib/db';
import { resetDb } from './helpers';

beforeEach(() => resetDb());

function seedSite() {
  const u = createUser('owner@example.com', 'password123', 'Owner');
  return createSite(u.id, 'Tenant');
}
function payload(o: Partial<TelegramAuthPayload> = {}): TelegramAuthPayload {
  return { id: 'tg-1', first_name: 'Roman', username: 'i_amVip', auth_date: '1700000000', hash: 'x', ...o };
}

describe('loginOrCreateSiteTelegramUser', () => {
  it('creates an approved member when the site has no approval gate', () => {
    const s = seedSite();
    const { user, created } = loginOrCreateSiteTelegramUser(s.id, payload({ id: 'tg-10' }), false);
    expect(created).toBe(true);
    expect(user.telegramId).toBe('tg-10');
    expect(user.telegramUsername).toBe('i_amVip');
    expect(user.status).toBe('approved');
    // No email from Telegram → synthetic placeholder keeps the invariants.
    expect(user.email).toBe('tg_tg-10@telegram.local');
  });

  it('creates a PENDING member when approval is required', () => {
    const s = seedSite();
    const { user } = loginOrCreateSiteTelegramUser(s.id, payload({ id: 'tg-11' }), true);
    expect(user.status).toBe('pending');
  });

  it('is idempotent by telegram id', () => {
    const s = seedSite();
    const p = payload({ id: 'tg-12' });
    loginOrCreateSiteTelegramUser(s.id, p, false);
    const again = loginOrCreateSiteTelegramUser(s.id, p, false);
    expect(again.created).toBe(false);
    expect(getDb().select().from(siteUsers).all().filter((u) => u.telegramId === 'tg-12').length).toBe(1);
  });

  it('refreshes the @username on a later login', () => {
    const s = seedSite();
    loginOrCreateSiteTelegramUser(s.id, payload({ id: 'tg-13', username: 'old' }), false);
    const again = loginOrCreateSiteTelegramUser(s.id, payload({ id: 'tg-13', username: 'new_handle' }), false);
    expect(again.created).toBe(false);
    expect(again.user.telegramUsername).toBe('new_handle');
  });

  it('derives a name from first/last, then username, then a fallback', () => {
    const s = seedSite();
    const withName = loginOrCreateSiteTelegramUser(s.id, payload({ id: 'tg-14', first_name: 'Ann', last_name: 'Lee', username: undefined }), false);
    expect(withName.user.name).toBe('Ann Lee');
    const onlyUser = loginOrCreateSiteTelegramUser(s.id, payload({ id: 'tg-15', first_name: undefined, last_name: undefined, username: 'handle' }), false);
    expect(onlyUser.user.name).toBe('handle');
    const bare = loginOrCreateSiteTelegramUser(s.id, payload({ id: 'tg-16', first_name: undefined, last_name: undefined, username: undefined }), false);
    expect(bare.user.name).toBe('Telegram tg-16');
  });

  it('isolates members per site', () => {
    const s1 = seedSite();
    const u2 = createUser('owner2@example.com', 'password123', 'Owner2');
    const s2 = createSite(u2.id, 'Tenant2');
    const a = loginOrCreateSiteTelegramUser(s1.id, payload({ id: 'tg-x' }), false);
    const b = loginOrCreateSiteTelegramUser(s2.id, payload({ id: 'tg-y' }), false);
    expect(a.user.id).not.toBe(b.user.id);
    // The same Telegram id can be a member of two different sites independently.
    const c = loginOrCreateSiteTelegramUser(s2.id, payload({ id: 'tg-x' }), false);
    expect(c.created).toBe(true);
    expect(c.user.id).not.toBe(a.user.id);
  });

  it('shares the provider-agnostic handoff token round-trip', () => {
    const s = seedSite();
    const { user } = loginOrCreateSiteTelegramUser(s.id, payload({ id: 'tg-20' }), false);
    const { token } = createSiteOauthHandoff({ id: user.id, email: user.email, siteId: s.id });
    expect(consumeSiteOauthHandoff(token)).toEqual({ siteUserId: user.id, siteId: s.id });
    expect(consumeSiteOauthHandoff(token)).toBeNull();
  });
});
