import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { getDb, newId, siteUsers, type SiteUser } from '@/lib/db';
import type { GoogleProfile } from '@/lib/google-auth';

// Tenant (site end-user) side of "Sign in with Google". Fully isolated per
// site — keyed by (siteId, googleId), then unified by (siteId, verified email)
// so a member who already has a password/OTP account on THIS site gets Google
// linked rather than duplicated. Mirrors lib/site-auth.createSiteUser but for
// a Google identity (no local password). Pure + unit-testable; the route owns
// the OAuth dance and the cross-host session handoff.

const normEmail = (e: string) => e.trim().toLowerCase();

/** A never-usable scrypt-shaped hash: Google members have no local password. */
function unusablePasswordHash(): string {
  return `scrypt:16384:8:1:${randomBytes(16).toString('base64')}:${randomBytes(64).toString('base64')}`;
}

export interface SiteGoogleResult { user: SiteUser; created: boolean }

/**
 * Find-or-create a site end-user for a verified Google profile, scoped to one
 * site. `memberApproval` (from the site) decides the status of a brand-new
 * member: true → 'pending' (awaits owner review), false → 'approved'.
 */
export function loginOrCreateSiteGoogleUser(
  siteId: string,
  profile: GoogleProfile,
  memberApproval: boolean,
): SiteGoogleResult {
  const db = getDb();
  const email = normEmail(profile.email);

  // 1) Already linked by Google id on this site.
  let user =
    db.select().from(siteUsers).where(and(eq(siteUsers.siteId, siteId), eq(siteUsers.googleId, profile.sub))).get() ?? null;
  if (user) return { user, created: false };

  // 2) Unify with an existing account (same verified email on this site).
  const byEmail =
    db.select().from(siteUsers).where(and(eq(siteUsers.siteId, siteId), eq(siteUsers.email, email))).get() ?? null;
  if (byEmail) {
    db.update(siteUsers).set({ googleId: profile.sub, updatedAt: new Date() }).where(eq(siteUsers.id, byEmail.id)).run();
    return { user: { ...byEmail, googleId: profile.sub }, created: false };
  }

  // 3) First-time member → create (status per the site's approval policy).
  const name = profile.name
    || [profile.given_name, profile.family_name].filter(Boolean).join(' ').trim()
    || email.split('@')[0];
  const now = new Date();
  const status: 'approved' | 'pending' = memberApproval ? 'pending' : 'approved';
  user = {
    id: newId('su'),
    siteId,
    email,
    name: name.slice(0, 120),
    passwordHash: unusablePasswordHash(),
    status,
    approvedBy: null,
    approvedAt: status === 'approved' ? now : null,
    rejectionReason: '',
    phone: '',
    avatarColor: '',
    emailNotify: true,
    marketing: false,
    locale: '',
    theme: '',
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    googleId: profile.sub,
    appleId: null,
    telegramId: null,
    telegramUsername: null,
  };
  db.insert(siteUsers).values(user).run();
  return { user, created: true };
}
