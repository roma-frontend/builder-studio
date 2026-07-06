// Saved filter presets for admin tables (ported from caron's savedViews).
// Scoped per (user, route); `query` is an opaque JSON blob the client owns.

import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { getDb, newId, savedViews } from '@/lib/db';

export interface SavedViewRow { id: string; name: string; query: Record<string, unknown>; createdAt: string }

function parse(q: string): Record<string, unknown> {
  try { const v = JSON.parse(q); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}

/** A user's saved views for one table, newest first. */
export function listSavedViews(userId: string, route: string): SavedViewRow[] {
  return getDb()
    .select()
    .from(savedViews)
    .where(and(eq(savedViews.userId, userId), eq(savedViews.route, route)))
    .orderBy(desc(savedViews.createdAt))
    .all()
    .map((r) => ({ id: r.id, name: r.name, query: parse(r.query), createdAt: r.createdAt.toISOString() }));
}

/** Create a named preset (name trimmed/capped; query JSON-encoded). */
export function createSavedView(userId: string, route: string, name: string, query: unknown): SavedViewRow {
  const id = newId('view');
  const row = {
    id, userId, route,
    name: (name || 'View').trim().slice(0, 60),
    query: JSON.stringify(query ?? {}).slice(0, 4000),
    createdAt: new Date(),
  };
  getDb().insert(savedViews).values(row).run();
  return { id, name: row.name, query: parse(row.query), createdAt: row.createdAt.toISOString() };
}

/** Delete one of the caller's own views. Returns true if a row was removed. */
export function deleteSavedView(userId: string, id: string): boolean {
  const res = getDb().delete(savedViews).where(and(eq(savedViews.id, id), eq(savedViews.userId, userId))).run();
  return res.changes > 0;
}
