import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import seed from '@/data/builder.json';
import type { BuilderDoc } from './types';

const FILE = path.join(process.cwd(), 'data', 'builder.json');

export async function loadDoc(): Promise<BuilderDoc> {
  try {
    const parsed = JSON.parse(await readFile(FILE, 'utf8'));
    if (parsed && Array.isArray(parsed.pages)) return parsed as BuilderDoc;
  } catch {
    /* fall through to seed */
  }
  return seed as unknown as BuilderDoc;
}

export async function saveDoc(doc: BuilderDoc): Promise<void> {
  await writeFile(FILE, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
}

export function findPage(doc: BuilderDoc, slug: string[]): BuilderPageLookup {
  const target = (slug ?? []).join('/');
  const page = doc.pages.find((p) => p.path === target);
  return { page: page ?? null, target };
}

interface BuilderPageLookup {
  page: BuilderDoc['pages'][number] | null;
  target: string;
}
