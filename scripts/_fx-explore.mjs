import { chromium } from '@playwright/test';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:3000';
const SITE = process.env.SITE || '';
const SESSION = process.env.SESSION_TOKEN || '';
const OUT = process.env.OUT || path.join('public', 'media');
const url = `${BASE}/studio/builder?site=${encodeURIComponent(SITE)}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
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

const frames = page.frames();
console.log('frames:', frames.map((f) => f.url()).filter(Boolean));

// Try selecting the hero heading inside the preview iframe.
let selected = false;
try {
  const fl = page.frameLocator('iframe');
  const h = fl.locator('h1, h2, [data-cwk-nid], [data-nid]').first();
  await h.click({ timeout: 8000 });
  selected = true;
  console.log('clicked iframe heading');
} catch (e) { console.log('iframe click failed:', e.message); }

await page.waitForTimeout(1500);
const fxVisible = await page.getByText('Готовые эффекты', { exact: false }).count().catch(() => 0);
const treeCount = await page.locator('[data-tree-nid]').count().catch(() => 0);
console.log('fx section count:', fxVisible, ' tree nodes:', treeCount, ' selected:', selected);

await page.screenshot({ path: path.join(OUT, '_fx-explore.png') });
console.log('saved _fx-explore.png');
await ctx.close();
await browser.close();
