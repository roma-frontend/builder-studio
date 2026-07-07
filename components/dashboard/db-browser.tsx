'use client';

// Superadmin database browser + fullscreen "Database Studio". Pick a table on
// the left, view/search/paginate its rows on the right, edit/insert/delete a
// row, or export the whole (optionally filtered) table to a styled XLSX. All
// mutations go through /api/admin/db (superadmin-only, parameterized,
// rowid-addressed).

import { useEffect, useRef, useState } from 'react';
import {
  Table2, Loader2, Search, Pencil, Trash2, ChevronLeft, ChevronRight, X, Save,
  AlertTriangle, Maximize2, Minimize2, Plus, Download, RefreshCw, Database, KeyRound,
} from 'lucide-react';
import { usePref } from '@/hooks/use-user-prefs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/hooks/use-locale';
import { staffDict, type StaffDict } from '@/lib/staff-dict';

type Column = { name: string; type: string; notnull: boolean; pk: boolean };
type Row = Record<string, unknown>;
type Dict = StaffDict['db'];
const PAGE = 50;
const SECRET = /password|hash|token|secret/i;

// --- column typing / validation ------------------------------------------
type Kind = 'integer' | 'number' | 'text';
function kindOf(type: string): Kind {
  const t = (type || '').toUpperCase();
  if (/INT/.test(t)) return 'integer';
  if (/REAL|FLOA|DOUB|NUMERIC|DEC/.test(t)) return 'number';
  return 'text';
}
// A per-field hint describing the expected value (translated).
function fieldHint(c: Column, t: Dict): string {
  if (c.pk) return t.hintAuto;
  const base = kindOf(c.type) === 'integer' ? t.hintInteger : kindOf(c.type) === 'number' ? t.hintNumber : t.hintText;
  return `${base} · ${c.notnull ? t.hintRequired : t.hintNullable}`;
}
// Returns a translated error string, or '' when the value is acceptable.
function validate(c: Column, raw: string, t: Dict): string {
  const v = raw.trim();
  if (v === '') return c.notnull && !c.pk ? t.vRequired : '';
  const k = kindOf(c.type);
  if (k === 'integer' && !/^-?\d+$/.test(v)) return t.vInteger;
  if (k === 'number' && !/^-?\d*\.?\d+$/.test(v)) return t.vNumber;
  if (/json|data|doc/i.test(c.name) && (v.startsWith('{') || v.startsWith('['))) {
    try { JSON.parse(v); } catch { return t.vJson; }
  }
  return '';
}

