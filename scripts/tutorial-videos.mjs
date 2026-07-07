// Record short builder demo clips for the tutorial (scenes 4 & 5):
//   /media/tutorial-shot-4.<locale>.mp4  — responsive device switching
//   /media/tutorial-shot-5.<locale>.mp4  — navigating panels / live preview
//
// Playwright records .webm; we transcode to .mp4 (h264) with ffmpeg-static and
// copy the single ru capture to every locale (the clips are UI b-roll; the
// per-language narration lives in the teacher video builder-tutorial.<loc>.mp4).
//
//   node scripts/tutorial-videos.mjs
// Env: BASE, SITE, SESSION_TOKEN, OUT (default public/media), LOCALES

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.env.OUT || path.join('public', 'media');
const SITE = process.env.SITE || '';
const SESSION = process.env.SESSION_TOKEN || '';
const LOCALES = (process.env.LOCALES || 'ru,en,hy').split(',').map((s) => s.trim()).filter(Boolean);
const VW = 1600, VH = 900;
const builderUrl = SITE ? `${BASE}/studio/builder?site=${encodeURIComponent(SITE)}` : `${BASE}/studio/builder`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cwk-vid-'));
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function record(actions) {
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    recordVideo: { dir: tmp, size: { width: VW, height: VH } },
  });
  const cookies = [{ name: 'NEXT_LOCALE', value: 'ru', url: BASE }];
  if (SESSION) cookies.push({ name: 'cwk_session', value: SESSION, url: BASE });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  await page.goto(builderUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  try {
    await page.waitForSelector('[data-tour="tab-pages"]', { timeout: 45_000 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-tour="tab-pages"]', { timeout: 45_000 });
  }
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(150); }
  await page.waitForTimeout(800);
  await actions(page);
  const vpath = await page.video().path();
  await ctx.close(); // finalizes the .webm
  return vpath;
}

// Keep the LAST ~10s (the scripted actions, after the variable page load) and
// transcode to a web-friendly mp4.
function toMp4(webm, outFile) {
  const r = spawnSync(ffmpeg, [
    '-y', '-sseof', '-10', '-i', webm,
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-vf', 'scale=1280:-2', outFile,
  ], { stdio: 'ignore' });
  return r.status === 0;
}

const dev = (page, label) => page.getByLabel(label, { exact: true }).first().click().catch(() => {});

// Scene 4 — responsive: cycle desktop → tablet → mobile → desktop.
const webm4 = await record(async (page) => {
  await dev(page, 'full'); await page.waitForTimeout(1400);
  await dev(page, 'tablet'); await page.waitForTimeout(1800);
  await dev(page, 'mobile'); await page.waitForTimeout(1800);
  await dev(page, 'tablet'); await page.waitForTimeout(1400);
  await dev(page, 'full'); await page.waitForTimeout(1600);
});
console.log('recorded scene-4:', webm4);

// Scene 5 — navigating the builder: palette ↔ pages ↔ design, then mobile peek.
const webm5 = await record(async (page) => {
  await page.click('[data-tour="tab-blocks"]').catch(() => {}); await page.waitForTimeout(1500);
  await page.click('[data-tour="tab-design"]').catch(() => {}); await page.waitForTimeout(1600);
  await page.click('[data-tour="tab-pages"]').catch(() => {}); await page.waitForTimeout(1600);
  await page.click('[data-tour="tab-blocks"]').catch(() => {}); await page.waitForTimeout(1200);
  await dev(page, 'mobile'); await page.waitForTimeout(1600);
});
console.log('recorded scene-5:', webm5);

await browser.close();

for (const [webm, n] of [[webm4, 4], [webm5, 5]]) {
  const ruOut = path.join(OUT, `tutorial-shot-${n}.ru.mp4`);
  if (!toMp4(webm, ruOut)) { console.log(`  ✗ ffmpeg failed for shot-${n}`); continue; }
  console.log(`  ✓ tutorial-shot-${n}.ru.mp4`);
  for (const loc of LOCALES.filter((l) => l !== 'ru')) {
    fs.copyFileSync(ruOut, path.join(OUT, `tutorial-shot-${n}.${loc}.mp4`));
    console.log(`  ✓ tutorial-shot-${n}.${loc}.mp4 (copy)`);
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nSaved to ${OUT}/`);
