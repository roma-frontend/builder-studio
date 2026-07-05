import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  DUMMY_HASH,
  normalizeEmail,
  isStaff,
  isSuperadmin,
  lockRemainingMs,
  rateLimit,
} from '@/lib/auth';

describe('password hashing (scrypt)', () => {
  it('round-trips a correct password', () => {
    const hash = hashPassword('correct horse battery staple');
    expect(hash.startsWith('scrypt:')).toBe(true);
    expect(verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects a wrong password', () => {
    const hash = hashPassword('s3cret');
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('produces a unique salt per hash', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
  });

  it('rejects a tampered/garbage hash without throwing', () => {
    expect(verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(verifyPassword('x', 'scrypt:16384:8:1:bad')).toBe(false);
  });

  it('never validates against the dummy hash', () => {
    expect(verifyPassword('anything', DUMMY_HASH)).toBe(false);
    expect(verifyPassword('', DUMMY_HASH)).toBe(false);
  });
});

describe('helpers', () => {
  it('normalizeEmail trims and lowercases', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
  });

  it('role predicates', () => {
    expect(isSuperadmin({ role: 'superadmin' })).toBe(true);
    expect(isSuperadmin({ role: 'admin' })).toBe(false);
    expect(isStaff({ role: 'admin' })).toBe(true);
    expect(isStaff({ role: 'superadmin' })).toBe(true);
    expect(isStaff({ role: 'customer' })).toBe(false);
    expect(isStaff(null)).toBe(false);
  });
});

describe('account lockout window', () => {
  it('returns 0 when not locked', () => {
    expect(lockRemainingMs({ lockedUntil: null })).toBe(0);
    expect(lockRemainingMs({ lockedUntil: new Date(Date.now() - 1000) })).toBe(0);
  });

  it('returns remaining ms when locked in the future', () => {
    const ms = lockRemainingMs({ lockedUntil: new Date(Date.now() + 60_000) });
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(60_000);
  });
});

describe('in-memory rate limiter', () => {
  it('allows up to max then blocks within the window', () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3)).toBe(true);
    expect(rateLimit(key, 3)).toBe(false);
  });

  it('resets after the window elapses', () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 1, 1)).toBe(true); // 1ms window
    return new Promise((r) => setTimeout(r, 5)).then(() => {
      expect(rateLimit(key, 1, 1)).toBe(true);
    });
  });
});
