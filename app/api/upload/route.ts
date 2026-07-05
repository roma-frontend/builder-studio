import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

// Accepts a single image upload (multipart form field "file") and stores it in
// public/uploads, returning a public URL usable as an <image> src. LOCAL/dev.
const MAX = 8 * 1024 * 1024; // 8 MB
const OK = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

export async function POST(request: Request) {
  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get('file');
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: 'Invalid form body' }, { status: 400 });
  }
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!OK.includes(file.type)) return NextResponse.json({ error: 'Неподдерживаемый формат' }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: 'Файл больше 8 МБ' }, { status: 400 });

  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const name = `up-${Date.now().toString(36)}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'write failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}
