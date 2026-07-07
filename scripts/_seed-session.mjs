// Seed a platform login session for the OWNER of a given site, directly in the
// SQLite DB, and print the raw bearer token (to set as the cwk_session cookie).
// For local screenshot/automation only.
//
//   node scripts/_seed-session.mjs <siteId>
//
// Env: DATABASE_FILE (default data/app.db)

import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const siteId = process.argv[2];
if (!siteId) { console.error('usage: node scripts/_seed-session.mjs <siteId>'); process.exit(1); }

const DB_FILE = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'app.db');
const db = new Database(DB_FILE);

const site = db.prepare('SELECT id, user_id, name, slug FROM sites WHERE id = ?').get(siteId);
if (!site) { console.error(`[seed-session] site ${siteId} not found in ${DB_FILE}`); process.exit(2); }

const token = randomBytes(32).toString('base64url');
const id = createHash('sha256').update(token).digest('hex');
const now = Date.now();
const expires = now + 30 * 24 * 60 * 60 * 1000; // 30 days

db.prepare(
  'INSERT INTO sessions (id, user_id, expires_at, created_at, last_active_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
).run(id, site.user_id, expires, now, now, 'screenshot-bot', 'local');

// Print ONLY the token on the last line for easy capture.
console.error(`[seed-session] site="${site.name}" (/s/${site.slug}) owner=${site.user_id}`);
console.log(token);
db.close();
