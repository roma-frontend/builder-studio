// Optimize tutorial media in place: PNG screenshots (captured @2x → 3200×1800)
// are downscaled to 1600px wide with max PNG compression; MP4 clips are
// re-encoded at a higher CRF + 1000px width. Big size drop, still crisp in the
// tutorial modal. Uses the bundled ffmpeg (ffmpeg-static).
//
//   node scripts/_optimize-media.mjs
// Env: OUT (default public/media), GLOB (default tutorial-shot-)

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

const OUT = process.env.OUT || path.join('public', 'media');
const PREFIX = process.env.GLOB || 'tutorial-shot-';
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

const files = fs.readdirSync(OUT).filter((f) => f.startsWith(PREFIX) && /\.(png|mp4)$/i.test(f));
let before = 0, after = 0;

for (const f of files) {
  const src = path.join(OUT, f);
  const ext = f.split('.').pop().toLowerCase();
  const tmp = path.join(OUT, `.opt-${f}`);
  const oldSize = fs.statSync(src).size;
  before += oldSize;

  const args = ext === 'png'
    ? ['-y', '-i', src, '-vf', 'scale=1600:-1:flags=lanczos', '-compression_level', '100', tmp]
    : ['-y', '-i', src, '-an', '-c:v', 'libx264', '-crf', '30', '-preset', 'veryslow',
       '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-vf', 'scale=1000:-2', tmp];

  const r = spawnSync(ffmpeg, args, { stdio: 'ignore' });
  if (r.status !== 0 || !fs.existsSync(tmp)) { console.log(`  ✗ ${f} (ffmpeg failed)`); after += oldSize; continue; }

  const newSize = fs.statSync(tmp).size;
  // Only keep the optimized file if it's actually smaller.
  if (newSize < oldSize) { fs.renameSync(tmp, src); after += newSize; console.log(`  ✓ ${f}: ${kb(oldSize)} → ${kb(newSize)}`); }
  else { fs.rmSync(tmp, { force: true }); after += oldSize; console.log(`  = ${f}: kept ${kb(oldSize)} (opt was larger)`); }
}

console.log(`\nTotal: ${kb(before)} → ${kb(after)}  (${(100 - (after / before) * 100).toFixed(0)}% smaller)`);
