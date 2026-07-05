// Admin/superadmin data layer: cross-tenant queries used by the dashboard's
// staff sections. Authorization is enforced by the API routes / pages that call
// these — the functions themselves are pure reads/writes.

import 'server-only';
import path from 'node:path';
import { statSync } from 'node:fs';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb, users, sites, submissions, sessions, type User, type Role } from '@/lib/db';

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

// ─────────────────────────── Control Center ───────────────────────────

export interface SessionRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
  active: boolean;
}

/** All sessions across the platform, newest first, with owner + validity. */
export function listSessions(limit = 200): SessionRow[] {
  const now = Date.now();
  const rows = getDb()
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .orderBy(desc(sessions.createdAt))
    .limit(limit)
    .all();
  return rows.map(({ session, user }) => ({
    id: session.id,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role as Role,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    active: session.expiresAt.getTime() > now,
  }));
}

export function countActiveSessions(): number {
  const r = getDb()
    .select({ n: sql<number>`count(*)` })
    .from(sessions)
    .where(sql`${sessions.expiresAt} > ${Date.now()}`)
    .get();
  return Number(r?.n ?? 0);
}

export function revokeSession(id: string): void {
  getDb().delete(sessions).where(eq(sessions.id, id)).run();
}

export function revokeUserSessions(userId: string): number {
  const res = getDb().delete(sessions).where(eq(sessions.userId, userId)).run();
  return res.changes;
}

/** Delete a user and (via FK cascade) their sessions, sites and submissions. */
export function deleteUser(id: string): void {
  getDb().delete(users).where(eq(users.id, id)).run();
}

export function deleteSiteById(id: string): void {
  getDb().delete(sites).where(eq(sites.id, id)).run();
}

export function unpublishSiteById(id: string): void {
  getDb()
    .update(sites)
    .set({ publishedDoc: null, publishedAt: null, updatedAt: new Date() })
    .where(eq(sites.id, id))
    .run();
}

export function countSuperadmins(): number {
  const r = getDb()
    .select({ n: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, 'superadmin'))
    .get();
  return Number(r?.n ?? 0);
}

export interface SystemInfo {
  dbSizeKb: number;
  activeSessions: number;
  appHost: string;
  node: string;
  integrations: { muapi: boolean; llm: boolean; analytics: boolean; serverIp: boolean };
}

export function systemInfo(): SystemInfo {
  const dbFile = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'app.db');
  let dbSizeKb = 0;
  try { dbSizeKb = Math.round(statSync(dbFile).size / 1024); } catch { /* file may not exist yet */ }
  return {
    dbSizeKb,
    activeSessions: countActiveSessions(),
    appHost: (process.env.NEXT_PUBLIC_APP_HOST || 'localhost:3000').toLowerCase(),
    node: process.version,
    integrations: {
      muapi: Boolean(process.env.MUAPI_KEY),
      llm: Boolean(process.env.THEME_LLM_KEY),
      analytics: Boolean(process.env.NEXT_PUBLIC_CF_BEACON_TOKEN),
      serverIp: Boolean(process.env.SERVER_IP),
    },
  };
}

export type ActivityKind = 'user' | 'site' | 'publish' | 'submission';
export interface ActivityEvent {
  kind: ActivityKind;
  at: string;
  title: string;
  subtitle: string;
}

/** Merged, newest-first feed of recent platform events. */
export function recentActivity(limit = 20): ActivityEvent[] {
  const db = getDb();
  const events: ActivityEvent[] = [];

  for (const u of db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).all()) {
    events.push({ kind: 'user', at: u.createdAt.toISOString(), title: 'Новый пользователь', subtitle: `${u.name || 'Без имени'} · ${u.email}` });
  }
  for (const s of db.select().from(sites).orderBy(desc(sites.createdAt)).limit(limit).all()) {
    events.push({ kind: 'site', at: s.createdAt.toISOString(), title: 'Создан сайт', subtitle: `${s.name} · /s/${s.slug}` });
    if (s.publishedAt) {
      events.push({ kind: 'publish', at: s.publishedAt.toISOString(), title: 'Публикация сайта', subtitle: `${s.name} · /s/${s.slug}` });
    }
  }
  const subs = db
    .select({ sub: submissions, site: sites })
    .from(submissions)
    .leftJoin(sites, eq(submissions.siteId, sites.id))
    .orderBy(desc(submissions.createdAt))
    .limit(limit)
    .all();
  for (const { sub, site } of subs) {
    events.push({ kind: 'submission', at: sub.createdAt.toISOString(), title: 'Новая заявка', subtitle: site ? `${site.name} · форма «${sub.formId}»` : `форма «${sub.formId}»` });
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
