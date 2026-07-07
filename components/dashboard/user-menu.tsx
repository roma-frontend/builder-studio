'use client';

// Header avatar + role-aware account menu. The avatar shows the user's
// initial on a role-tinted gradient with a small role badge. The dropdown is
// a two-level drill-in (hr-project sidebar pattern): parent rows slide the
// main level out to the left and reveal a sub-panel with the group's links,
// staggered in with a springy cubic-bezier; the container height animates
// between levels. Opening/closing uses framer-motion (spring + stagger).

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Crown, ShieldCheck, UserCircle, LayoutDashboard, Globe, Inbox, Film,
  LogOut, Search, ExternalLink, ChevronDown, ChevronRight, ChevronLeft,
  Users, LayoutList, ScrollText, Building2, Database, KeyRound, Activity, Trash2,
} from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { dashDict } from '@/lib/dashboard-dict';
import type { Role, ShellUser } from '@/components/dashboard/shell';

const AVATAR_BG: Record<Role, string> = {
  superadmin: 'bg-gradient-to-br from-amber-400 to-orange-600',
  admin: 'bg-gradient-to-br from-primary to-primary/60',
  customer: 'bg-gradient-to-br from-sky-500 to-blue-600',
};
const BADGE_BG: Record<Role, string> = {
  superadmin: 'bg-amber-500',
  admin: 'bg-primary',
  customer: 'bg-sky-500',
};
const CHIP_CLS: Record<Role, string> = {
  superadmin: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  admin: 'bg-primary/15 text-primary',
  customer: 'bg-muted text-muted-foreground',
};
const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  superadmin: Crown,
  admin: ShieldCheck,
  customer: UserCircle,
};

const menuV = {
  hidden: { opacity: 0, scale: 0.95, y: -8 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 480, damping: 34, staggerChildren: 0.03, delayChildren: 0.05 },
  },
  exit: { opacity: 0, scale: 0.97, y: -6, transition: { duration: 0.14, ease: 'easeIn' as const } },
};
const itemV = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 520, damping: 36 } },
};

// hr-project sidebar spring curve, shared by the level slide and height.
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

type Icon = React.ComponentType<{ className?: string }>;
type SubId = 'workspace' | 'staff' | 'super';
type SubItem = { key: string; href: string; icon: Icon; label: string };

