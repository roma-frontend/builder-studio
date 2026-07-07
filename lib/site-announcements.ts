import 'server-only';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb, newId, siteAnnouncements, siteUsers, type SiteAnnouncement } from '@/lib/db';
import { notifyMember } from '@/lib/site-membership';

// Admin announcements broadcast to a site's members. Creating one also fans out
// a per-member notification. All siteId-scoped.

export function createAnnouncement(
  siteId: string,
  adminUserId: string,
  data: { title?: string; body?: string; pinned?: boolean },
): SiteAnnouncement {
  const row: SiteAnnouncement = {
    id: newId('ann'),
    siteId,
    title: (data.title ?? '').slice(0, 200),
    body: (data.body ?? '').slice(0, 20000),
    pinned: data.pinned ?? false,
    createdBy: adminUserId,
    createdAt: new Date(),
  };
  getDb().insert(siteAnnouncements).values(row).run();
  const members = getDb().select({ id: siteUsers.id }).from(siteUsers).where(and(eq(siteUsers.siteId, siteId), eq(siteUsers.status, 'approved'))).all();
  for (const m of members) notifyMember(siteId, m.id, 'announcement', row.title || 'Новое объявление', row.body.slice(0, 200));
  return row;
}

export function listForAdmin(siteId: string): SiteAnnouncement[] {
  return getDb()
    .select()
    .from(siteAnnouncements)
    .where(eq(siteAnnouncements.siteId, siteId))
    .orderBy(desc(siteAnnouncements.pinned), desc(siteAnnouncements.createdAt))
    .all();
}

export function deleteAnnouncement(siteId: string, id: string): void {
  getDb().delete(siteAnnouncements).where(and(eq(siteAnnouncements.id, id), eq(siteAnnouncements.siteId, siteId))).run();
}

export interface MemberAnnouncement { id: string; title: string; body: string; pinned: boolean; createdAt: Date }

/** Announcements for members (pinned first, then newest). Call after the gate. */
export function listPublished(siteId: string): MemberAnnouncement[] {
  return getDb()
    .select({ id: siteAnnouncements.id, title: siteAnnouncements.title, body: siteAnnouncements.body, pinned: siteAnnouncements.pinned, createdAt: siteAnnouncements.createdAt })
    .from(siteAnnouncements)
    .where(eq(siteAnnouncements.siteId, siteId))
    .orderBy(desc(siteAnnouncements.pinned), desc(siteAnnouncements.createdAt))
    .all();
}

export function countPublished(siteId: string): number {
  const row = getDb().select({ n: sql<number>`count(*)` }).from(siteAnnouncements).where(eq(siteAnnouncements.siteId, siteId)).get();
  return row?.n ?? 0;
}
