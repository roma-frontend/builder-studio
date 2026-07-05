'use client';

import { useState } from 'react';
import { Crown, ShieldCheck, UserCircle, Loader2, Globe } from 'lucide-react';

type Role = 'customer' | 'admin' | 'superadmin';
interface Row { id: string; email: string; name: string; role: Role; createdAt: string; siteCount: number }

const ROLE_META: Record<Role, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  superadmin: { label: 'Суперадмин', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', Icon: Crown },
  admin: { label: 'Админ', cls: 'bg-primary/15 text-primary', Icon: ShieldCheck },
  customer: { label: 'Клиент', cls: 'bg-muted text-muted-foreground', Icon: UserCircle },
};
const ROLES: Role[] = ['customer', 'admin', 'superadmin'];

export function UsersTable({ users, canEdit, meId }: { users: Row[]; canEdit: boolean; meId: string }) {
  const [rows, setRows] = useState(users);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const changeRole = async (id: string, role: Role) => {
    setBusy(id);
    setError('');
    const prev = rows;
    setRows((r) => r.map((u) => (u.id === id ? { ...u, role } : u)));
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Не удалось изменить роль.');
        setRows(prev);
      }
    } catch {
      setError('Сеть недоступна.');
      setRows(prev);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-500" role="alert">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Пользователь</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">Сайты</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Регистрация</th>
              <th className="px-4 py-3 font-semibold">Роль</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((u) => {
              const meta = ROLE_META[u.role];
              const self = u.id === meId;
              return (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.name || 'Без имени'}{self && <span className="ml-1 text-xs text-muted-foreground">(вы)</span>}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Globe className="h-3.5 w-3.5" /> {u.siteCount}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3">
                    {canEdit && !self ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          disabled={busy === u.id}
                          onChange={(e) => changeRole(u.id, e.target.value as Role)}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                        </select>
                        {busy === u.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
                        <meta.Icon className="h-3 w-3" /> {meta.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
