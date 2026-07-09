import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { createSiteUser } from '@/lib/site-auth';
import { loginOrCreateSiteAppleUser } from '@/lib/site-apple-auth';
import { createSiteOauthHandoff, consumeSiteOauthHandoff } from '@/lib/site-auth-codes';
import type { AppleProfile } from '@/lib/apple-auth';
import { getDb, siteUsers } from '@/lib/db';
import { resetDb } from './helpers';

beforeEach(() => resetDb());

function seedSite() {
  const u = createUser('owner@example.com', 'password123', 'Owner');
  return createSite(u.id, 'Tenant');
}
function profile(o: Partial<AppleProfile> = {}): AppleProfile {
  return { sub: 'a-1', email: 'member@icloud.com', email_verified: true, ...o };
}

describe('loginOrCreateSiteAppleUser', () => {
  it('creates an approved member when the site has no approval gate', () => {
    const s = seedSite();
    const { user, created } = loginOrCreateSiteAppleUser(s.id, profile({ sub: 'a-10' }), false);
    expect(created).toBe(true);
    expect(user.appleId).toBe('a-10');
    expect(user.status).toBe('approved');
  });

  it('creates a PENDING member when approval is required', () => {
    const s = seedSite();
    const { user } = loginOrCreateSiteAppleUser(s.id, profile({ sub: 'a-11' }), true);
    expect(user.status).toBe('pending');
  });

  it('is idempotent by apple id', () => {
    const s = seedSite();
    const p = profile({ sub: 'a-12' });
    loginOrCreateSiteAppleUser(s.id, p, false);
    const again = loginOrCreateSiteAppleUser(s.id, p, false);
    expect(again.created).toBe(false);
    expect(getDb().select().from(siteUsers).all().filter((u) => u.appleId === 'a-12').length).toBe(1);
  });

  it('links Apple to an existing member with the same email (one account)', () => {
    const s = seedSite();
    const existing = createSiteUser(s.id, 'member@icloud.com', 'password123', 'Member');
    const { user, created } = loginOrCreateSiteAppleUser(s.id, profile({ sub: 'a-13' }), false);
    expect(created).toBe(false);
    expect(user.id).toBe(existing.id);
    expect(user.appleId).toBe('a-13');
  });

  it('isolates members per site', () => {
    const s1 = seedSite();
    const u2 = createUser('owner2@example.com', 'password123', 'Owner2');
    const s2 = createSite(u2.id, 'Tenant2');
    const a = loginOrCreateSiteAppleUser(s1.id, profile({ sub: 'a-x' }), false);
    const b = loginOrCreateSiteAppleUser(s2.id, profile({ sub: 'a-y' }), false);
    expect(a.user.id).not.toBe(b.user.id);
  });

  it('shares the provider-agnostic handoff token round-trip', () => {
    const s = seedSite();
    const { user } = loginOrCreateSiteAppleUser(s.id, profile({ sub: 'a-20' }), false);
    const { token } = createSiteOauthHandoff({ id: user.id, email: user.email, siteId: s.id });
    expect(consumeSiteOauthHandoff(token)).toEqual({ siteUserId: user.id, siteId: s.id });
    expect(consumeSiteOauthHandoff(token)).toBeNull();
  });
});