export function DbBrowser({ tables }: { tables: { name: string; count: number }[] }) {
  const t = staffDict(useLocale().locale).db;
  const [savedTable, saveTable] = usePref<string>('db-table', '');
  const [active, setActive] = useState<string>(tables[0]?.name ?? '');
  const picked = useRef(false);
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState('');
  const [submittedQ, setSubmittedQ] = useState('');
  const [edit, setEdit] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  const [counts, setCounts] = useState(tables);
  const [full, setFull] = useState(false);
  const [tableFilter, setTableFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  const [tick, setTick] = useState(0);
  const key = `${active}|${offset}|${submittedQ}|${tick}`;
  const [result, setResult] = useState<{ key: string; columns: Column[]; rows: Row[]; total: number } | null>(null);
  const loading = !!active && result?.key !== key;
  const { columns = [], rows = [], total = 0 } = result ?? {};

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const url = `/api/admin/db?table=${encodeURIComponent(active)}&offset=${offset}&q=${encodeURIComponent(submittedQ)}`;
    fetch(url).then((r) => r.json()).then((d) => {
      if (alive) setResult({ key, columns: d.columns ?? [], rows: d.rows ?? [], total: d.total ?? 0 });
    }).catch(() => {
      if (alive) setResult((prev) => ({ key, columns: prev?.columns ?? [], rows: prev?.rows ?? [], total: prev?.total ?? 0 }));
    });
    return () => { alive = false; };
  }, [key, active, offset, submittedQ]);

  useEffect(() => {
    if (!picked.current && savedTable && savedTable !== active && tables.some((t) => t.name === savedTable)) {
      setActive(savedTable);
      setOffset(0);
    }
  }, [savedTable, tables]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc leaves fullscreen; lock body scroll while the studio overlay is open.
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [full]);

  const selectTable = (name: string) => { picked.current = true; saveTable(name); setActive(name); setOffset(0); setQ(''); setSubmittedQ(''); };
  const search = () => { setOffset(0); setSubmittedQ(q); setTick((n) => n + 1); };
  const refresh = () => { setTick((n) => n + 1); fetch('/api/admin/db').then((r) => r.json()).then((d) => d.tables && setCounts(d.tables)).catch(() => {}); };

  const saveEdit = async (patch: Row, rowid: number) => {
    await fetch('/api/admin/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', table: active, rowid, patch }) });
    setEdit(null); refresh();
  };
  const doInsert = async (values: Row) => {
    const r = await fetch('/api/admin/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'insert', table: active, values }) });
    if (!r.ok) throw new Error('insert');
    setAdding(false); refresh();
  };
  const doDelete = async (rowid: number) => {
    await fetch('/api/admin/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', table: active, rowid }) });
    setConfirmDel(null); refresh();
  };
  const doExport = async () => {
    if (!active) return;
    setExporting(true);
    try {
      const url = `/api/admin/db?table=${encodeURIComponent(active)}&q=${encodeURIComponent(submittedQ)}&export=xlsx`;
      const res = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href; a.download = `${active}.xlsx`; a.click();
      URL.revokeObjectURL(href);
    } finally { setExporting(false); }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE));
  const page = Math.floor(offset / PAGE) + 1;
  const shownTables = counts.filter((c) => !tableFilter || c.name.toLowerCase().includes(tableFilter.toLowerCase()));

  // The rows/tables/toolbar are shared between the inline card and the fullscreen
  // studio, so they live in one render tree parametrized by `full`.
  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder={t.searchIn.replace('{table}', active)} className="h-10 pl-10" />
      </div>
      <Button variant="outline" size="sm" onClick={search} className="h-10">{t.find}</Button>
      <Button variant="outline" size="sm" onClick={() => setAdding(true)} disabled={!active} className="h-10 gap-1.5"><Plus className="h-4 w-4" />{t.addRow}</Button>
      <Button variant="outline" size="sm" onClick={doExport} disabled={!active || exporting} className="h-10 gap-1.5">{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{exporting ? t.exporting : t.exportXlsx}</Button>
      <Button variant="ghost" size="sm" onClick={refresh} className="h-10 gap-1.5" aria-label={t.refresh}><RefreshCw className="h-4 w-4" /></Button>
    </div>
  );

  const rowsPanel = (
    <div className="min-w-0 space-y-3">
      {toolbar}
      <div className={`overflow-auto rounded-2xl border border-border/60 ${full ? 'max-h-[calc(100dvh-230px)]' : ''}`}>
        {loading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">{t.noRows}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
              <tr>
                {columns.map((c) => (
                  <th key={c.name} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                    <span className="inline-flex items-center gap-1">{c.pk && <KeyRound className="h-3 w-3 text-primary" />}{c.name}</span>
                  </th>
                ))}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => (
                <tr key={String(row.__rowid)} className="transition-colors hover:bg-primary/5">
                  {columns.map((c) => (
                    <td key={c.name} className="max-w-[280px] truncate px-3 py-2" title={SECRET.test(c.name) ? '' : String(row[c.name] ?? '')}>
                      {SECRET.test(c.name) ? <span className="text-muted-foreground">••••••</span> : format(row[c.name])}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button onClick={() => setEdit(row)} className="mr-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={t.edit}><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmDel(row)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500" aria-label={t.delete}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t.total.replace('{n}', String(total))}{columns.length > 0 && ` · ${t.columnsLabel.replace('{n}', String(columns.length))}`}</span>
        <div className="flex items-center gap-2">
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))} className="rounded-lg border border-border/60 p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span>{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setOffset(offset + PAGE)} className="rounded-lg border border-border/60 p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  const tablesPanel = (withSearch: boolean) => (
    <div className="rounded-2xl border border-border/60 bg-card p-2 lg:h-max">
      {withSearch && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} placeholder={t.searchTables} className="h-9 pl-10" />
        </div>
      )}
      <ul className={`space-y-0.5 overflow-y-auto ${full ? 'max-h-[calc(100dvh-200px)]' : 'max-h-[75dvh]'}`}>
        {shownTables.map((c) => (
          <li key={c.name}>
            <button onClick={() => selectTable(c.name)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${active === c.name ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
              <Table2 className="h-4 w-4 shrink-0 opacity-70" />
              <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
              <span className="flex-none rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">{c.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const modals = (
    <>
      {edit && <RowModal mode="edit" table={active} columns={columns} row={edit} onClose={() => setEdit(null)} onSubmit={(v) => saveEdit(v, Number(edit.__rowid))} t={t} />}
      {adding && <RowModal mode="add" table={active} columns={columns} row={{}} onClose={() => setAdding(false)} onSubmit={doInsert} t={t} />}
      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} t={t}>
          <div className="text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500"><AlertTriangle className="h-6 w-6" /></span>
            <h3 className="text-lg font-bold">{t.deleteRowTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.deleteRowDesc}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="ghost" onClick={() => setConfirmDel(null)}>{t.cancel}</Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => doDelete(Number(confirmDel.__rowid))}>{t.delete}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );

  if (full) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border/60 px-5 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Database className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold leading-tight">{t.studioTitle}</h2>
            <p className="truncate text-xs text-muted-foreground">{t.tablesLabel.replace('{n}', String(counts.length))}{active && ` · ${active}`}</p>
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => setFull(false)} className="h-9 gap-1.5"><Minimize2 className="h-4 w-4" />{t.exitFullscreen}</Button>
          </div>
        </header>
        <div className="grid min-h-0 flex-1 gap-5 overflow-hidden p-5 lg:grid-cols-[280px_1fr]">
          {tablesPanel(true)}
          {rowsPanel}
        </div>
        {modals}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setFull(true)} className="gap-1.5"><Maximize2 className="h-4 w-4" />{t.fullscreen}</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {tablesPanel(false)}
        {rowsPanel}
      </div>
      {modals}
    </div>
  );
}

function format(v: unknown) {
  if (v === null || v === undefined) return <span className="text-muted-foreground/50">null</span>;
  return String(v);
}

function Modal({ children, onClose, t }: { children: React.ReactNode; onClose: () => void; t: Dict }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label={t.close}><X className="h-5 w-5" /></button>
        {children}
      </div>
    </div>
  );
}

