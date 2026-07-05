import { NextResponse } from 'next/server';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { THEMES } from '@/lib/themes';

export const runtime = 'nodejs';

// Persists the site-wide theme choice into data/site.json. 'auto' means the
// page derives the theme from its content. LOCAL/dev use only.
const VALID = new Set(['auto', ...THEMES.map((t) => t.id)]);

export async function POST(request: Request) {
  let theme = 'auto';
  try {
    const body = await request.json();
    theme = String(body?.theme ?? 'auto');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!VALID.has(theme)) {
    return NextResponse.json({ error: `Unknown theme "${theme}"` }, { status: 400 });
  }
  try {
    const file = path.join(process.cwd(), 'data', 'site.json');
    await writeFile(file, `${JSON.stringify({ theme }, null, 2)}\n`, 'utf8');
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'write failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, theme });
}
