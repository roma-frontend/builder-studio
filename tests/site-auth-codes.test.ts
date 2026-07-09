import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { createSiteUser } from '@/lib/site-auth';
import {
  createSiteLoginOtp,
  verifySiteLoginOtp,
  siteChallengeUser,
  createSitePasswordReset,
  peekSitePasswordReset,
  consumeSitePasswordReset,
  createSiteOauthHandoff,
  consumeSiteOauthHandoff,
  cleanupSiteAuthCodes,
} from '@/lib/site-auth-codes';
import { resetDb } from './helpers';

beforeEach(() => resetDb());

function seed() {
  const owner = createUser('owner@example.com', 'password123', 'Owner');
  const site = createSite(owner.id, 'Tenant');
  const member = createSiteUser(site.id, 'member@example.com', 'password123', 'Member');
  return { site, member };
}

describe('site login OTP', () => {
  it('issues a 6-digit code and verifies it once', () => {
    const { site, member } = seed();
    const { challengeId, code } = createSiteLoginOtp({ id: member.id, email: member.email, siteId: site.id });
    expect(code).toMatch(/^\d{6}$/);
    // The live challenge resolves back to the member (used for resends).
    expect(siteChallengeUser(challengeId)?.id).toBe(member.id);

    const ok = verifySiteLoginOtp(challengeId, code);
    expect(ok.status).toBe('ok');
    if (ok.status === 'ok') { expect(ok.siteUserId).toBe(member.id); expect(ok.siteId).toBe(site.id); }
    // A consumed code can't be used again.
    expect(verifySiteLoginOtp(challengeId, code).status).toBe('expired');
  });

  it('rejects a wrong code and counts the attempt', () => {
    const { site, member } = seed();
    const { challengeId } = createSiteLoginOtp({ id: member.id, email: member.email, siteId: site.id });
    const bad = verifySiteLoginOtp(challengeId, '000000');
    expect(bad.status === 'invalid' || bad.status === 'too_many').toBe(true);
  });

  it('re-issuing invalidates the previous challenge', () => {
    const { site, member } = seed();
    const first = createSiteLoginOtp({ id: member.id, email: member.email, siteId: site.id });
    createSiteLoginOtp({ id: member.id, email: member.email, siteId: site.id });
    // The old challenge is gone.
    expect(verifySiteLoginOtp(first.challengeId, first.code).status).toBe('expired');
    expect(siteChallengeUser(first.challengeId)).toBeNull();
  });
});

describe('site password reset', () => {
  it('mints a token, peeks it, then consumes it once', () => {
    const { site, member } = seed();
    const { token } = createSitePasswordReset({ id: member.id, email: member.email, siteId: site.id });
    expect(peekSitePasswordReset(token)).toBe(true);
    const consumed = consumeSitePasswordReset(token);
    expect(consumed).toEqual({ siteUserId: member.id, siteId: site.id });
    // Single-use.
    expect(peekSitePasswordReset(token)).toBe(false);
    expect(consumeSitePasswordReset(token)).toBeNull();
  });

  it('rejects an unknown token', () => {
    seed();
    expect(peekSitePasswordReset('nope')).toBe(false);
    expect(consumeSitePasswordReset('')).toBeNull();
  });
});

describe('site oauth handoff', () => {
  it('mints and consumes a one-time handoff token', () => {
    const { site, member } = seed();
    const { token } = createSiteOauthHandoff({ id: member.id, email: member.email, siteId: site.id });
    expect(consumeSiteOauthHandoff(token)).toEqual({ siteUserId: member.id, siteId: site.id });
    expect(consumeSiteOauthHandoff(token)).toBeNull();
  });
});

describe('cleanupSiteAuthCodes', () => {
  it('runs without throwing on an empty table', () => {
    expect(() => cleanupSiteAuthCodes()).not.toThrow();
  });
});
