import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { storageInfo } from '@/lib/storage';
import { gcUploads } from '@/lib/uploads-gc';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';

// Superadmin: storage status (R2 vs local) + manual orphaned-uploads cleanup.

export async function GET() {
  const me = await getCurrentUser();
  if (!me || !isSuperadmin(me)) return NextResponse.json({ error: 'Недостаточно прав.' }, { status: 403 });
  return NextResponse.json({ info: storageInfo() });
}

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || !isSuperadmin(me)) return NextResponse.json({ error: 'Недостаточно прав.' }, { status: 403 });
  let body: { action?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (body.action === 'gc') {
    const { deleted } = await gcUploads();
    recordAudit({ id: me.id, email: me.email }, 'storage.gc', 'uploads', `удалено ${deleted}`);
    return NextResponse.json({ ok: true, deleted });
  }
  return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
}
