// Convert tutorial screenshot PNGs → WebP (lossy q≈82) for much smaller files.
//   node scripts/_png-to-webp.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

const OUT = process.env.OUT || path.join('public', 'media');
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const files = fs.readdirSync(OUT).filter((f) => f.startsWith('tutorial-shot-') && f.endsWith('.png'));

for (const f of files) {
  const src = path.join(OUT, f);
  const out = path.join(OUT, f.replace(/\.png$/, '.webp'));
  const r = spawnSync(ffmpeg, ['-y', '-i', src, '-c:v', 'libwebp', '-quality', '82', '-compression_level', '6', out], { stdio: 'ignore' });
  if (r.status === 0 && fs.existsSync(out)) console.log(`  ✓ ${f} (${kb(fs.statSync(src).size)}) → ${path.basename(out)} (${kb(fs.statSync(out).size)})`);
  else console.log(`  ✗ ${f}`);
}
