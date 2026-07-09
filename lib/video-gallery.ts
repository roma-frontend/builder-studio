import 'server-only';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { MediaEntry } from '@/lib/media';

// Owner-scoped store for AI-generated VIDEO assets (data/videos.json). This is
// separate from data/media.json (which drives the PLATFORM landing at '/') so
// that a tenant admin's generated clips are private to them and never leak onto
// the platform landing or into another org's studio.
//
// Each entry is a MediaEntry plus the platform user id that generated it.

export type GalleryVideo = MediaEntry & { ownerId: string };

const FILE = path.join(process.cwd(), 'data', 'videos.json');
const MEDIA_FILE = path.join(process.cwd(), 'data', 'media.json');

async function readJson<T>(file: string): Promise<T[]> {
  try {
    const data = JSON.parse(await readFile(file, 'utf8'));
    return Array.isArray(data) ? (data as T[]) : [];
  } catch {
    return [];
  }
}

const writeJson = (file: string, rows: unknown[]) =>
  writeFile(file, JSON.stringify(rows, null, 2) + '\n', 'utf8');

/** All gallery videos owned by a user, newest first. */
export async function listVideosForUser(userId: string): Promise<GalleryVideo[]> {
  const rows = await readJson<GalleryVideo>(FILE);
  return rows.filter((r) => r.ownerId === userId);
}

/** Add a video asset to a user's private gallery. */
export async function addVideoForUser(userId: string, entry: MediaEntry): Promise<void> {
  const rows = await readJson<GalleryVideo>(FILE);
  await writeJson(FILE, [{ ...entry, ownerId: userId }, ...rows]);
}

/** Remove one owned video (returns the removed entry, or null if not owned). */
export async function removeVideoForUser(userId: string, id: string): Promise<GalleryVideo | null> {
  const rows = await readJson<GalleryVideo>(FILE);
  const entry = rows.find((r) => r.id === id && r.ownerId === userId) ?? null;
  if (!entry) return null;
  await writeJson(FILE, rows.filter((r) => !(r.id === id && r.ownerId === userId)));
  return entry;
}

/**
 * Pull the freshly-produced entry OUT of the platform media.json (matched by
 * id) so a tenant's generation does not appear as a section on the platform
 * landing. Returns the removed entry (or null if not found).
 */
export async function detachFromPlatformMedia(entryId: string): Promise<MediaEntry | null> {
  const rows = await readJson<MediaEntry>(MEDIA_FILE);
  const entry = rows.find((r) => r.id === entryId) ?? null;
  if (!entry) return null;
  await writeJson(MEDIA_FILE, rows.filter((r) => r.id !== entryId));
  return entry;
}
