'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Undo2, Loader2, UserCog } from 'lucide-react';

/** Shown when the current session is a superadmin impersonating another user. */
export function ImpersonationBanner({ name }: { name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const stop = async () => {
    setBusy(true);
    await fetch('/api/admin/stop-impersonate', { method: 'POST' });
    router.push('/dashboard/control');
    router.refresh();
  };
  return (
    <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <UserCog className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        Вы вошли как <strong>{name}</strong> (режим суперадмина).
      </span>
      <button onClick={stop} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-amber-950/10 px-2.5 py-1 font-semibold hover:bg-amber-950/20">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />} Вернуться
      </button>
    </div>
  );
}
