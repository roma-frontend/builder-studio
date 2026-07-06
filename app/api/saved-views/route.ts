import { NextResponse } from 'next/server';
import { getCurrentUser, isStaff } from '@/lib/auth';
import { listSavedViews, createSavedView, deleteSavedView } from '@/lib/saved-views';

export const runtime = 'nodejs';

const ROUTES = new Set(['users', 'allSites']);

/** GET ?route=users → the caller's saved views for that table. */
export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me || !isStaff(me)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const route = new URL(request.url).searchParams.get('route') || '';
  if (!ROUTES.has(route)) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: listSavedViews(me.id, route) });
}

/** POST { route, name, query } → create a preset. */
export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || !isStaff(me)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  let body: { route?: string; name?: string; query?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }); }
  if (!body.route || !ROUTES.has(body.route) || !body.name) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const view = createSavedView(me.id, body.route, body.name, body.query);
  return NextResponse.json({ ok: true, view, items: listSavedViews(me.id, body.route) });
}

/** DELETE ?id=&route= → remove one of the caller's presets. */
export async function DELETE(request: Request) {
  const me = await getCurrentUser();
  if (!me || !isStaff(me)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const route = url.searchParams.get('route') || '';
  if (!id) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  deleteSavedView(me.id, id);
  return NextResponse.json({ ok: true, items: ROUTES.has(route) ? listSavedViews(me.id, route) : [] });
}
