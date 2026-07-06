// Reset the platform landing page to its default.
//
// The homepage (/) is backed by a reserved builder site with slug "__landing__"
// (see lib/landing-site.ts). Editing the landing in the visual builder mutates
// that DB row. This script removes it, so the next request re-seeds a pristine
// default via getOrCreateLandingSite() → seedLandingDoc() — and / falls back to
// the coded marketing landing (app/page.tsx) until it is re-seeded/published.
//
// Usage:
//   npm run reset:landing          # delete the __landing__ site (reset to default)
//   npm run reset:landing -- --dry # show what would happen, change nothing
//
// Safe & idempotent: deleting a non-existent landing is a no-op. Only the
// reserved landing row is touched — tenant sites are never affected.

import path from 'node:path';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const LANDING_SLUG = '__landing__';
const dry = process.argv.includes('--dry') || process.argv.includes('--dry-run');
const DB_FILE = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'app.db');

if (!existsSync(DB_FILE)) {
  console.log(`[reset:landing] No database at ${DB_FILE} — nothing to reset (a fresh DB seeds the default landing on first visit).`);
  process.exit(0);
}

let Database;
try {
  Database = require('better-sqlite3');
} catch {
  console.error('[reset:landing] better-sqlite3 is not installed. Run `npm install` first.');
  process.exit(1);
}

const db = new Database(DB_FILE);
db.pragma('foreign_keys = ON'); // cascade the landing's dependent rows cleanly

try {
  const row = db.prepare('SELECT id, name FROM sites WHERE slug = ?').get(LANDING_SLUG);

  if (!row) {
    console.log(`[reset:landing] Landing site "${LANDING_SLUG}" not found — already at default. Nothing to do.`);
    process.exit(0);
  }

  if (dry) {
    console.log(`[reset:landing] DRY RUN — would delete landing site "${row.name}" (id=${row.id}, slug=${LANDING_SLUG}).`);
    console.log('[reset:landing] After a real run, / reverts to the default landing (re-seeded on next visit).');
    process.exit(0);
  }

  const info = db.prepare('DELETE FROM sites WHERE slug = ?').run(LANDING_SLUG);
  console.log(`[reset:landing] Deleted ${info.changes} landing row ("${row.name}"). The default landing will be re-seeded on the next visit to / or the Studio landing tab.`);
} finally {
  db.close();
}
