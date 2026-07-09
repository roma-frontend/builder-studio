import { describe, it, expect } from 'vitest';
import { signSiteInvite, verifySiteInvite } from '@/lib/site-invite';

describe('site invite tokens', () => {
  it('verifies a token it signed', () => {
    const tok = signSiteInvite('s_abc');
    expect(verifySiteInvite('s_abc', tok)).toBe(true);
  });

  it('is deterministic per site (QR never rotates)', () => {
    expect(signSiteInvite('s_abc')).toBe(signSiteInvite('s_abc'));
  });

  it('rejects a token minted for a different site', () => {
    const tok = signSiteInvite('s_abc');
    expect(verifySiteInvite('s_other', tok)).toBe(false);
  });

  it('rejects a forged / empty token', () => {
    expect(verifySiteInvite('s_abc', 'not-a-real-token')).toBe(false);
    expect(verifySiteInvite('s_abc', '')).toBe(false);
    expect(verifySiteInvite('s_abc', null)).toBe(false);
    expect(verifySiteInvite('', signSiteInvite('s_abc'))).toBe(false);
  });
});
