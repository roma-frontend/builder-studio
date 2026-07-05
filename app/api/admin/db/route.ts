import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperadmin } from '@/lib/auth';
import { listTables, getRows, updateRow, deleteRow } from '@/lib/db-admin';
import { recordAudit } from '@/lib/audit';

export const runtime = 'nodejs';

// Superadmin-only database browser API.

export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me || !isSuperadmin(me)) return NextResponse.json({ error: 'Недостаточно прав.' }, { status: 403 });

  const url = new URL(request.url);
  const table = url.searchParams.get('table');
  if (!table) return NextResponse.json({ tables: listTables() });
  const offset = Number(url.searchParams.get('offset') ?? 0) || 0;
  const q = url.searchParams.get('q') ?? '';
  try {
    return NextResponse.json({ table, ...getRows(table, { offset, q, limit: 50 }) });
  } catch {
    return NextResponse.json({ error: 'Таблица не найдена.' }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || !isSuperadmin(me)) return NextResponse.json({ error: 'Недостаточно прав.' }, { status: 403 });

  let body: { action?: string; table?: string; rowid?: number; patch?: Record<string, unknown> };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const table = (body.table ?? '').trim();
  const rowid = Number(body.rowid);
  if (!table || !Number.isFinite(rowid)) return NextResponse.json({ error: 'Некорректный запрос.' }, { status: 400 });

  try {
    if (body.action === 'update') {
      updateRow(table, rowid, body.patch ?? {});
      recordAudit({ id: me.id, email: me.email }, 'db.update', `${table}#${rowid}`, Object.keys(body.patch ?? {}).join(','));
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'delete') {
      deleteRow(table, rowid);
      recordAudit({ id: me.id, email: me.email }, 'db.delete', `${table}#${rowid}`, '');
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (code === 'BAD_TABLE' || code === 'BAD_COLUMN') return NextResponse.json({ error: 'Недопустимая таблица или колонка.' }, { status: 400 });
    return NextResponse.json({ error: 'Ошибка операции с БД.' }, { status: 500 });
  }
}
