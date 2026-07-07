import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { getUserById, setUserRole, setUserActive, deleteUser, countSuperadmins, revokeUserSessions, setUserPasswordHash, setMustChangePassword } from '@/lib/admin';
import { resetTours } from '@/lib/user-prefs';
import { recordAudit } from '@/lib/audit';
import { hashPassword, generatePassword } from '@/lib/auth';
import type { Role } from '@/lib/db';
import { getLocale } from '@/lib/i18n';
import { apiErrors } from '@/lib/api-errors-dict';

export const runtime = 'nodejs';

const ROLES: Role[] = ['customer', 'admin', 'superadmin'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  // Only a superadmin may change roles.
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });

  const { id } = await params;

  let body: { role?: string; action?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const target = getUserById(id);
  if (!target) return NextResponse.json({ error: t.userNotFound }, { status: 404 });

  // Reset onboarding tours — harmless on any account (incl. your own), so it's
  // allowed before the "can't change your own account" guard below.
  if (body.action === 'reset-tours') {
    const cleared = resetTours(id);
    recordAudit({ id: me.id, email: me.email }, 'user.reset_tours', target.email, `${cleared} flags`);
    return NextResponse.json({ ok: true, id, cleared });
  }

  if (id === me.id) return NextResponse.json({ error: t.cannotChangeOwnAccount }, { status: 400 });

  // Suspend / reinstate. Suspension also kills every live session immediately.
  if (body.action === 'suspend' || body.action === 'activate') {
    const suspend = body.action === 'suspend';
    if (suspend && target.role === 'superadmin' && countSuperadmins() <= 1) {
      return NextResponse.json({ error: t.cannotBlockLastSuperadmin }, { status: 400 });
    }
    setUserActive(id, !suspend);
    const revoked = suspend ? revokeUserSessions(id) : 0;
    recordAudit(
      { id: me.id, email: me.email },
      suspend ? 'user.suspend' : 'user.activate',
      target.email,
      suspend ? `${revoked} сессий завершено` : '',
    );
    return NextResponse.json({ ok: true, id, isActive: !suspend });
  }

  // Issue a temporary password: generate a strong random one, store only its
  // hash, and kill every live session so the next login must use it. The
  // plaintext is returned exactly once (never persisted) for the superadmin to
  // relay to the user, who should change it afterwards.
  if (body.action === 'reset-password') {
    const tempPassword = generatePassword();
    setUserPasswordHash(id, hashPassword(tempPassword));
    setMustChangePassword(id, true);
    const revoked = revokeUserSessions(id);
    recordAudit({ id: me.id, email: me.email }, 'user.reset_password', target.email, `${revoked} сессий завершено`);
    return NextResponse.json({ ok: true, id, tempPassword });
  }

  const role = body.role as Role;
  if (!ROLES.includes(role)) return NextResponse.json({ error: t.unknownRole }, { status: 400 });

  // Never leave the platform without a superadmin.
  if (target.role === 'superadmin' && role !== 'superadmin' && countSuperadmins() <= 1) {
    return NextResponse.json({ error: t.cannotDemoteLastSuperadmin }, { status: 400 });
  }

  setUserRole(id, role);
  recordAudit({ id: me.id, email: me.email }, 'role.change', target.email, `${target.role} → ${role}`);
  return NextResponse.json({ ok: true, id, role });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });

  const { id } = await params;
  if (id === me.id) return NextResponse.json({ error: t.cannotDeleteSelf }, { status: 400 });

  const target = getUserById(id);
  if (!target) return NextResponse.json({ error: t.userNotFound }, { status: 404 });
  if (target.role === 'superadmin' && countSuperadmins() <= 1) {
    return NextResponse.json({ error: t.cannotDeleteLastSuperadmin }, { status: 400 });
  }

  // FK cascade removes their sessions, sites and (via site) submissions.
  deleteUser(id);
  recordAudit({ id: me.id, email: me.email }, 'user.delete', target.email);
  return NextResponse.json({ ok: true, id });
}
