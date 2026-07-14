// Role-based access control (ported/adapted from caron's convex/access.ts).
//
// The superadmin can enable/disable specific dashboard capabilities for the
// non-superadmin staff role (`admin`). A capability is a staff dashboard
// section the admin may reach. Absence of a row means ENABLED, so the default
// state keeps the current behaviour; the superadmin is NEVER restricted.

import 'server-only';
import { and, eq, gt } from 'drizzle-orm';
import { getDb, newId, accessControl, accessGrants, type Role } from '@/lib/db';

/**
 * Canonical list of restrictable staff capabilities. `nav` keys map 1:1 to a
 * staff dashboard section whose label lives in dashboard-dict (t.nav[key]) and
 * whose route is /dashboard/<key-route>. Extend this list to grow the matrix.
 */
export const CAPABILITIES = [
  { key: 'users', kind: 'nav' },
  { key: 'allSites', kind: 'nav' },
  { key: 'audit', kind: 'nav' },
  // Read-only operational areas. Mutating actions remain superadmin-only in
  // their API routes even when a delegated admin can view the section.
  { key: 'organizations', kind: 'nav' },
  { key: 'tenantUsers', kind: 'permission' },
  { key: 'sessions', kind: 'permission' },
  { key: 'revenue', kind: 'nav' },
] as const;

export type CapabilityKey = (typeof CAPABILITIES)[number]['key'];

/** Roles the matrix can restrict. Superadmin is unrestricted; customer isn't staff. */
export const MANAGED_ROLES: Role[] = ['admin'];

export interface AccessMatrix {
  /** role → capability → enabled. */
  matrix: Record<string, Record<string, boolean>>;
  capabilities: { key: string; kind: string }[];
  /** Live temporary grants (role/capability/expiresAt). */
  grants: GrantInfo[];
}

const CAP_KEYS = new Set<string>(CAPABILITIES.map((c) => c.key));

/** Full matrix for the superadmin control UI (defaults everything to enabled). */
export function getAccessMatrix(): AccessMatrix {
  const rows = getDb().select().from(accessControl).all();
  const matrix: Record<string, Record<string, boolean>> = {};
  for (const role of MANAGED_ROLES) {
    matrix[role] = {};
    for (const c of CAPABILITIES) matrix[role][c.key] = true;
  }
  for (const r of rows) {
    if (matrix[r.role] && CAP_KEYS.has(r.capability)) matrix[r.role][r.capability] = r.enabled;
  }
  return { matrix, capabilities: CAPABILITIES.map((c) => ({ key: c.key, kind: c.kind })), grants: listActiveGrants() };
}

/** Toggle one capability for one managed role (superadmin action). */
export function setCapability(role: string, capability: string, enabled: boolean, updatedBy: string): void {
  if (!MANAGED_ROLES.includes(role as Role)) throw new Error('UNMANAGED_ROLE');
  if (!CAP_KEYS.has(capability)) throw new Error('UNKNOWN_CAPABILITY');
  const db = getDb();
  const where = and(eq(accessControl.role, role), eq(accessControl.capability, capability));
  const existing = db.select().from(accessControl).where(where).get();
  if (existing) {
    db.update(accessControl).set({ enabled, updatedBy, updatedAt: new Date() }).where(where).run();
  } else {
    db.insert(accessControl).values({ role, capability, enabled, updatedBy, updatedAt: new Date() }).run();
  }
}

/** Capability keys DISABLED for a role. Superadmin → none (unrestricted).
 *  Live temporary grants re-enable an otherwise-disabled capability. */
export function disabledCapabilitiesFor(role: string): string[] {
  if (role === 'superadmin') return [];
  if (!MANAGED_ROLES.includes(role as Role)) return [];
  const granted = activeGrantCapabilities(role);
  return getDb()
    .select()
    .from(accessControl)
    .where(eq(accessControl.role, role))
    .all()
    .filter((r) => !r.enabled && CAP_KEYS.has(r.capability) && !granted.has(r.capability))
    .map((r) => r.capability);
}

/** Whether a role may use a capability (superadmin always may). */
export function isCapabilityEnabled(role: string, capability: string): boolean {
  return !disabledCapabilitiesFor(role).includes(capability);
}

// ─────────────────────────── Temporary grants ───────────────────────────

export interface GrantInfo { role: string; capability: string; expiresAt: string }

/** Capability keys currently granted (live, unexpired) to a role. */
export function activeGrantCapabilities(role: string): Set<string> {
  const now = new Date();
  const rows = getDb()
    .select()
    .from(accessGrants)
    .where(and(eq(accessGrants.role, role), gt(accessGrants.expiresAt, now)))
    .all();
  return new Set(rows.filter((r) => CAP_KEYS.has(r.capability)).map((r) => r.capability));
}

/** All live grants across managed roles, for the superadmin UI. */
export function listActiveGrants(): GrantInfo[] {
  const now = new Date();
  return getDb()
    .select()
    .from(accessGrants)
    .where(gt(accessGrants.expiresAt, now))
    .all()
    .filter((r) => CAP_KEYS.has(r.capability))
    .map((r) => ({ role: r.role, capability: r.capability, expiresAt: r.expiresAt.toISOString() }));
}

/** Temporarily grant a capability to a managed role for `minutes` (1–1440). */
export function grantCapability(role: string, capability: string, minutes: number, grantedBy: string): GrantInfo {
  if (!MANAGED_ROLES.includes(role as Role)) throw new Error('UNMANAGED_ROLE');
  if (!CAP_KEYS.has(capability)) throw new Error('UNKNOWN_CAPABILITY');
  const mins = Math.max(1, Math.min(1440, Math.round(minutes)));
  const expiresAt = new Date(Date.now() + mins * 60 * 1000);
  const db = getDb();
  // Replace any prior grant for the same (role, capability).
  db.delete(accessGrants).where(and(eq(accessGrants.role, role), eq(accessGrants.capability, capability))).run();
  db.insert(accessGrants).values({ id: newId('grant'), role, capability, expiresAt, grantedBy, createdAt: new Date() }).run();
  return { role, capability, expiresAt: expiresAt.toISOString() };
}

/** Revoke a live grant (back to the matrix default). */
export function revokeGrant(role: string, capability: string): void {
  getDb().delete(accessGrants).where(and(eq(accessGrants.role, role), eq(accessGrants.capability, capability))).run();
}
