'use client';

// Superadmin review of organization requests (create/join): approve or reject.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Check, X, Plus, LogIn, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ORG_REQ_SEEN_EVENT } from '@/components/dashboard/org-requests-badge';

type Req = {
  id: string; type: string; requesterName: string; requesterEmail: string;
  requestedName: string; requestedSlug: string; targetName: string | null; message: string;
  createdAt: string | number;
};

export function OrgRequests({ onChange }: { onChange?: () => void }) {
  const [items, setItems] = useState<Req[] | null>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    fetch('/api/admin/org-requests?status=pending').then((r) => r.json()).then((d) => {
      const list = d.requests ?? [];
      setItems(list);
      // Mark as seen so the nav badge stops blinking.
      window.dispatchEvent(new CustomEvent(ORG_REQ_SEEN_EVENT, { detail: list.length }));
    }).catch(() => setItems([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    let reason = '';
    if (action === 'reject') reason = window.prompt('Причина отклонения (необязательно):') ?? '';
    setBusy(id);
    await fetch('/api/admin/org-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, requestId: id, reason }) });
    setBusy(''); load(); onChange?.();
  };

  if (items === null) return <div className="flex h-20 items-center justify-center rounded-2xl border border-border/60"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Inbox className="h-4 w-4 text-amber-500" /> Заявки организаций <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600">{items.length}</span></h2>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
            <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${r.type === 'create' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {r.type === 'create' ? <Plus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {r.type === 'create' ? <>Создать «{r.requestedName}» <span className="text-muted-foreground">/s/{r.requestedSlug}</span></> : <>Присоединиться к «{r.targetName ?? '—'}»</>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{r.requesterName || r.requesterEmail} · {r.requesterEmail}{r.message ? ` · «${r.message}»` : ''}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="gap-1.5 bg-green-600 text-white hover:bg-green-700" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}>
                {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Одобрить
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 border-red-500/40 text-red-500 hover:bg-red-500/10" disabled={busy === r.id} onClick={() => act(r.id, 'reject')}>
                <X className="h-4 w-4" /> Отклонить
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
