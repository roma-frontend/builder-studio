// Capture real browser screenshots of every preset landing page for use as
// high-quality preview images. Requires the dev/prod server running.
//
//   npm run dev            # in another terminal (or set BASE to a live URL)
//   node scripts/preset-shots.mjs
//
// Env:
//   BASE   base URL (default http://localhost:3000)
//   MODE   "viewport" (above-the-fold hero shot, default) | "full" (whole page)
//   OUT    output dir (default preset-shots)

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SLUGS = ['launch', 'roast', 'arena', 'studio', 'maison', 'pulse'];
const BASE = process.env.BASE || 'http://localhost:3000';
const SCHEME = process.env.SCHEME === 'light' ? 'light' : 'dark';
const OUT = process.env.OUT || (SCHEME === 'light' ? 'preset-covers-light' : 'preset-covers');

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
// 1600×1000 cover canvas, retina-crisp.
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
// next-themes reads localStorage in every frame (incl. the embedded landing
// iframe); seed it so the whole cover renders in the requested scheme.
await page.addInitScript((scheme) => {
  try { localStorage.setItem('theme', scheme); } catch { /* ignore */ }
}, SCHEME);

for (const slug of SLUGS) {
  const url = `${BASE}/preset-cover/${slug}?scheme=${SCHEME}`;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
    // Looping bg videos / HMR sockets mean the page never goes network-idle, so
    // we wait a fixed beat for fonts, theme FX and entrance animations instead.
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(OUT, `${slug}.png`) });
    console.log(`✓ ${slug}`);
  } catch (e) {
    console.log(`✗ ${slug}: ${e.message}`);
  }
}

await browser.close();
console.log(`\nSaved to ${OUT}/ (scheme=${SCHEME})`);
