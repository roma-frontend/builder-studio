import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { listAllSiteUsers, assignSiteUserOrg, setSiteUserStatus, listAllSites } from '@/lib/admin';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';

// Superadmin: global view of tenant users (site_users) + assign them to an org.

export async function GET() {
  const me = await getCurrentUser();
  if (!me || !isSuperadmin(me)) return NextResponse.json({ error: 'Недостаточно прав.' }, { status: 403 });
  return NextResponse.json({
    users: listAllSiteUsers(),
    organizations: listAllSites().map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
  });
}

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || !isSuperadmin(me)) return NextResponse.json({ error: 'Недостаточно прав.' }, { status: 403 });

  let body: { action?: string; userId?: string; targetSiteId?: string; status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const userId = (body.userId ?? '').trim();
  if (!userId) return NextResponse.json({ error: 'Не указан пользователь.' }, { status: 400 });

  try {
    if (body.action === 'assign-org') {
      assignSiteUserOrg(userId, (body.targetSiteId ?? '').trim());
      recordAudit({ id: me.id, email: me.email }, 'tenant_user.assign_org', userId, `организация ${body.targetSiteId}`);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'set-status') {
      const status = body.status as 'pending' | 'approved' | 'rejected' | 'suspended';
      if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) return NextResponse.json({ error: 'Неверный статус.' }, { status: 400 });
      setSiteUserStatus(userId, status);
      recordAudit({ id: me.id, email: me.email }, 'tenant_user.set_status', userId, status);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (code === 'EMAIL_TAKEN') return NextResponse.json({ error: 'В этой организации уже есть пользователь с таким email.' }, { status: 409 });
    if (code === 'ORG_NOT_FOUND') return NextResponse.json({ error: 'Организация не найдена.' }, { status: 404 });
    if (code === 'USER_NOT_FOUND') return NextResponse.json({ error: 'Пользователь не найден.' }, { status: 404 });
    return NextResponse.json({ error: 'Ошибка операции.' }, { status: 500 });
  }
}
