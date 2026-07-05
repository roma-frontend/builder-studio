import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
// This route shells out to the media pipeline (ffmpeg + optional muapi.ai call
// using the server's MUAPI_KEY). It is intended for LOCAL/dev use — do not
// expose it publicly without auth. Inputs are passed as an argv array (never a
// shell string), so there is no command injection.

const SECTIONS = ['hero', 'background', 'card'] as const;
type Section = (typeof SECTIONS)[number];

interface GenerateBody {
  prompt?: string;
  from?: string;
  section?: Section;
  title?: string;
  subtitle?: string;
  cta?: string;
  ctaHref?: string;
  aspect?: string;
  slug?: string;
  duration?: number;
}

function argsFrom(body: GenerateBody): string[] {
  const a: string[] = [];
  const push = (flag: string, val?: string | number) => {
    if (val === undefined || val === null || val === '') return;
    a.push(flag, String(val));
  };
  push('--prompt', body.prompt?.trim());
  push('--from', body.from?.trim());
  push('--section', SECTIONS.includes(body.section as Section) ? body.section : 'card');
  push('--title', body.title?.trim());
  push('--subtitle', body.subtitle?.trim());
  push('--cta', body.cta?.trim());
  push('--ctaHref', body.ctaHref?.trim());
  push('--aspect', body.aspect?.trim());
  push('--slug', body.slug?.trim());
  push('--duration', body.duration);
  return a;
}

export async function POST(request: Request) {
  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.prompt?.trim() && !body.from?.trim()) {
    return NextResponse.json({ error: 'Provide a "prompt" (to generate) or "from" (local file).' }, { status: 400 });
  }

  const root = process.cwd();
  const script = path.join(root, 'scripts', 'media-pipeline', 'run.mjs');
  const args = [script, ...argsFrom(body)];

  const result = await new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    execFile(
      process.execPath, // node
      args,
      { cwd: root, env: process.env, maxBuffer: 1024 * 1024 * 64, timeout: 1000 * 60 * 30 },
      (err, stdout, stderr) => resolve({ code: err ? (err as NodeJS.ErrnoException & { code?: number }).code ?? 1 : 0, stdout: String(stdout), stderr: String(stderr) }),
    );
  });

  if (result.code !== 0) {
    return NextResponse.json(
      { error: 'Pipeline failed', detail: (result.stderr || result.stdout).slice(-2000) },
      { status: 500 },
    );
  }

  // Return the freshly written entry (last item matching the slug/title).
  let entry = null;
  try {
    const data = JSON.parse(await readFile(path.join(root, 'data', 'media.json'), 'utf8'));
    if (Array.isArray(data) && data.length) entry = data[data.length - 1];
  } catch {
    /* ignore */
  }

  return NextResponse.json({ ok: true, entry, log: result.stdout.slice(-2000) });
}
