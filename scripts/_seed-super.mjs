// Seed a session for the superadmin (first user) and report a site they own —
// used to record the effects/CSS tutorial clips on an unlocked account.
// Prints:  <token>|<siteId>|<slug>   (token line last for easy capture)
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const DB = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'app.db');
const db = new Database(DB);
const su = db.prepare("SELECT id, email FROM users WHERE role='superadmin' ORDER BY created_at ASC LIMIT 1").get();
if (!su) { console.error('NO_SUPERADMIN'); process.exit(1); }
// Prefer the landing site; else any site the superadmin owns.
const site = db.prepare("SELECT id, slug FROM sites WHERE user_id=? ORDER BY (slug='__landing__') DESC LIMIT 1").get(su.id);
const token = randomBytes(32).toString('base64url');
const id = createHash('sha256').update(token).digest('hex');
const now = Date.now();
db.prepare('INSERT INTO sessions (id,user_id,expires_at,created_at,last_active_at,user_agent,ip) VALUES (?,?,?,?,?,?,?)')
  .run(id, su.id, now + 2592000000, now, now, 'fx-bot', 'local');
console.error(`superadmin=${su.email} site=${site ? site.slug : 'NONE'}`);
console.log(`${token}|${site ? site.id : ''}|${site ? site.slug : ''}`);
db.close();
