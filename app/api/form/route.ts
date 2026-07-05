import { NextResponse } from 'next/server';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

// Receives submissions from builder <form> elements. For this kit it appends
// each submission to data/submissions.log as JSONL. In production you'd swap
// this for an email/CRM/DB integration.
export async function POST(request: Request) {
  let payload: Record<string, unknown> = {};
  const ct = request.headers.get('content-type') ?? '';
  try {
    if (ct.includes('application/json')) {
      payload = await request.json();
    } else {
      const form = await request.formData();
      for (const [k, v] of form.entries()) payload[k] = typeof v === 'string' ? v : '(file)';
    }
  } catch {
    return NextResponse.json({ error: 'Invalid form body' }, { status: 400 });
  }

  const record = { at: new Date().toISOString(), ...payload };
  try {
    const dir = path.join(process.cwd(), 'data');
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, 'submissions.log'), `${JSON.stringify(record)}\n`, 'utf8');
  } catch {
    // Non-fatal: still acknowledge so the UX succeeds.
  }
  return NextResponse.json({ ok: true });
}
