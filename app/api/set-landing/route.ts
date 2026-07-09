import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { requireSuperadmin, forbidden } from '@/lib/api-guard';

export const runtime = 'nodejs';

// Persists the editable landing copy into data/landing.json. LOCAL/dev use only.
// The whole content object is replaced (merged shallow with what's on disk so a
// partial payload still keeps the other sections).
export async function POST(request: Request) {
  if (!(await requireSuperadmin())) return forbidden();
  let incoming: Record<string, unknown>;
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || !body.content) {
      return NextResponse.json({ error: 'content object required' }, { status: 400 });
    }
    incoming = body.content as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const file = path.join(process.cwd(), 'data', 'landing.json');
  let current: Record<string, unknown> = {};
  try {
    current = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    /* start fresh */
  }
  try {
    await writeFile(file, `${JSON.stringify({ ...current, ...incoming }, null, 2)}\n`, 'utf8');
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'write failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