// Shared add/edit row modal with live per-field validation hints.
function RowModal({ mode, table, columns, row, onClose, onSubmit, t }: {
  mode: 'add' | 'edit'; table: string; columns: Column[]; row: Row;
  onClose: () => void; onSubmit: (values: Row) => Promise<void> | void; t: Dict;
}) {
  const [form, setForm] = useState<Row>(() => Object.fromEntries(columns.map((c) => [c.name, row[c.name] ?? ''])));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // pk column is read-only on edit; on add it is left for the DB (auto) unless typed.
  const errors: Record<string, string> = {};
  for (const c of columns) {
    if (c.pk && mode === 'edit') continue;
    const e = validate(c, String(form[c.name] ?? ''), t);
    if (e) errors[c.name] = e;
  }
  const hasErrors = Object.keys(errors).length > 0;

  const submit = async () => {
    if (hasErrors) return;
    setBusy(true); setErr('');
    try {
      if (mode === 'edit') {
        const patch: Row = {};
        for (const c of columns) {
          if (c.pk) continue;
          if (String(form[c.name] ?? '') !== String(row[c.name] ?? '')) patch[c.name] = form[c.name];
        }
        await onSubmit(patch);
      } else {
        const values: Row = {};
        for (const c of columns) {
          const v = String(form[c.name] ?? '');
          if (c.pk && v === '') continue; // let auto/default fill in
          if (v !== '') values[c.name] = form[c.name];
        }
        await onSubmit(values);
      }
    } catch {
      setErr(t.opError);
    } finally { setBusy(false); }
  };

  const title = mode === 'add' ? t.addRowTitle.replace('{table}', table) : t.editRow.replace('{table}', table);
  const hint = mode === 'add' ? t.addRowHint : t.editHint;

  return (
    <Modal onClose={onClose} t={t}>
      <h3 className="mb-1 text-lg font-bold">{title}</h3>
      <p className="mb-4 text-xs text-muted-foreground">{hint}</p>
      <div className="max-h-[60dvh] space-y-3 overflow-y-auto pr-1">
        {columns.map((c) => {
          const readOnly = c.pk && mode === 'edit';
          const fieldErr = errors[c.name];
          return (
            <div key={c.name} className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {c.pk && <KeyRound className="h-3 w-3 text-primary" />}
                {c.name}
                <span className="opacity-60">· {c.type || 'ANY'}{c.pk ? ' · pk' : c.notnull ? ' · NOT NULL' : ''}</span>
              </label>
              {readOnly ? (
                <Input value={String(row[c.name] ?? '')} disabled className="h-10 opacity-60" />
              ) : (
                <>
                  <textarea
                    value={String(form[c.name] ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, [c.name]: e.target.value }))}
                    rows={String(form[c.name] ?? '').length > 60 ? 3 : 1}
                    placeholder={c.pk ? t.hintAuto : ''}
                    className={`w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors ${fieldErr ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                  />
                  <p className={`text-[11px] ${fieldErr ? 'text-red-500' : 'text-muted-foreground/70'}`}>{fieldErr || fieldHint(c, t)}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
      {err && <p className="mt-3 text-sm text-red-500">{err}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
        <Button onClick={submit} disabled={busy || hasErrors} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'add' ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {busy ? (mode === 'add' ? t.creating : t.saving) : mode === 'add' ? t.create : t.save}
        </Button>
      </div>
    </Modal>
  );
}
