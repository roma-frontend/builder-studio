import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from './helpers';
import { createUser } from '@/lib/auth';
import { recordActivity, recentTrailForUser, recentTrail } from '@/lib/activity';

beforeEach(() => resetDb());

describe('activity trail', () => {
  it('records and lists a user\u2019s recent route visits', () => {
    const u = createUser('staff@example.com', 'password123', 'Staff'); // first user → superadmin
    recordActivity(u.id, '/dashboard');
    recordActivity(u.id, '/dashboard/users');
    recordActivity(u.id, '/dashboard/all-sites');

    const trail = recentTrailForUser(u.id);
    expect(trail).toHaveLength(3);
    // (ordering within the same millisecond isn't guaranteed, so assert membership)
    expect(trail.map((r) => r.path).sort()).toEqual(['/dashboard', '/dashboard/all-sites', '/dashboard/users']);
  });

  it('truncates overly long paths and never throws on unknown users', () => {
    const u = createUser('a@example.com', 'password123', 'A');
    recordActivity(u.id, '/x'.repeat(500));
    expect(recentTrailForUser(u.id)[0].path.length).toBeLessThanOrEqual(200);
    // Unknown user id: FK insert fails but recordActivity swallows the error.
    expect(() => recordActivity('nope', '/dashboard')).not.toThrow();
  });

  it('returns a platform-wide feed joined with the user', () => {
    const u = createUser('b@example.com', 'password123', 'Bee');
    recordActivity(u.id, '/dashboard/control');
    const feed = recentTrail();
    expect(feed[0]).toMatchObject({ userEmail: 'b@example.com', userName: 'Bee', path: '/dashboard/control' });
  });
});
