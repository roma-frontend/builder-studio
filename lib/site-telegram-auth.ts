import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { getDb, newId, siteUsers, type SiteUser } from '@/lib/db';
import type { TelegramAuthPayload } from '@/lib/telegram-auth';

// Tenant (site end-user) side of Telegram Login — the mirror of
// lib/site-google-auth.ts / lib/site-apple-auth.ts, keyed by (siteId,
// telegramId). Telegram provides no email, so there is no email-unification
// step (unlike Google/Apple): a synthetic tg_<id>@telegram.local address keeps
// the NOT NULL / (siteId,email) unique invariants. Pure + unit-testable; the
// route owns the HMAC verification and the cross-host session handoff.

/** A never-usable scrypt-shaped hash: Telegram members have no local password. */
function unusablePasswordHash(): string {
  return `scrypt:16384:8:1:${randomBytes(16).toString('base64')}:${randomBytes(64).toString('base64')}`;
}

export interface SiteTelegramResult { user: SiteUser; created: boolean }

/**
 * Find-or-create a site end-user for a verified Telegram identity, scoped to
 * one site. `memberApproval` (from the site) decides a brand-new member's
 * status: true → 'pending' (awaits owner review), false → 'approved'. The
 * caller MUST have verified the Login Widget HMAC before calling this.
 */
export function loginOrCreateSiteTelegramUser(
  siteId: string,
  payload: TelegramAuthPayload,
  memberApproval: boolean,
): SiteTelegramResult {
  const db = getDb();
  const telegramId = String(payload.id);
  const username = payload.username?.trim() || null;

  // 1) Already linked by Telegram id on this site — keep the @username fresh.
  const existing =
    db.select().from(siteUsers).where(and(eq(siteUsers.siteId, siteId), eq(siteUsers.telegramId, telegramId))).get() ?? null;
  if (existing) {
    if (username && existing.telegramUsername !== username) {
      db.update(siteUsers).set({ telegramUsername: username, updatedAt: new Date() }).where(eq(siteUsers.id, existing.id)).run();
      return { user: { ...existing, telegramUsername: username }, created: false };
    }
    return { user: existing, created: false };
  }

  // 2) First-time member → create (status per the site's approval policy).
  const name = [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim()
    || username
    || `Telegram ${telegramId}`;
  const now = new Date();
  const status: 'approved' | 'pending' = memberApproval ? 'pending' : 'approved';
  const user: SiteUser = {
    id: newId('su'),
    siteId,
    // Telegram gives no email — synthetic placeholder keeps the invariants.
    email: `tg_${telegramId}@telegram.local`,
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
    googleId: null,
    appleId: null,
    telegramId,
    telegramUsername: username,
  };
  db.insert(siteUsers).values(user).run();
  return { user, created: true };
}
