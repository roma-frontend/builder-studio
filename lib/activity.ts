// Staff activity trail (ported/adapted from caron's activity.ts). One row per
// dashboard route a staff member visits — a lightweight audit of navigation the
// superadmin can review. Best-effort TTL prune keeps the table bounded without
// a dedicated cron.

import 'server-only';
import { and, desc, eq, lt } from 'drizzle-orm';
import { getDb, newId, activityTrail, users } from '@/lib/db';

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // keep 30 days

/** Record one route visit. Never throws (monitoring must not break requests). */
export function recordActivity(userId: string, path: string): void {
  try {
    getDb().insert(activityTrail).values({ id: newId('act'), userId, path: path.slice(0, 200), at: new Date() }).run();
    // Best-effort prune (~5% of calls): drop this user's entries older than TTL.
    if (Math.random() < 0.05) {
      getDb().delete(activityTrail).where(and(eq(activityTrail.userId, userId), lt(activityTrail.at, new Date(Date.now() - TTL_MS)))).run();
    }
  } catch {
    /* trail is non-critical */
  }
}

export interface TrailEntry { id: string; path: string; at: string }

/** A single staff member's recent route visits, newest first. */
export function recentTrailForUser(userId: string, limit = 50): TrailEntry[] {
  return getDb()
    .select()
    .from(activityTrail)
    .where(eq(activityTrail.userId, userId))
    .orderBy(desc(activityTrail.at))
    .limit(limit)
    .all()
    .map((r) => ({ id: r.id, path: r.path, at: r.at.toISOString() }));
}

export interface StaffTrailRow { id: string; userId: string; userName: string; userEmail: string; path: string; at: string }

/** Platform-wide staff navigation feed (superadmin view), newest first. */
export function recentTrail(limit = 200): StaffTrailRow[] {
  return getDb()
    .select({ t: activityTrail, u: users })
    .from(activityTrail)
    .innerJoin(users, eq(activityTrail.userId, users.id))
    .orderBy(desc(activityTrail.at))
    .limit(limit)
    .all()
    .map(({ t, u }) => ({ id: t.id, userId: u.id, userName: u.name, userEmail: u.email, path: t.path, at: t.at.toISOString() }));
}
