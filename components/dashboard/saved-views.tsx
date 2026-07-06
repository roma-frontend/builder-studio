'use client';

// Compact saved-views control for admin tables: load a preset, save the current
// filter as a named view, or delete one. Talks to /api/saved-views. Generic —
// `current` is any JSON-serialisable filter object; `onApply` receives it back.

import { useEffect, useRef, useState } from 'react';
import { Bookmark, Plus, Trash2, Check } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

interface View { id: string; name: string; query: Record<string, unknown>; createdAt: string }

const DICT = {
  ru: { views: 'Виды', none: 'Нет сохранённых видов', save: 'Сохранить текущий фильтр', name: 'Название вида', empty: 'Пусто' },
  en: { views: 'Views', none: 'No saved views', save: 'Save current filter', name: 'View name', empty: 'Empty' },
  hy: { views: 'Տեսքեր', none: 'Պահված տեսքեր չկան', save: 'Պահել ընթացիկ ֆիլտրը', name: 'Տեսքի անուն', empty: 'Դատարկ' },
} as const;

export function SavedViews<T extends Record<string, unknown>>({ route, current, onApply }: { route: string; current: T; onApply: (q: T) => void }) {
  const locale = useLocale().locale as keyof typeof DICT;
  const t = DICT[locale] ?? DICT.en;
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<View[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/saved-views?route=${encodeURIComponent(route)}`).then((r) => r.json()).then((d) => setViews(d.items ?? [])).catch(() => {});
  }, [route]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const save = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/saved-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route, name: name.trim(), query: current }),
      });
      const d = await res.json();
      if (res.ok) { setViews(d.items ?? []); setName(''); }
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/saved-views?id=${id}&route=${encodeURIComponent(route)}`, { method: 'DELETE' });
    const d = await res.json();
    if (res.ok) setViews(d.items ?? []);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Bookmark className="h-3.5 w-3.5" /> {t.views}
        {views.length > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">{views.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          <div className="max-h-56 overflow-y-auto p-1.5">
            {views.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">{t.none}</p>
            ) : (
              views.map((v) => (
                <div key={v.id} className="group flex items-center gap-1 rounded-lg px-1 hover:bg-muted">
                  <button type="button" onClick={() => { onApply(v.query as T); setOpen(false); }} className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm">
                    <Check className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100" />
                    <span className="truncate">{v.name}</span>
                  </button>
                  <button type="button" onClick={() => remove(v.id)} className="rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100" aria-label="delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-1 border-t border-border/60 p-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
              placeholder={t.name}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
            <button type="button" onClick={save} disabled={!name.trim() || busy} title={t.save} className="rounded-lg bg-primary px-2 py-1.5 text-primary-foreground disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
