import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetDb } from './helpers';
import {
  isSuperadminEmail,
  buildGoogleAuthUrl,
  getGoogleRedirectUri,
  getSiteGoogleRedirectUri,
  getGoogleConfig,
  exchangeGoogleCode,
  loginOrCreateGoogleUser,
  type GoogleProfile,
} from '@/lib/google-auth';
import { getDb, users } from '@/lib/db';

const OLD_ENV = { ...process.env };

function profile(overrides: Partial<GoogleProfile> = {}): GoogleProfile {
  return { sub: 'g-1', email: 'user@example.com', email_verified: true, name: 'A User', ...overrides };
}

beforeEach(() => {
  resetDb();
  delete process.env.SUPERADMIN_EMAILS;
  delete process.env.SUPERADMIN_EMAIL;
});
afterEach(() => { process.env = { ...OLD_ENV }; vi.restoreAllMocks(); });

describe('isSuperadminEmail', () => {
  it('matches SUPERADMIN_EMAILS case-insensitively', () => {
    process.env.SUPERADMIN_EMAILS = 'Owner@Example.com, boss@x.io';
    expect(isSuperadminEmail('owner@example.com')).toBe(true);
    expect(isSuperadminEmail('BOSS@X.IO')).toBe(true);
    expect(isSuperadminEmail('nobody@x.io')).toBe(false);
    expect(isSuperadminEmail(undefined)).toBe(false);
  });
});

describe('buildGoogleAuthUrl / redirect uri', () => {
  it('builds a consent URL with the required params', () => {
    process.env.GOOGLE_CLIENT_ID = 'cid.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.GOOGLE_REDIRECT_URI = 'https://app.example.com/api/auth/google/callback';
    const url = new URL(buildGoogleAuthUrl('state123'));
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe('cid.apps.googleusercontent.com');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.example.com/api/auth/google/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('openid email profile');
    expect(url.searchParams.get('state')).toBe('state123');
  });

  it('derives the redirect uri from the app host', () => {
    delete process.env.GOOGLE_REDIRECT_URI;
    process.env.NEXT_PUBLIC_APP_HOST = 'studio.acme.com';
    expect(getGoogleRedirectUri()).toBe('https://studio.acme.com/api/auth/google/callback');
  });

  it('derives the tenant callback uri from the app host', () => {
    process.env.NEXT_PUBLIC_APP_HOST = 'studio.acme.com';
    expect(getSiteGoogleRedirectUri()).toBe('https://studio.acme.com/api/site-auth/google/callback');
  });
});

describe('getGoogleConfig', () => {
  it('is configured only with both id and secret', () => {
    delete process.env.GOOGLE_CLIENT_ID; delete process.env.AUTH_GOOGLE_ID;
    delete process.env.GOOGLE_CLIENT_SECRET; delete process.env.AUTH_GOOGLE_SECRET;
    expect(getGoogleConfig().configured).toBe(false);
    process.env.GOOGLE_CLIENT_ID = 'cid';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    const cfg = getGoogleConfig();
    expect(cfg.configured).toBe(true);
    expect(cfg.clientId).toBe('cid');
  });
});

describe('exchangeGoogleCode', () => {
  it('fails fast when Google is not configured (no network call)', async () => {
    delete process.env.GOOGLE_CLIENT_ID; delete process.env.AUTH_GOOGLE_ID;
    delete process.env.GOOGLE_CLIENT_SECRET; delete process.env.AUTH_GOOGLE_SECRET;
    const res = await exchangeGoogleCode('any-code', 'https://app.example.com/cb');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('not_configured');
  });
});

describe('loginOrCreateGoogleUser', () => {
  it('creates a user on first login (first account becomes superadmin)', () => {
    const res = loginOrCreateGoogleUser(profile({ sub: 'g-100', email: 'first@example.com' }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.created).toBe(true);
      expect(res.user.googleId).toBe('g-100');
      expect(res.user.email).toBe('first@example.com');
      expect(res.user.role).toBe('superadmin'); // bootstrap owner
    }
  });

  it('finds the existing user on repeat login (no duplicate)', () => {
    loginOrCreateGoogleUser(profile({ sub: 'g-200', email: 'seed@example.com' })); // owner
    const p = profile({ sub: 'g-201', email: 'bob@example.com' });
    loginOrCreateGoogleUser(p);
    const res = loginOrCreateGoogleUser(p);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.created).toBe(false);
    const count = getDb().select().from(users).all().filter((u) => u.googleId === 'g-201').length;
    expect(count).toBe(1);
  });

  it('links Google to an existing email account — one account, unified', async () => {
    const { createUser } = await import('@/lib/auth');
    const emailUser = createUser('owner@example.com', 'pw-123456', 'Owner'); // first → superadmin
    expect(emailUser.role).toBe('superadmin');
    process.env.SUPERADMIN_EMAILS = 'owner@example.com';

    const res = loginOrCreateGoogleUser(profile({ sub: 'g-300', email: 'Owner@example.com' }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.created).toBe(false); // linked, not created
      expect(res.user.id).toBe(emailUser.id); // same account
      expect(res.user.googleId).toBe('g-300');
      expect(res.user.role).toBe('superadmin');
    }
    const supers = getDb().select().from(users).all().filter((u) => u.role === 'superadmin');
    expect(supers.length).toBe(1);
  });

  it('promotes a designated superadmin email on first Google login', () => {
    loginOrCreateGoogleUser(profile({ sub: 'g-owner', email: 'owner@example.com' })); // becomes owner (first)
    process.env.SUPERADMIN_EMAILS = 'admin@example.com';
    const res = loginOrCreateGoogleUser(profile({ sub: 'g-admin', email: 'admin@example.com' }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.user.role).toBe('superadmin');
  });

  it('rejects a suspended account', () => {
    const p = profile({ sub: 'g-sus', email: 'sus@example.com' });
    const first = loginOrCreateGoogleUser(profile({ sub: 'g-o', email: 'o@example.com' })); // owner
    expect(first.ok).toBe(true);
    loginOrCreateGoogleUser(p); // create customer
    getDb().update(users).set({ isActive: false }).run(); // suspend everyone
    const res = loginOrCreateGoogleUser(p);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('suspended');
  });
});
