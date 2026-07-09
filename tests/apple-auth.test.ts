import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { resetDb } from './helpers';
import {
  getAppleConfig,
  getAppleRedirectUri,
  getSiteAppleRedirectUri,
  makeAppleClientSecret,
  buildAppleAuthUrl,
  exchangeAppleCode,
  loginOrCreateAppleUser,
  type AppleProfile,
} from '@/lib/apple-auth';
import { getDb, users } from '@/lib/db';

const OLD_ENV = { ...process.env };

/** A throwaway EC P-256 key in PKCS#8 PEM (what an Apple .p8 contains). */
function p8Key(): string {
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  return privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
}

function profile(o: Partial<AppleProfile> = {}): AppleProfile {
  return { sub: 'a-1', email: 'user@icloud.com', email_verified: true, ...o };
}

beforeEach(() => {
  resetDb();
  delete process.env.SUPERADMIN_EMAILS;
  delete process.env.SUPERADMIN_EMAIL;
});
afterEach(() => { process.env = { ...OLD_ENV }; vi.restoreAllMocks(); });

describe('getAppleConfig', () => {
  it('is unconfigured without all four values', () => {
    delete process.env.APPLE_CLIENT_ID;
    expect(getAppleConfig().configured).toBe(false);
  });
});

describe('apple redirect uris', () => {
  it('prefers an explicit APPLE_REDIRECT_URI, else derives from the app host', () => {
    process.env.APPLE_REDIRECT_URI = 'https://x.example.com/cb';
    expect(getAppleRedirectUri()).toBe('https://x.example.com/cb');
    delete process.env.APPLE_REDIRECT_URI;
    process.env.NEXT_PUBLIC_APP_HOST = 'studio.acme.com';
    expect(getAppleRedirectUri()).toBe('https://studio.acme.com/api/auth/apple/callback');
  });

  it('derives the tenant callback uri from the app host', () => {
    process.env.NEXT_PUBLIC_APP_HOST = 'studio.acme.com';
    expect(getSiteAppleRedirectUri()).toBe('https://studio.acme.com/api/site-auth/apple/callback');
  });
});

describe('exchangeAppleCode', () => {
  it('fails fast when Apple is not configured (no network call)', async () => {
    delete process.env.APPLE_CLIENT_ID;
    const res = await exchangeAppleCode('any-code', 'https://app.example.com/cb');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('not_configured');
  });
});

describe('makeAppleClientSecret', () => {
  it('produces a 3-part ES256 JWT with the right claims/header', () => {
    const cfg = { clientId: 'com.acme.web', teamId: 'TEAM123', keyId: 'KEY123', privateKey: p8Key(), configured: true };
    const jwt = makeAppleClientSecret(cfg);
    const [h, p, s] = jwt.split('.');
    expect(s.length).toBeGreaterThan(0);
    const header = JSON.parse(Buffer.from(h, 'base64').toString('utf8'));
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8'));
    expect(header).toMatchObject({ alg: 'ES256', kid: 'KEY123', typ: 'JWT' });
    expect(payload).toMatchObject({ iss: 'TEAM123', sub: 'com.acme.web', aud: 'https://appleid.apple.com' });
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });
});

describe('buildAppleAuthUrl', () => {
  it('requests code + form_post + email scope', () => {
    process.env.APPLE_CLIENT_ID = 'com.acme.web';
    process.env.APPLE_REDIRECT_URI = 'https://app.example.com/api/auth/apple/callback';
    const url = new URL(buildAppleAuthUrl('st8'));
    expect(url.origin + url.pathname).toBe('https://appleid.apple.com/auth/authorize');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('response_mode')).toBe('form_post');
    expect(url.searchParams.get('scope')).toBe('name email');
    expect(url.searchParams.get('state')).toBe('st8');
  });
});

describe('loginOrCreateAppleUser', () => {
  it('creates a user on first login (first account = superadmin)', () => {
    const res = loginOrCreateAppleUser(profile({ sub: 'a-100', email: 'first@icloud.com' }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.created).toBe(true);
      expect(res.user.appleId).toBe('a-100');
      expect(res.user.role).toBe('superadmin');
    }
  });

  it('links Apple to an existing email account (one account)', async () => {
    const { createUser } = await import('@/lib/auth');
    const emailUser = createUser('owner@example.com', 'pw-123456', 'Owner');
    process.env.SUPERADMIN_EMAILS = 'owner@example.com';
    const res = loginOrCreateAppleUser(profile({ sub: 'a-200', email: 'owner@example.com' }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.created).toBe(false);
      expect(res.user.id).toBe(emailUser.id);
      expect(res.user.appleId).toBe('a-200');
      expect(res.user.role).toBe('superadmin');
    }
    const supers = getDb().select().from(users).all().filter((u) => u.role === 'superadmin');
    expect(supers.length).toBe(1);
  });

  it('is idempotent by apple id', () => {
    loginOrCreateAppleUser(profile({ sub: 'a-o', email: 'o@icloud.com' })); // owner
    const p = profile({ sub: 'a-300', email: 'bob@icloud.com' });
    loginOrCreateAppleUser(p);
    const res = loginOrCreateAppleUser(p);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.created).toBe(false);
    const rows = getDb().select().from(users).all().filter((u) => u.appleId === 'a-300');
    expect(rows.length).toBe(1);
  });
});
