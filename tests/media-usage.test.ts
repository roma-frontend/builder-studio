import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/lib/auth';
import { currentPeriod, videoUsedThisMonth, videoQuota, recordVideoGenerated } from '@/lib/media-usage';
import { resetDb } from './helpers';

beforeEach(() => resetDb());

describe('media-usage (monthly AI video quota)', () => {
  it('currentPeriod is YYYY-MM in UTC', () => {
    expect(currentPeriod(new Date('2026-07-09T22:00:00Z'))).toBe('2026-07');
    expect(currentPeriod(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01');
  });

  it('records and counts video generations per month', () => {
    const su = createUser('owner@example.com', 'password123', 'Owner'); // first = superadmin
    expect(videoUsedThisMonth(su.id)).toBe(0);
    recordVideoGenerated(su.id);
    recordVideoGenerated(su.id);
    expect(videoUsedThisMonth(su.id)).toBe(2);
  });

  it('superadmin has unlimited quota (limit null, always allowed)', () => {
    const su = createUser('owner@example.com', 'password123', 'Owner');
    const q = videoQuota(su);
    expect(q.limit).toBeNull();
    expect(q.remaining).toBeNull();
    expect(q.allowed).toBe(true);
  });

  it('a user without an active subscription gets the free floor (2 videos to taste the UTP)', () => {
    createUser('owner@example.com', 'password123', 'Owner'); // superadmin
    const customer = createUser('c@example.com', 'password123', 'Customer');
    const q = videoQuota(customer);
    expect(q.limit).toBe(2);
    expect(q.remaining).toBe(2);
    expect(q.allowed).toBe(true);
  });

  it('free floor blocks once the 2 free videos are used', () => {
    createUser('owner@example.com', 'password123', 'Owner'); // superadmin
    const customer = createUser('c@example.com', 'password123', 'Customer');
    recordVideoGenerated(customer.id);
    recordVideoGenerated(customer.id);
    const q = videoQuota(customer);
    expect(q.remaining).toBe(0);
    expect(q.allowed).toBe(false);
  });
});
