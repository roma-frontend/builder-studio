import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { listTrashed, restoreSite, purgeTrashed } from '@/lib/trash';
import { recordAudit } from '@/lib/audit';
import { getLocale } from '@/lib/i18n';
import { apiErrors } from '@/lib/api-errors-dict';

export const runtime = 'nodejs';

/** List trashed sites (superadmin only). */
export async function GET() {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });
  return NextResponse.json({ items: listTrashed() });
}

/** Restore or permanently purge a trashed site (superadmin only). */
export async function POST(request: Request) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });

  let body: { id?: string; action?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { id, action } = body;
  if (!id) return NextResponse.json({ error: t.forbidden }, { status: 400 });

  if (action === 'restore') {
    const r = restoreSite(id);
    if (r === 'not_found') return NextResponse.json({ error: t.siteNotFoundDot }, { status: 404 });
    if (r === 'owner_gone') return NextResponse.json({ error: t.forbidden, code: 'owner_gone' }, { status: 409 });
    recordAudit({ id: me.id, email: me.email }, 'site.restore', id);
    return NextResponse.json({ ok: true, items: listTrashed() });
  }
  if (action === 'purge') {
    purgeTrashed(id);
    recordAudit({ id: me.id, email: me.email }, 'site.purge', id);
    return NextResponse.json({ ok: true, items: listTrashed() });
  }
  return NextResponse.json({ error: t.unknownActionDot }, { status: 400 });
}
