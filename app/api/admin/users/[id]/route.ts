import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { getUserById, setUserRole } from '@/lib/admin';
import type { Role } from '@/lib/db';

export const runtime = 'nodejs';

const ROLES: Role[] = ['customer', 'admin', 'superadmin'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Не авторизован.' }, { status: 401 });
  // Only a superadmin may change roles.
  if (!isSuperadmin(me)) return NextResponse.json({ error: 'Недостаточно прав.' }, { status: 403 });

  const { id } = await params;
  if (id === me.id) return NextResponse.json({ error: 'Нельзя изменить свою роль.' }, { status: 400 });

  let body: { role?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const role = body.role as Role;
  if (!ROLES.includes(role)) return NextResponse.json({ error: 'Неизвестная роль.' }, { status: 400 });

  const target = getUserById(id);
  if (!target) return NextResponse.json({ error: 'Пользователь не найден.' }, { status: 404 });

  setUserRole(id, role);
  return NextResponse.json({ ok: true, id, role });
}
