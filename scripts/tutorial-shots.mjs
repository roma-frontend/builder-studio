// Capture REAL builder screenshots for the in-app tutorial (TutorialModal
// scenes: /media/tutorial-shot-{1,2,3}.<locale>.png + tutorial-shot-6.png).
//
// The /studio/builder page is a client editor seeded from data/builder.json, so
// it renders a full demo canvas WITHOUT login — we only set the NEXT_LOCALE
// cookie to get the localized chrome. Requires the app running:
//
//   npm run build && npm run start      # (or: npm run dev) in another terminal
//   node scripts/tutorial-shots.mjs
//
// Env: BASE (default http://localhost:3000), LOCALES (default ru,en,hy),
//      OUT (default public/media), PRESET (shot-6 finished page, default studio)

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.env.OUT || path.join('public', 'media');
const LOCALES = (process.env.LOCALES || 'ru,en,hy').split(',').map((s) => s.trim()).filter(Boolean);
const PRESET = process.env.PRESET || 'studio';
const SITE = process.env.SITE || '';           // builder ?site=<id> (needs auth)
const SESSION = process.env.SESSION_TOKEN || ''; // cwk_session cookie value
const DB_FILE = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'app.db');
const VW = 1600, VH = 900; // ~16:9, matches the modal's aspect-video frame

const builderUrl = SITE ? `${BASE}/studio/builder?site=${encodeURIComponent(SITE)}` : `${BASE}/studio/builder`;

// Resolve the site owner so we can pin their UI-locale pref per capture — the
// account's saved locale (PrefsSync) otherwise overrides the NEXT_LOCALE cookie.
let ownerId = '';
if (SITE) {
  const db = new Database(DB_FILE);
  ownerId = db.prepare('SELECT user_id FROM sites WHERE id=?').get(SITE)?.user_id || '';
  db.close();
}
function readPrefs(userId) {
  const db = new Database(DB_FILE);
  const row = db.prepare('SELECT prefs FROM user_prefs WHERE user_id=?').get(userId);
  db.close();
  try { return JSON.parse(row?.prefs || '{}'); } catch { return {}; }
}
function writePrefs(userId, prefs) {
  const db = new Database(DB_FILE);
  const now = Date.now();
  const has = db.prepare('SELECT 1 FROM user_prefs WHERE user_id=?').get(userId);
  if (has) db.prepare('UPDATE user_prefs SET prefs=?, updated_at=? WHERE user_id=?').run(JSON.stringify(prefs), now, userId);
  else db.prepare('INSERT INTO user_prefs (user_id, prefs, updated_at) VALUES (?,?,?)').run(userId, JSON.stringify(prefs), now);
  db.close();
}
function setLocalePref(userId, locale) { const p = readPrefs(userId); p.locale = locale; writePrefs(userId, p); }
const origLocale = ownerId ? (readPrefs(ownerId).locale ?? null) : null;

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

// Close any auto-started onboarding tour / modal so it doesn't cover the UI.
async function dismissOverlays(page) {
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(200); }
  // Mark the studio tour as "seen" for good measure (no-op if unauthenticated).
  await page.evaluate(() => { try { localStorage.setItem('cwk:tour:studio-builder', '1'); } catch {} }).catch(() => {});
}

async function ctxFor(locale) {
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2 });
  const cookies = [{ name: 'NEXT_LOCALE', value: locale, url: BASE }];
  if (SESSION) cookies.push({ name: 'cwk_session', value: SESSION, url: BASE });
  await ctx.addCookies(cookies);
  return ctx;
}

// Wait until the /builder-preview iframe has fully loaded (document + images),
// so the live preview isn't captured half-rendered.
async function waitForPreview(page) {
  try {
    const f = page.frames().find((fr) => fr.url().includes('/builder-preview'));
    if (f) {
      await f.waitForLoadState('load', { timeout: 20_000 }).catch(() => {});
      await f.evaluate(async () => {
        const imgs = Array.from(document.images);
        await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
      }).catch(() => {});
    }
  } catch { /* best-effort */ }
  await page.waitForTimeout(2500);
}

const shot = async (page, name) => {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file });
  console.log(`  ✓ ${name}`);
};

for (const locale of LOCALES) {
  console.log(`» ${locale}`);
  if (ownerId) setLocalePref(ownerId, locale); // match the cookie so PrefsSync won't revert it
  const ctx = await ctxFor(locale);
  const page = await ctx.newPage();
  try {
    await page.goto(builderUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    // Wait until the builder chrome is actually mounted (cold-start can be slow);
    // reload once if the route errored or is still on the Suspense fallback.
    try {
      await page.waitForSelector('[data-tour="tab-pages"]', { timeout: 45_000 });
    } catch {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-tour="tab-pages"]', { timeout: 45_000 });
    }
    await page.waitForTimeout(1200);
    await dismissOverlays(page);
    await page.waitForTimeout(1200); // fonts + entrance animations settle

    // shot-1 — overview: Pages tab (page structure) + live preview
    await page.getByLabel('full', { exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(400);
    await page.click('[data-tour="tab-pages"]').catch(() => {});
    await waitForPreview(page);
    await shot(page, `tutorial-shot-1.${locale}.png`);

    // shot-2 — block palette open (Blocks tab)
    await page.click('[data-tour="tab-blocks"]').catch(() => {});
    await page.waitForTimeout(700);
    await shot(page, `tutorial-shot-2.${locale}.png`);

    // shot-3 — responsive preview (tablet device width)
    await page.getByLabel('tablet', { exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(900);
    await shot(page, `tutorial-shot-3.${locale}.png`);
  } catch (e) {
    console.log(`  ✗ ${locale}: ${e.message}`);
  } finally {
    await ctx.close();
  }
}

// shot-6 — the finished, published site (light theme, matches the other scenes).
// Defaults to the published BBH page; override with SHOT6 (e.g. /presets/studio).
try {
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const shot6 = process.env.SHOT6 || '/s/bbh';
  await page.goto(`${BASE}${shot6}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('load', { timeout: 20_000 }).catch(() => {});
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  }).catch(() => {});
  await page.waitForTimeout(3000);
  await shot(page, 'tutorial-shot-6.png');
  await ctx.close();
} catch (e) {
  console.log(`  ✗ shot-6: ${e.message}`);
}

await browser.close();

// Restore the owner's original locale pref so we don't leave the account changed.
if (ownerId) {
  const p = readPrefs(ownerId);
  if (origLocale === null) delete p.locale; else p.locale = origLocale;
  writePrefs(ownerId, p);
}

console.log(`\nSaved to ${OUT}/`);
