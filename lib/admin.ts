// Admin/superadmin data layer: cross-tenant queries used by the dashboard's
// staff sections. Authorization is enforced by the API routes / pages that call
// these — the functions themselves are pure reads/writes.

import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb, users, sites, submissions, type User, type Role } from '@/lib/db';

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  siteCount: number;
}

export function listUsers(): AdminUserRow[] {
  const db = getDb();
  const rows = db.select().from(users).orderBy(desc(users.createdAt)).all();
  const counts = db
    .select({ userId: sites.userId, n: sql<number>`count(*)` })
    .from(sites)
    .groupBy(sites.userId)
    .all();
  const byUser = new Map(counts.map((c) => [c.userId, Number(c.n)]));
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as Role,
    createdAt: u.createdAt.toISOString(),
    siteCount: byUser.get(u.id) ?? 0,
  }));
}

export function getUserById(id: string): User | null {
  return getDb().select().from(users).where(eq(users.id, id)).get() ?? null;
}

export function setUserRole(id: string, role: Role): void {
  getDb().update(users).set({ role }).where(eq(users.id, id)).run();
}

export function countUsers(): number {
  const r = getDb().select({ n: sql<number>`count(*)` }).from(users).get();
  return Number(r?.n ?? 0);
}

export interface AdminSiteRow {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  ownerName: string;
  ownerEmail: string;
  updatedAt: string;
}

export function listAllSites(): AdminSiteRow[] {
  const db = getDb();
  const rows = db
    .select({ site: sites, owner: users })
    .from(sites)
    .innerJoin(users, eq(sites.userId, users.id))
    .orderBy(desc(sites.updatedAt))
    .all();
  return rows.map(({ site, owner }) => ({
    id: site.id,
    name: site.name,
    slug: site.slug,
    published: Boolean(site.publishedDoc),
    ownerName: owner.name,
    ownerEmail: owner.email,
    updatedAt: site.updatedAt.toISOString(),
  }));
}

export interface PlatformStats {
  users: number;
  sites: number;
  published: number;
  submissions: number;
}

export function platformStats(): PlatformStats {
  const db = getDb();
  const u = db.select({ n: sql<number>`count(*)` }).from(users).get();
  const s = db.select({ n: sql<number>`count(*)` }).from(sites).get();
  const p = db
    .select({ n: sql<number>`count(*)` })
    .from(sites)
    .where(sql`${sites.publishedDoc} is not null`)
    .get();
  const f = db.select({ n: sql<number>`count(*)` }).from(submissions).get();
  return {
    users: Number(u?.n ?? 0),
    sites: Number(s?.n ?? 0),
    published: Number(p?.n ?? 0),
    submissions: Number(f?.n ?? 0),
  };
}
