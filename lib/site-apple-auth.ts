import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { getDb, newId, siteUsers, type SiteUser } from '@/lib/db';
import type { AppleProfile } from '@/lib/apple-auth';

// Tenant (site end-user) side of "Sign in with Apple" — the exact mirror of
// lib/site-google-auth.ts, keyed by (siteId, appleId) then unified by
// (siteId, verified email). Pure + unit-testable; the route owns the OAuth
// dance and the cross-host session handoff.

const normEmail = (e: string) => e.trim().toLowerCase();

function unusablePasswordHash(): string {
  return `scrypt:16384:8:1:${randomBytes(16).toString('base64')}:${randomBytes(64).toString('base64')}`;
}

export interface SiteAppleResult { user: SiteUser; created: boolean }

export function loginOrCreateSiteAppleUser(
  siteId: string,
  profile: AppleProfile,
  memberApproval: boolean,
): SiteAppleResult {
  const db = getDb();
  const email = normEmail(profile.email);

  // 1) Already linked by Apple id on this site.
  let user =
    db.select().from(siteUsers).where(and(eq(siteUsers.siteId, siteId), eq(siteUsers.appleId, profile.sub))).get() ?? null;
  if (user) return { user, created: false };

  // 2) Unify with an existing account (same verified email on this site).
  const byEmail =
    db.select().from(siteUsers).where(and(eq(siteUsers.siteId, siteId), eq(siteUsers.email, email))).get() ?? null;
  if (byEmail) {
    db.update(siteUsers).set({ appleId: profile.sub, updatedAt: new Date() }).where(eq(siteUsers.id, byEmail.id)).run();
    return { user: { ...byEmail, appleId: profile.sub }, created: false };
  }

  // 3) First-time member → create (status per the site's approval policy).
  const now = new Date();
  const status: 'approved' | 'pending' = memberApproval ? 'pending' : 'approved';
  user = {
    id: newId('su'),
    siteId,
    email,
    name: email.split('@')[0].slice(0, 120),
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
    googleId: null,
    appleId: profile.sub,
    telegramId: null,
    telegramUsername: null,
  };
  db.insert(siteUsers).values(user).run();
  return { user, created: true };
}
