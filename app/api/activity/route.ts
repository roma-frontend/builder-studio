import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { recordActivity } from '@/lib/activity';

export const runtime = 'nodejs';

/** Record one dashboard route visit for the current staff member. No-op for
 *  non-staff / anonymous. The client throttles to one call per route change. */
export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || !isStaff(me)) return NextResponse.json({ ok: false });
  let body: { path?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }); }
  const path = (body.path || '').trim();
  if (path.startsWith('/dashboard') || path === '/studio' || path.startsWith('/studio/')) {
    recordActivity(me.id, path);
  }
  return NextResponse.json({ ok: true });
}
