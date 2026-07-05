#!/usr/bin/env node
// List the media clips currently in data/media.json.
//   npm run media:list

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DATA_FILE, ROOT } from './lib.mjs';

async function main() {
  if (!existsSync(DATA_FILE)) {
    console.log('No data/media.json yet. Run `npm run media -- ...` first.');
    return;
  }
  const list = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  if (!Array.isArray(list) || list.length === 0) {
    console.log('data/media.json is empty.');
    return;
  }
  console.log(`\n${list.length} clip(s) in ${path.relative(ROOT, DATA_FILE)}:\n`);
  for (const m of list) {
    console.log(`  • [${m.section}] ${m.id} — "${m.title}"`);
    console.log(`      src: ${m.src}`);
  }
  console.log('');
}

main();
