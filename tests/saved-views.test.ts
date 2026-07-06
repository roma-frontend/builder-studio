import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from './helpers';
import { createUser } from '@/lib/auth';
import { listSavedViews, createSavedView, deleteSavedView } from '@/lib/saved-views';

beforeEach(() => resetDb());

describe('saved views', () => {
  it('creates, lists and round-trips the query blob', () => {
    const u = createUser('a@example.com', 'password123', 'A');
    const v = createSavedView(u.id, 'users', 'Blocked admins', { search: '', role: 'admin', status: 'blocked' });
    expect(v.name).toBe('Blocked admins');
    const list = listSavedViews(u.id, 'users');
    expect(list).toHaveLength(1);
    expect(list[0].query).toEqual({ search: '', role: 'admin', status: 'blocked' });
  });

  it('scopes views per user and per route', () => {
    const a = createUser('a2@example.com', 'password123', 'A');
    const b = createUser('b2@example.com', 'password123', 'B');
    createSavedView(a.id, 'users', 'mine', {});
    createSavedView(a.id, 'allSites', 'sites', {});
    createSavedView(b.id, 'users', 'theirs', {});
    expect(listSavedViews(a.id, 'users')).toHaveLength(1);
    expect(listSavedViews(a.id, 'allSites')).toHaveLength(1);
    expect(listSavedViews(b.id, 'users')).toHaveLength(1);
  });

  it('only deletes the caller\u2019s own view', () => {
    const a = createUser('a3@example.com', 'password123', 'A');
    const b = createUser('b3@example.com', 'password123', 'B');
    const v = createSavedView(a.id, 'users', 'x', {});
    expect(deleteSavedView(b.id, v.id)).toBe(false); // not b's
    expect(listSavedViews(a.id, 'users')).toHaveLength(1);
    expect(deleteSavedView(a.id, v.id)).toBe(true);
    expect(listSavedViews(a.id, 'users')).toHaveLength(0);
  });

  it('caps name length and tolerates bad query', () => {
    const u = createUser('c@example.com', 'password123', 'C');
    const v = createSavedView(u.id, 'users', 'x'.repeat(200), undefined);
    expect(v.name.length).toBeLessThanOrEqual(60);
    expect(v.query).toEqual({});
  });
});
