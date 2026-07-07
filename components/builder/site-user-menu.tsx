'use client';

// Header avatar + account menu for the tenant member cabinet
// (components/builder/site-account.tsx). Mirrors the platform dashboard's
// UserMenu: a two-level drill-in dropdown (hr-project sidebar pattern) —
// parent rows slide the main level out to the left and reveal a sub-panel
// with the group's tabs, staggered in with a springy cubic-bezier; the
// container height animates between levels. Tabs are state-driven, so items
// call onNavigate instead of rendering links.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  User, Shield, Settings, LogOut, Loader2, Bell, FileText, Library,
  GraduationCap, LayoutDashboard, LayoutList, ExternalLink, FolderOpen,
  ChevronDown, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { siteAccountDict } from '@/lib/site-account-dict';

type TabId = 'overview' | 'profile' | 'materials' | 'courses' | 'documents' | 'notifications' | 'security' | 'activity' | 'settings';
type Icon = React.ComponentType<{ className?: string }>;
type SubId = 'cabinet' | 'account';

const GROUP_TABS: Record<SubId, { id: TabId; icon: Icon }[]> = {
  cabinet: [
    { id: 'materials', icon: Library },
    { id: 'courses', icon: GraduationCap },
    { id: 'documents', icon: FolderOpen },
    { id: 'notifications', icon: Bell },
    { id: 'activity', icon: FileText },
  ],
  account: [
    { id: 'profile', icon: User },
    { id: 'security', icon: Shield },
    { id: 'settings', icon: Settings },
  ],
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

function initials(name: string, email: string) {
  const n = name.trim();
  if (n) return n.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  return (email[0] ?? '?').toUpperCase();
}

export function SiteUserMenu({ name, email, color, unread, base, onNavigate, onLogout, loggingOut }: {
  name: string;
  email: string;
  /** The member's chosen avatar color (hex from the profile tab). */
  color: string;
  unread: number;
  base: string;
  onNavigate: (tab: TabId) => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const t = siteAccountDict(useLocale().locale);
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

  const go = (tab: TabId) => { setOpen(false); onNavigate(tab); };
  const groupLabel: Record<SubId, string> = { cabinet: t.sidebar.groupWorkspace, account: t.sidebar.groupAccount };
  const groupIcon: Record<SubId, Icon> = { cabinet: LayoutList, account: Settings };

  const row = 'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors';
  const mutedRow = `${row} text-muted-foreground hover:bg-muted hover:text-foreground`;

  const unreadBadge = (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{unread}</span>
  );

  const tabRow = ({ id, icon: TabIcon }: { id: TabId; icon: Icon }) => (
    <button type="button" role="menuitem" onClick={() => go(id)} className={mutedRow}>
      <TabIcon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
      <span className="flex-1 truncate text-left">{t.tabs[id]}</span>
      {id === 'notifications' && unread > 0 && unreadBadge}
    </button>
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
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm" style={{ background: color }}>
            {initials(name, email)}
          </span>
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}
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
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 opacity-20 blur-2xl" style={{ background: color }} />
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t.userMenu.signedIn}</p>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-lg" style={{ background: color }}>
                  {initials(name, email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{name || t.noName}</p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
              </div>
              <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <User className="h-3 w-3" /> {t.userMenu.member}
              </span>
            </motion.div>

            {/* Two-level drill-in navigation */}
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
                <motion.div variants={itemV}>
                  {tabRow({ id: 'overview', icon: LayoutDashboard })}
                </motion.div>
                {(Object.keys(GROUP_TABS) as SubId[]).map((g) => {
                  const GroupIcon = groupIcon[g];
                  const showBadge = g === 'cabinet' && unread > 0;
                  return (
                    <motion.div key={g} variants={itemV}>
                      <button type="button" role="menuitem" onClick={() => setSub(g)} className={mutedRow}>
                        <GroupIcon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                        <span className="flex-1 truncate text-left">{groupLabel[g]}</span>
                        {showBadge && unreadBadge}
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
                      </button>
                    </motion.div>
                  );
                })}
                <motion.div variants={itemV} className="my-1.5 h-px bg-border/60" />
                <motion.div variants={itemV}>
                  <Link href={base || '/'} role="menuitem" onClick={() => setOpen(false)} className={mutedRow}>
                    <ExternalLink className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="truncate">{t.toSite}</span>
                  </Link>
                </motion.div>
              </div>

              {/* Sub level — back button + the group's tabs, staggered in */}
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
                  <span className="truncate">{sub ? groupLabel[sub] : ''}</span>
                </button>
                {(sub ? GROUP_TABS[sub] : []).map((tabDef, idx) => (
                  <div
                    key={tabDef.id}
                    style={{
                      opacity: sub ? 1 : 0,
                      transform: sub ? 'translateX(0)' : 'translateX(30px)',
                      transition: `all 400ms ${SPRING} ${sub ? 150 + idx * 50 : 0}ms`,
                    }}
                  >
                    {tabRow(tabDef)}
                  </div>
                ))}
              </div>
            </div>

            {/* Log out — anchored below the sliding levels */}
            <div className="p-1.5">
              <motion.div variants={itemV}>
                <button
                  type="button"
                  role="menuitem"
                  disabled={loggingOut}
                  onClick={() => { setOpen(false); onLogout(); }}
                  className={`${row} text-red-500 hover:bg-red-500/10 disabled:opacity-60`}
                >
                  {loggingOut
                    ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    : <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />}
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
