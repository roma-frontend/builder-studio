import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createOrgRequest, getMyOrgRequests } from '@/lib/org-requests';
import { listAllSites } from '@/lib/admin';

export const runtime = 'nodejs';

// A logged-in platform user requests to create/join an organization. The request
// is reviewed by a superadmin (see /api/admin/org-requests).

const ERR: Record<string, [number, string]> = {
  PENDING_EXISTS: [409, 'У вас уже есть заявка на рассмотрении.'],
  NAME_REQUIRED: [400, 'Укажите название организации.'],
  SLUG_INVALID: [400, 'Некорректный адрес (slug).'],
  SLUG_TAKEN: [409, 'Такой адрес организации уже занят.'],
  ORG_NOT_FOUND: [404, 'Организация не найдена.'],
};

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Не авторизован.' }, { status: 401 });
  return NextResponse.json({
    requests: getMyOrgRequests(me.id),
    organizations: listAllSites().map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
  });
}

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Не авторизован.' }, { status: 401 });

  let body: { type?: string; requestedName?: string; requestedSlug?: string; targetSiteId?: string; message?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const type = body.type === 'join' ? 'join' : 'create';
  try {
    const req = createOrgRequest(me, { type, requestedName: body.requestedName, requestedSlug: body.requestedSlug, targetSiteId: body.targetSiteId, message: body.message });
    return NextResponse.json({ ok: true, request: req });
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    const [status, msg] = ERR[code] ?? [500, 'Не удалось отправить заявку.'];
    return NextResponse.json({ error: msg }, { status });
  }
}
