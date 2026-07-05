import { NextResponse } from 'next/server';
import { loadDoc, saveDoc } from '@/lib/builder/store';
import type { BuilderDoc } from '@/lib/builder/types';

export const runtime = 'nodejs';

export async function GET() {
  const doc = await loadDoc();
  return NextResponse.json(doc);
}

export async function POST(request: Request) {
  let doc: BuilderDoc;
  try {
    doc = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!doc || !Array.isArray(doc.pages)) {
    return NextResponse.json({ error: 'Document must have a pages array' }, { status: 400 });
  }
  // Guard: unique, non-conflicting page paths.
  const paths = new Set<string>();
  for (const p of doc.pages) {
    if (typeof p.path !== 'string' || typeof p.title !== 'string' || !Array.isArray(p.blocks)) {
      return NextResponse.json({ error: 'Malformed page in document' }, { status: 400 });
    }
    if (paths.has(p.path)) {
      return NextResponse.json({ error: `Дублирующийся путь страницы: "${p.path}"` }, { status: 400 });
    }
    paths.add(p.path);
  }
  try {
    await saveDoc(doc);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'write failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, pages: doc.pages.length });
}
