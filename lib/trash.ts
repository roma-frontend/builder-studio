// Recycle bin for sites: soft-delete via snapshot into `trashed_sites`, plus
// restore / permanent purge. Because deleted sites truly leave the `sites`
// table, no other query needs to learn about "deleted" rows.

import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { getDb, sites, trashedSites, users } from '@/lib/db';

/** Snapshot a site into the trash and remove it from `sites`. Returns false if
 *  the site doesn't exist. Related rows cascade-delete with the site row. */
export function trashSite(id: string, deletedBy: string): boolean {
  const db = getDb();
  const s = db.select().from(sites).where(eq(sites.id, id)).get();
  if (!s) return false;
  db.insert(trashedSites).values({
    id: s.id, userId: s.userId, name: s.name, slug: s.slug,
    draftDoc: s.draftDoc, publishedDoc: s.publishedDoc, memberApproval: s.memberApproval,
    publishedAt: s.publishedAt, originalCreatedAt: s.createdAt,
    deletedBy, deletedAt: new Date(),
  }).run();
  db.delete(sites).where(eq(sites.id, id)).run();
  return true;
}

export interface TrashedRow {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  published: boolean;
  deletedAt: string;
  deletedByEmail: string;
  ownerExists: boolean;
}

/** All trashed sites, newest-deleted first, with owner + who deleted them. */
export function listTrashed(): TrashedRow[] {
  const db = getDb();
  const rows = db.select().from(trashedSites).orderBy(desc(trashedSites.deletedAt)).all();
  return rows.map((r) => {
    const owner = db.select({ email: users.email }).from(users).where(eq(users.id, r.userId)).get();
    const by = r.deletedBy ? db.select({ email: users.email }).from(users).where(eq(users.id, r.deletedBy)).get() : null;
    return {
      id: r.id, name: r.name, slug: r.slug,
      ownerEmail: owner?.email ?? '—',
      published: Boolean(r.publishedDoc),
      deletedAt: r.deletedAt.toISOString(),
      deletedByEmail: by?.email ?? '—',
      ownerExists: Boolean(owner),
    };
  });
}

export type RestoreResult = 'ok' | 'not_found' | 'owner_gone';

/** Recreate a trashed site. Fails if the owner no longer exists (FK); a taken
 *  slug is auto-suffixed so restore never collides. */
export function restoreSite(id: string): RestoreResult {
  const db = getDb();
  const tr = db.select().from(trashedSites).where(eq(trashedSites.id, id)).get();
  if (!tr) return 'not_found';
  const owner = db.select({ id: users.id }).from(users).where(eq(users.id, tr.userId)).get();
  if (!owner) return 'owner_gone';
  let slug = tr.slug;
  if (db.select({ id: sites.id }).from(sites).where(eq(sites.slug, slug)).get()) {
    slug = `${tr.slug}-restored-${Date.now().toString(36).slice(-4)}`;
  }
  db.insert(sites).values({
    id: tr.id, userId: tr.userId, name: tr.name, slug,
    draftDoc: tr.draftDoc, publishedDoc: tr.publishedDoc, memberApproval: tr.memberApproval,
    publishedAt: tr.publishedAt, createdAt: tr.originalCreatedAt, updatedAt: new Date(),
  }).run();
  db.delete(trashedSites).where(eq(trashedSites.id, id)).run();
  return 'ok';
}

/** Permanently remove a trashed site (irreversible). */
export function purgeTrashed(id: string): void {
  getDb().delete(trashedSites).where(eq(trashedSites.id, id)).run();
}

export function countTrashed(): number {
  const rows = getDb().select({ id: trashedSites.id }).from(trashedSites).all();
  return rows.length;
}
