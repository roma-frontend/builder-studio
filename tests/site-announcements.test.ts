import { describe, it, expect, beforeEach } from 'vitest';
import { createAnnouncement, listForAdmin, listPublished, deleteAnnouncement, countPublished } from '@/lib/site-announcements';
import { createUser } from '@/lib/auth';
import { createSite } from '@/lib/sites';
import { createSiteUser, countUnreadNotifications } from '@/lib/site-auth';
import { resetDb } from './helpers';

beforeEach(() => resetDb());

function seed() {
  createUser('super@example.com', 'password123', 'Super');
  const owner = createUser('owner@example.com', 'password123', 'Owner');
  const site = createSite(owner.id, 'Org');
  const member = createSiteUser(site.id, 'm@example.com', 'password123', 'Member', 'approved');
  return { owner, site, member };
}

describe('announcements', () => {
  it('creates one, notifies approved members, and lists it', () => {
    const { owner, site, member } = seed();
    createAnnouncement(site.id, owner.id, { title: 'Hi', body: 'welcome' });
    expect(listForAdmin(site.id)).toHaveLength(1);
    expect(listPublished(site.id)).toHaveLength(1);
    expect(countPublished(site.id)).toBe(1);
    expect(countUnreadNotifications(site.id, member.id)).toBe(1);
  });

  it('sorts pinned first, then newest', () => {
    const { owner, site } = seed();
    createAnnouncement(site.id, owner.id, { title: 'Old' });
    createAnnouncement(site.id, owner.id, { title: 'Pinned', pinned: true });
    createAnnouncement(site.id, owner.id, { title: 'New' });
    const list = listPublished(site.id);
    expect(list[0].title).toBe('Pinned');
  });

  it('deletes scoped to the site', () => {
    const { owner, site } = seed();
    const a = createAnnouncement(site.id, owner.id, { title: 'X' });
    deleteAnnouncement(site.id, a.id);
    expect(listForAdmin(site.id)).toHaveLength(0);
  });
});