export function UserMenu({ user, gated, keys, onLogout }: {
  user: ShellUser;
  gated?: boolean;
  /** Visible nav keys after role + access-matrix filtering (shell's `visible`). */
  keys: string[];
  onLogout: () => void;
}) {
  const t = dashDict(useLocale().locale);
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<SubId | null>(null);
  const [height, setHeight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Drive the sliding container's height from the active panel (the panels
  // are absolutely positioned, so the wrapper can't size itself).
  useLayoutEffect(() => {
    if (!open) return;
    const el = sub ? subRef.current : mainRef.current;
    if (el) setHeight(el.offsetHeight);
  }, [open, sub]);

  const has = (k: string) => keys.includes(k);
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  const RoleIcon = ROLE_ICON[user.role];

  const groups: Record<SubId, { label: string; icon: Icon; amber: boolean; hub?: string; items: SubItem[] }> = {
    workspace: {
      label: t.sidebar.groupWorkspace, icon: LayoutList, amber: false,
      items: ([
        { key: 'sites', href: '/dashboard/sites', icon: Globe, label: t.nav.sites },
        { key: 'submissions', href: '/dashboard/submissions', icon: Inbox, label: t.nav.submissions },
        { key: 'account', href: '/dashboard/account', icon: UserCircle, label: t.nav.account },
      ] as SubItem[]).filter((i) => has(i.key)),
    },
    staff: {
      label: t.sidebar.groupStaff, icon: ShieldCheck, amber: false, hub: '/dashboard/staff',
      items: ([
        { key: 'users', href: '/dashboard/users', icon: Users, label: t.nav.users },
        { key: 'allSites', href: '/dashboard/all-sites', icon: LayoutList, label: t.nav.allSites },
        { key: 'audit', href: '/dashboard/audit', icon: ScrollText, label: t.nav.audit },
      ] as SubItem[]).filter((i) => has(i.key)),
    },
    super: {
      label: t.sidebar.groupSuper, icon: Crown, amber: true, hub: '/dashboard/super',
      items: ([
        { key: 'organizations', href: '/dashboard/organizations', icon: Building2, label: t.nav.organizations },
        { key: 'database', href: '/dashboard/database', icon: Database, label: t.nav.database },
        { key: 'access', href: '/dashboard/access', icon: KeyRound, label: t.nav.access },
        { key: 'activity', href: '/dashboard/activity', icon: Activity, label: t.nav.activity },
        { key: 'trash', href: '/dashboard/trash', icon: Trash2, label: t.nav.trash },
        { key: 'control', href: '/dashboard/control', icon: Crown, label: t.nav.control },
        { key: 'studio', href: '/studio', icon: Film, label: t.nav.studio },
      ] as SubItem[]).filter((i) => has(i.key)),
    },
  };
  const parents = (Object.keys(groups) as SubId[]).filter((g) => groups[g].items.length > 0);
  const active = sub ? groups[sub] : null;
  // Sub-panel rows: the group's hub page first (like the sidebar drill-in).
  const subRows: SubItem[] = active
    ? [...(active.hub ? [{ key: 'hub', href: active.hub, icon: LayoutDashboard, label: t.nav.overview }] : []), ...active.items]
    : [];

  const row = 'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors';
  const mutedRow = `${row} text-muted-foreground hover:bg-muted hover:text-foreground`;
  const amberRow = `${row} text-amber-600 hover:bg-amber-500/10 dark:text-amber-400`;

  const linkRow = (i: SubItem, amber: boolean) => (
    <Link key={i.key} href={i.href} role="menuitem" onClick={() => setOpen(false)} className={amber ? amberRow : mutedRow}>
      <i.icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${amber ? 'text-amber-500' : ''}`} />
      <span className="truncate">{i.label}</span>
    </Link>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => { if (!open) setSub(null); setOpen(!open); }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.userMenu.label}
        title={t.userMenu.label}
        className={`group flex h-9 items-center gap-1.5 rounded-full border border-border bg-card/60 py-0.5 pl-0.5 pr-2 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 ${open ? 'border-primary/40 ring-2 ring-primary/20' : ''}`}
      >
        <span className="relative">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${AVATAR_BG[user.role]}`}>
            {initial}
          </span>
          <span className={`absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-background ${BADGE_BG[user.role]}`}>
            <RoleIcon className="h-2 w-2 text-white" />
          </span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            variants={menuV}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            {/* Identity header (stays put while levels slide underneath) */}
            <motion.div variants={itemV} className="relative overflow-hidden border-b border-border/60 p-4">
              <div className={`pointer-events-none absolute inset-x-0 -top-10 h-24 opacity-20 blur-2xl ${AVATAR_BG[user.role]}`} />
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t.userMenu.signedIn}</p>
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-lg ${AVATAR_BG[user.role]}`}>
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name || t.noName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <span className={`mt-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${CHIP_CLS[user.role]}`}>
                <RoleIcon className="h-3 w-3" /> {t.roles[user.role]}
              </span>
            </motion.div>

            {/* Two-level drill-in navigation */}
            {!gated && (
              <div
                className="relative overflow-hidden border-b border-border/60"
                style={{ height, transition: `height 500ms ${SPRING}` }}
              >
                {/* Main level */}
                <div
                  ref={mainRef}
                  className="absolute inset-x-0 top-0 p-1.5"
                  style={{
                    transform: sub ? 'translateX(-100%) scale(0.95)' : 'translateX(0) scale(1)',
                    opacity: sub ? 0 : 1,
                    pointerEvents: sub ? 'none' : 'auto',
                    transition: `all 500ms ${SPRING}`,
                  }}
                >
                  {has('overview') && (
                    <motion.div variants={itemV}>
                      {linkRow({ key: 'overview', href: '/dashboard', icon: LayoutDashboard, label: t.nav.overview }, false)}
                    </motion.div>
                  )}
                  {parents.map((g) => {
                    const grp = groups[g];
                    return (
                      <motion.div key={g} variants={itemV}>
                        <button type="button" role="menuitem" onClick={() => setSub(g)} className={grp.amber ? amberRow : mutedRow}>
                          <grp.icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${grp.amber ? 'text-amber-500' : ''}`} />
                          <span className="flex-1 truncate text-left">{grp.label}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                  <motion.div variants={itemV} className="my-1.5 h-px bg-border/60" />
                  <motion.div variants={itemV}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setOpen(false); window.dispatchEvent(new Event('cwk:open-palette')); }}
                      className={mutedRow}
                    >
                      <Search className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="flex-1 truncate text-left">{t.searchCommands}</span>
                      <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
                    </button>
                  </motion.div>
                  <motion.div variants={itemV}>
                    <a href="/" target="_blank" rel="noreferrer" role="menuitem" onClick={() => setOpen(false)} className={mutedRow}>
                      <ExternalLink className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="truncate">{t.cmd.openSite}</span>
                    </a>
                  </motion.div>
                </div>

                {/* Sub level — back button + the group's links, staggered in */}
                <div
                  ref={subRef}
                  className="absolute inset-x-0 top-0 p-1.5"
                  style={{
                    transform: sub ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
                    opacity: sub ? 1 : 0,
                    pointerEvents: sub ? 'auto' : 'none',
                    transition: `all 500ms ${SPRING}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSub(null)}
                    className="group/back mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    style={{
                      opacity: sub ? 1 : 0,
                      transform: sub ? 'translateX(0)' : 'translateX(20px)',
                      transition: `all 400ms ${SPRING} ${sub ? '100ms' : '0ms'}`,
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover/back:-translate-x-0.5" />
                    <span className="truncate">{active?.label ?? ''}</span>
                  </button>
                  {subRows.map((i, idx) => (
                    <div
                      key={i.key}
                      style={{
                        opacity: sub ? 1 : 0,
                        transform: sub ? 'translateX(0)' : 'translateX(30px)',
                        transition: `all 400ms ${SPRING} ${sub ? 150 + idx * 50 : 0}ms`,
                      }}
                    >
                      {linkRow(i, !!active?.amber)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Utilities while gated (no navigation to drill into) */}
            {gated && (
              <div className="border-b border-border/60 p-1.5">
                <motion.div variants={itemV}>
                  <a href="/" target="_blank" rel="noreferrer" role="menuitem" onClick={() => setOpen(false)} className={mutedRow}>
                    <ExternalLink className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="truncate">{t.cmd.openSite}</span>
                  </a>
                </motion.div>
              </div>
            )}

            {/* Sign out — anchored below the sliding levels */}
            <div className="p-1.5">
              <motion.div variants={itemV}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setOpen(false); onLogout(); }}
                  className={`${row} text-red-500 hover:bg-red-500/10`}
                >
                  <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                  <span className="truncate">{t.logout}</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
