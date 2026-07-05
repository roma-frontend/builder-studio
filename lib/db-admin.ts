import 'server-only';
import { getRawDb } from '@/lib/db';

// Superadmin database browser. Generic + defensive: table/column identifiers are
// validated against the live schema (never interpolated from raw user input),
// values are always bound parameters, and rows are addressed by rowid.

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export interface TableInfo { name: string; count: number }
export interface ColumnInfo { name: string; type: string; notnull: boolean; pk: boolean }

export function listTables(): TableInfo[] {
  const db = getRawDb();
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_%' ESCAPE '\\' ORDER BY name")
    .all() as { name: string }[];
  return rows.map((r) => ({
    name: r.name,
    count: Number((db.prepare(`SELECT count(*) n FROM "${r.name}"`).get() as { n: number }).n),
  }));
}

function assertTable(table: string): void {
  if (!IDENT.test(table)) throw new Error('BAD_TABLE');
  const ok = getRawDb().prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table);
  if (!ok) throw new Error('BAD_TABLE');
}

export function tableColumns(table: string): ColumnInfo[] {
  assertTable(table);
  const cols = getRawDb().prepare(`PRAGMA table_info("${table}")`).all() as { name: string; type: string; notnull: number; pk: number }[];
  return cols.map((c) => ({ name: c.name, type: c.type, notnull: !!c.notnull, pk: !!c.pk }));
}

export interface RowsResult { columns: ColumnInfo[]; rows: Record<string, unknown>[]; total: number }

export function getRows(table: string, opts: { limit?: number; offset?: number; q?: string } = {}): RowsResult {
  assertTable(table);
  const db = getRawDb();
  const columns = tableColumns(table);
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const q = (opts.q ?? '').trim();

  let where = '';
  const params: unknown[] = [];
  if (q) {
    where = ' WHERE ' + columns.map((c) => `CAST("${c.name}" AS TEXT) LIKE ?`).join(' OR ');
    for (const _ of columns) params.push(`%${q}%`);
  }
  const total = Number((db.prepare(`SELECT count(*) n FROM "${table}"${where}`).get(...params) as { n: number }).n);
  const rows = db
    .prepare(`SELECT rowid AS __rowid, * FROM "${table}"${where} ORDER BY rowid DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Record<string, unknown>[];
  return { columns, rows, total };
}

function assertColumns(table: string, keys: string[]): void {
  const valid = new Set(tableColumns(table).map((c) => c.name));
  for (const k of keys) {
    if (!IDENT.test(k) || !valid.has(k)) throw new Error('BAD_COLUMN');
  }
}

/** Update one row (addressed by rowid). `patch` keys must be real columns. */
export function updateRow(table: string, rowid: number, patch: Record<string, unknown>): void {
  assertTable(table);
  const keys = Object.keys(patch);
  if (keys.length === 0) return;
  assertColumns(table, keys);
  const set = keys.map((k) => `"${k}" = ?`).join(', ');
  const values = keys.map((k) => normalize(patch[k]));
  getRawDb().prepare(`UPDATE "${table}" SET ${set} WHERE rowid = ?`).run(...values, rowid);
}

export function deleteRow(table: string, rowid: number): void {
  assertTable(table);
  getRawDb().prepare(`DELETE FROM "${table}" WHERE rowid = ?`).run(rowid);
}

// Coerce form strings into DB-friendly values: '' → NULL, numeric strings kept
// (SQLite column affinity converts), everything else as text.
function normalize(v: unknown): unknown {
  if (v === null || v === undefined || v === '') return null;
  return v;
}
