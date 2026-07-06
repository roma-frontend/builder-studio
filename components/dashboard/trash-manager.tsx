'use client';

// Superadmin recycle bin: restore or permanently delete trashed sites.

import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Trash2, Rocket, CircleDashed, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useLocale } from '@/hooks/use-locale';
import { BCP47 } from '@/lib/seo';

interface Item { id: string; name: string; slug: string; ownerEmail: string; published: boolean; deletedAt: string; deletedByEmail: string; ownerExists: boolean }

const DICT = {
  ru: { empty: 'Корзина пуста.', site: 'Сайт', owner: 'Владелец', deleted: 'Удалён', restore: 'Восстановить', purge: 'Удалить навсегда', ownerGone: 'Владелец удалён — восстановление невозможно.', purgeTitle: 'Удалить навсегда?', purgeDesc: 'Сайт «{name}» будет удалён безвозвратно.', purgeOk: 'Удалить навсегда', published: 'Опубликован', draft: 'Черновик', err: 'Ошибка' },
  en: { empty: 'Trash is empty.', site: 'Site', owner: 'Owner', deleted: 'Deleted', restore: 'Restore', purge: 'Delete forever', ownerGone: 'Owner is gone — cannot restore.', purgeTitle: 'Delete forever?', purgeDesc: 'Site \u201c{name}\u201d will be permanently removed.', purgeOk: 'Delete forever', published: 'Published', draft: 'Draft', err: 'Error' },
  hy: { empty: 'Աղբարկղը դատարկ է։', site: 'Կայք', owner: 'Սեփականատեր', deleted: 'Ջնջված', restore: 'Վերականգնել', purge: 'Ջնջել ընդմիշտ', ownerGone: 'Սեփականատերը ջնջված է — վերականգնումն անհնար է։', purgeTitle: 'Ջնջե՞լ ընդմիշտ', purgeDesc: '«{name}» կայքը կջնջվի անվերադարձ։', purgeOk: 'Ջնջել ընդմիշտ', published: 'Հրապարակված', draft: 'Սևագիր', err: 'Սխալ' },
} as const;

export function TrashManager() {
  const locale = useLocale().locale as keyof typeof DICT;
  const t = DICT[locale] ?? DICT.en;
  const [items, setItems] = useState<Item[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    fetch('/api/admin/trash').then((r) => r.json()).then((d) => setItems(d.items ?? [])).catch(() => setErr(t.err));
  }, [t.err]);

  const act = async (id: string, action: 'restore' | 'purge') => {
    setBusy(id);
    setErr('');
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.code === 'owner_gone' ? t.ownerGone : json.error || t.err); return; }
      setItems(json.items ?? []);
    } catch {
      setErr(t.err);
    } finally {
      setBusy(null);
    }
  };

  const purge = async (it: Item) => {
    const ok = await confirm({ title: t.purgeTitle, description: t.purgeDesc.replace('{name}', it.name), confirmLabel: t.purgeOk, tone: 'warning' });
    if (ok) act(it.id, 'purge');
  };

  if (!items) return <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> …</div>;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">{t.empty}</p>
      </div>
    );
  }

  return (
    <>
      {confirmDialog}
      {err && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
      <div className="overflow-hidden rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">{t.site}</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">{t.owner}</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">{t.deleted}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${it.published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {it.published ? <Rocket className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
                    </span>
                    <div>
                      <p className="font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">/s/{it.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{it.ownerEmail}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{new Date(it.deletedAt).toLocaleString(BCP47[locale])}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="sm" variant="outline" disabled={busy === it.id || !it.ownerExists} title={!it.ownerExists ? t.ownerGone : t.restore} onClick={() => act(it.id, 'restore')} className="gap-1.5">
                      {busy === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} <span className="hidden sm:inline">{t.restore}</span>
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy === it.id} onClick={() => purge(it)} className="gap-1.5 text-destructive hover:text-destructive" title={t.purge}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
