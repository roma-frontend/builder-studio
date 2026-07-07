// Record tutorial scenes 4 & 5 to MATCH the narration:
//   shot-4 — one-click effects (float / neon glow / glass) applied to a block
//   shot-5 — CSS animations + custom CSS in the properties panel
// Recorded as SUPERADMIN on their landing site (effects/CSS panel is unlocked
// for superadmins), then transcoded to mp4 and copied to every locale.
//
//   node scripts/tutorial-fx.mjs
// Env: BASE, SITE (superadmin-owned), SESSION_TOKEN, OUT, LOCALES

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
const url = `${BASE}/studio/builder?site=${encodeURIComponent(SITE)}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cwk-fx-'));
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function open(recordDir) {
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    recordVideo: recordDir ? { dir: recordDir, size: { width: VW, height: VH } } : undefined,
  });
  await ctx.addCookies([
    { name: 'NEXT_LOCALE', value: 'ru', url: BASE },
    { name: 'cwk_session', value: SESSION, url: BASE },
  ]);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  try { await page.waitForSelector('[data-tour="tab-pages"]', { timeout: 45_000 }); }
  catch { await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('[data-tour="tab-pages"]', { timeout: 45_000 }); }
  await page.waitForTimeout(2000);
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(150); }
  // Select a block in the live preview so the properties + effects panel appears.
  try { await page.frameLocator('iframe').locator('h1, h2').first().click({ timeout: 8000 }); } catch {}
  await page.waitForTimeout(1200);
  return { ctx, page };
}

function toMp4(webm, outFile) {
  const r = spawnSync(ffmpeg, [
    '-y', '-sseof', '-10', '-i', webm,
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-vf', 'scale=1280:-2', outFile,
  ], { stdio: 'ignore' });
  return r.status === 0;
}

// Scene 4 — one-click effects: reveal the presets and apply a few (preview animates).
const rec4 = fs.mkdtempSync(path.join(tmp, 's4-'));
{
  const { ctx, page } = await open(rec4);
  await page.getByText('Готовые эффекты', { exact: false }).scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(800);
  const fx = page.locator('button.fxgrp');
  const n = await fx.count();
  // Spread clicks across the groups (entrance / loop / hover / style).
  const picks = [n - 1, n - 2, n - 4, n - 6, Math.floor(n / 2)].filter((i) => i >= 0);
  for (const i of picks) { await fx.nth(i).click().catch(() => {}); await page.waitForTimeout(1500); }
  const v = await page.video().path();
  await ctx.close();
  console.log('recorded shot-4:', v, `(fx buttons: ${n})`);
  var webm4 = v;
}

// Scene 5 — CSS animations + custom CSS: type into the custom-CSS field, apply an animation.
const rec5 = fs.mkdtempSync(path.join(tmp, 's5-'));
{
  const { ctx, page } = await open(rec5);
  // Custom CSS textarea (last textarea in the properties panel).
  const ta = page.locator('textarea').last();
  try {
    await ta.scrollIntoViewIfNeeded();
    await ta.click();
    for (const ch of 'transform: rotate(-3deg);\nletter-spacing: 2px;') { await ta.type(ch, { delay: 45 }); }
    await page.waitForTimeout(1200);
  } catch (e) { console.log('css type failed:', e.message); }
  // Then apply a loop/animation preset for visible motion.
  await page.getByText('Готовые эффекты', { exact: false }).scrollIntoViewIfNeeded().catch(() => {});
  const fx = page.locator('button.fxgrp');
  const n = await fx.count();
  for (const i of [1, 3, 2].filter((x) => x < n)) { await fx.nth(i).click().catch(() => {}); await page.waitForTimeout(1400); }
  const v = await page.video().path();
  await ctx.close();
  console.log('recorded shot-5:', v);
  var webm5 = v;
}

await browser.close();

for (const [webm, nn] of [[webm4, 4], [webm5, 5]]) {
  const ruOut = path.join(OUT, `tutorial-shot-${nn}.ru.mp4`);
  if (!toMp4(webm, ruOut)) { console.log(`  ✗ ffmpeg failed for shot-${nn}`); continue; }
  console.log(`  ✓ tutorial-shot-${nn}.ru.mp4`);
  for (const loc of LOCALES.filter((l) => l !== 'ru')) {
    fs.copyFileSync(ruOut, path.join(OUT, `tutorial-shot-${nn}.${loc}.mp4`));
    console.log(`  ✓ tutorial-shot-${nn}.${loc}.mp4 (copy)`);
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nSaved to ${OUT}/`);
