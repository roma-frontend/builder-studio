import { describe, it, expect, beforeEach } from 'vitest';
import { LANDING_SLUG, getLandingSite, getOrCreateLandingSite, resetLandingSite, syncsLiveOnSave } from '@/lib/landing-site';
import { parseDoc } from '@/lib/sites';
import { createUser } from '@/lib/auth';
import { getDb, sites } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { resetDb } from './helpers';

beforeEach(() => resetDb());

describe('getLandingSite', () => {
  it('returns null when no landing site exists', () => {
    expect(getLandingSite()).toBeNull();
  });
});

describe('getOrCreateLandingSite', () => {
  it('returns null when there are no users to own it', () => {
    expect(getOrCreateLandingSite()).toBeNull();
  });

  it('creates a seeded landing owned by the first user (draft only)', () => {
    const owner = createUser('owner@example.com', 'password123', 'Owner');
    const site = getOrCreateLandingSite()!;
    expect(site).not.toBeNull();
    expect(site.slug).toBe(LANDING_SLUG);
    expect(site.userId).toBe(owner.id);
    expect(site.publishedDoc).toBeNull();
    expect(site.publishedAt).toBeNull();
    const doc = parseDoc(site.draftDoc);
    expect(doc?.pages.length).toBeGreaterThan(0);
    expect((doc as any)?.brand).toBe('Builder Studio');
  });

  it('is idempotent — returns the existing landing on subsequent calls', () => {
    createUser('owner@example.com', 'password123', 'Owner');
    const first = getOrCreateLandingSite()!;
    const second = getOrCreateLandingSite()!;
    expect(second.id).toBe(first.id);
    expect(getLandingSite()?.id).toBe(first.id);
  });

  it('picks the earliest-created user as owner', () => {
    const first = createUser('first@example.com', 'password123', 'First');
    createUser('second@example.com', 'password123', 'Second');
    const site = getOrCreateLandingSite()!;
    expect(site.userId).toBe(first.id);
  });
});


describe('syncsLiveOnSave (root cause: saving must not wipe the landing effects)', () => {
  it('is FALSE for the landing even when published — saves/autosaves never replace the coded showcase', () => {
    expect(syncsLiveOnSave({ slug: LANDING_SLUG, publishedDoc: '{"pages":[]}' })).toBe(false);
  });

  it('is true for a published tenant site — its edits still auto-sync live', () => {
    expect(syncsLiveOnSave({ slug: 'my-cafe', publishedDoc: '{"pages":[]}' })).toBe(true);
  });

  it('is false for an unpublished site', () => {
    expect(syncsLiveOnSave({ slug: 'my-cafe', publishedDoc: null })).toBe(false);
  });
});

describe('resetLandingSite', () => {
  it('unpublishes and reseeds the landing to its initial state, keeping the same id', () => {
    createUser('owner@example.com', 'password123', 'Owner');
    const site = getOrCreateLandingSite()!;
    // Simulate a publish + draft edits that dropped the coded effects on /.
    getDb().update(sites).set({
      publishedDoc: site.draftDoc,
      publishedAt: new Date(),
      draftDoc: '{"pages":[{"id":"p","path":"","title":"x","blocks":[]}],"brand":"edited"}',
    }).where(eq(sites.id, site.id)).run();
    expect(getLandingSite()!.publishedDoc).not.toBeNull();

    const reset = resetLandingSite()!;
    expect(reset.id).toBe(site.id); // same row so an open builder tab stays valid
    expect(reset.publishedDoc).toBeNull();
    expect(reset.publishedAt).toBeNull();

    const persisted = getLandingSite()!;
    expect(persisted.publishedDoc).toBeNull(); // / falls back to the coded showcase
    expect(persisted.publishedAt).toBeNull();
    const doc = parseDoc(persisted.draftDoc);
    expect(doc!.pages.length).toBeGreaterThan(0);
    expect((doc as any).brand).toBe('Builder Studio'); // fresh seed, not the "edited" draft
  });
});
