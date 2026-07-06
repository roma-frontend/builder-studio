import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { getAccessMatrix, setCapability, grantCapability, revokeGrant, MANAGED_ROLES } from '@/lib/access';
import { recordAudit } from '@/lib/audit';
import { getLocale } from '@/lib/i18n';
import { apiErrors } from '@/lib/api-errors-dict';

export const runtime = 'nodejs';

/** Current capability matrix (superadmin only). */
export async function GET() {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });
  return NextResponse.json(getAccessMatrix());
}

/** Toggle one capability for one managed role (superadmin only). */
export async function POST(request: Request) {
  const t = apiErrors(await getLocale());
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: t.unauthorizedDot }, { status: 401 });
  if (!isSuperadmin(me)) return NextResponse.json({ error: t.forbidden }, { status: 403 });

  let body: { role?: string; capability?: string; enabled?: boolean; action?: string; minutes?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { role, capability, enabled, action } = body;
  if (!role || !capability) return NextResponse.json({ error: t.forbidden }, { status: 400 });
  if (!MANAGED_ROLES.includes(role as never)) return NextResponse.json({ error: t.unknownRole }, { status: 400 });

  try {
    if (action === 'grant') {
      const g = grantCapability(role, capability, Number(body.minutes) || 60, me.id);
      recordAudit({ id: me.id, email: me.email }, 'access.grant', `${role}:${capability}`, `until ${g.expiresAt}`);
    } else if (action === 'revoke') {
      revokeGrant(role, capability);
      recordAudit({ id: me.id, email: me.email }, 'access.revokeGrant', `${role}:${capability}`, '');
    } else {
      if (typeof enabled !== 'boolean') return NextResponse.json({ error: t.forbidden }, { status: 400 });
      setCapability(role, capability, enabled, me.id);
      recordAudit({ id: me.id, email: me.email }, 'access.setCapability', `${role}:${capability}`, enabled ? 'enabled' : 'disabled');
    }
  } catch {
    return NextResponse.json({ error: t.forbidden }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...getAccessMatrix() });
}
