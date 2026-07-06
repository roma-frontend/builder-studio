import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from './helpers';
import { eq } from 'drizzle-orm';
import { getDb, sites } from '@/lib/db';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { trashSite, listTrashed, restoreSite, purgeTrashed, countTrashed } from '@/lib/trash';
import { deleteUser as adminDeleteUser } from '@/lib/admin';

beforeEach(() => resetDb());

function sitesCount() {
  return getDb().select({ id: sites.id }).from(sites).all().length;
}

describe('trash (soft-delete sites)', () => {
  it('trashes a site: removed from sites, snapshot in trash', () => {
    const owner = createUser('owner@example.com', 'password123', 'Owner');
    const site = createSite(owner.id, 'My Site');
    expect(sitesCount()).toBe(1);

    expect(trashSite(site.id, owner.id)).toBe(true);
    expect(sitesCount()).toBe(0);
    expect(countTrashed()).toBe(1);

    const rows = listTrashed();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: site.id, name: 'My Site', ownerEmail: 'owner@example.com', ownerExists: true });
  });

  it('returns false when trashing a missing site', () => {
    expect(trashSite('nope', 'x')).toBe(false);
  });

  it('restores a trashed site back into sites', () => {
    const owner = createUser('a@example.com', 'password123', 'A');
    const site = createSite(owner.id, 'Restore Me');
    trashSite(site.id, owner.id);

    expect(restoreSite(site.id)).toBe('ok');
    expect(sitesCount()).toBe(1);
    expect(countTrashed()).toBe(0);
    const back = getDb().select().from(sites).where(eq(sites.id, site.id)).get();
    expect(back?.name).toBe('Restore Me');
  });

  it('auto-suffixes the slug when it was taken since deletion', () => {
    const owner = createUser('b@example.com', 'password123', 'B');
    const site = createSite(owner.id, 'Coffee');
    const originalSlug = site.slug;
    trashSite(site.id, owner.id);
    // Recreate a site that grabs the freed slug.
    const other = createSite(owner.id, 'Coffee');
    expect(other.slug).toBe(originalSlug);

    expect(restoreSite(site.id)).toBe('ok');
    const restored = getDb().select().from(sites).where(eq(sites.id, site.id)).get();
    expect(restored?.slug).not.toBe(originalSlug);
    expect(restored?.slug.startsWith(originalSlug)).toBe(true);
  });

  it('refuses to restore when the owner is gone', () => {
    const owner = createUser('c@example.com', 'password123', 'C');
    const site = createSite(owner.id, 'Orphan');
    trashSite(site.id, owner.id);
    adminDeleteUser(owner.id);
    expect(restoreSite(site.id)).toBe('owner_gone');
  });

  it('purges a trashed site permanently', () => {
    const owner = createUser('d@example.com', 'password123', 'D');
    const site = createSite(owner.id, 'Gone');
    trashSite(site.id, owner.id);
    purgeTrashed(site.id);
    expect(countTrashed()).toBe(0);
    expect(restoreSite(site.id)).toBe('not_found');
  });
});
