// Shared server-side renderer for tenant sites: theme + chrome + block tree.
// Used by /s/[site] (slug routing) and /d/[domain] (custom domains).

import { getTheme, DEFAULT_THEME } from '@/lib/themes';
import { ThemeStyle } from '@/components/theme-style';
import { SiteChrome } from '@/components/builder/site-chrome';
import { RenderNode } from '@/components/builder/render-node';
import { EditBridge } from '@/components/builder/edit-bridge';
import { SiteAuthProvider, SiteAuthForm, SiteAccount } from '@/components/builder/site-auth-blocks';
import type { BuilderDoc, BuilderPage } from '@/lib/builder/types';
import Link from 'next/link';

export function findPageByPath(doc: BuilderDoc, slug: string[]): BuilderPage | null {
  const target = (slug ?? []).join('/');
  return doc.pages.find((p) => p.path === target) ?? null;
}

/** Reserved built-in auth paths (per tenant), not editable in the builder. */
export const AUTH_PATHS = new Set(['login', 'register', 'account']);

/** Beautiful, non-editable login / register / account page rendered inside the
 *  tenant's own chrome + theme. base = doc.base ('/s/slug' or '' for domains). */
export function SiteAuthPage({ doc, mode }: { doc: BuilderDoc; mode: 'login' | 'register' | 'account' }) {
  const theme = doc.themeId && doc.themeId !== 'auto' ? getTheme(doc.themeId) : DEFAULT_THEME;
  const base = doc.base === undefined ? '/site' : doc.base || '';
  return (
    <>
      <ThemeStyle theme={theme} />
      <SiteAuthProvider siteId={doc.siteId ?? ''}>
        <SiteChrome doc={doc}>
          <section className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col items-center justify-center px-6 py-16">
            {mode === 'account' ? (
              <SiteAccount />
            ) : (
              <>
                <SiteAuthForm mode={mode} />
                <p className="mt-4 text-sm text-muted-foreground">
                  {mode === 'login' ? (
                    <>Нет аккаунта? <Link href={`${base}/register`} className="font-medium text-primary hover:underline">Регистрация</Link></>
                  ) : (
                    <>Уже есть аккаунт? <Link href={`${base}/login`} className="font-medium text-primary hover:underline">Войти</Link></>
                  )}
                </p>
              </>
            )}
          </section>
        </SiteChrome>
      </SiteAuthProvider>
    </>
  );
}

export function SiteRenderer({ doc, page, edit }: { doc: BuilderDoc; page: BuilderPage; edit?: boolean }) {
  const theme = doc.themeId && doc.themeId !== 'auto' ? getTheme(doc.themeId) : DEFAULT_THEME;
  return (
    <>
      <ThemeStyle theme={theme} />
      {edit && <EditBridge />}
      <SiteAuthProvider siteId={doc.siteId ?? ''}>
        <SiteChrome doc={doc}>
          {page.blocks.map((node) => (
            <RenderNode key={node.id} node={node} />
          ))}
        </SiteChrome>
      </SiteAuthProvider>
    </>
  );
}
