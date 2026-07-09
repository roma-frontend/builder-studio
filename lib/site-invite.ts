import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Signed org-invite tokens for the QR / invite-link join flow. A QR code embeds
// a per-site token = HMAC-SHA256("invite:<siteId>") so it is:
//   • stable   — the same site always yields the same token (QR never rotates),
//   • unforgeable — you can't self-mint one without the server secret, so a
//     stranger can't claim "I was invited" to skip the approval gate.
// When a registration carries a VALID invite for its site, the new member is
// auto-approved (joining via QR needs no manual approval — access is instead
// gated by payment, see the member-subscription flow).

/** Secret for signing invites. Falls back to a dev constant when unset so the
 *  flow is exercisable locally; production sets SESSION_SECRET. */
function inviteSecret(): string {
  return process.env.SESSION_SECRET || process.env.AUTH_SECRET || 'cwk-dev-invite-secret';
}

/** Deterministic invite token for a site (safe to embed in the QR/URL). */
export function signSiteInvite(siteId: string): string {
  return createHmac('sha256', inviteSecret()).update(`invite:${siteId}`).digest('base64url');
}

/** Constant-time check that `token` is a valid invite for `siteId`. */
export function verifySiteInvite(siteId: string, token: string | null | undefined): boolean {
  if (!token || !siteId) return false;
  const expected = signSiteInvite(siteId);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(token, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
