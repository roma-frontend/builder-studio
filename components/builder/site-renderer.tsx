// Shared server-side renderer for tenant sites: theme + chrome + block tree.
// Used by /s/[site] (slug routing) and /d/[domain] (custom domains).

import { getTheme, DEFAULT_THEME } from '@/lib/themes';
import { ThemeStyle } from '@/components/theme-style';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SiteChrome } from '@/components/builder/site-chrome';
import { RenderNode } from '@/components/builder/render-node';
import { EditBridge } from '@/components/builder/edit-bridge';
import { SiteAuthProvider } from '@/components/builder/site-auth-blocks';
import { SiteBaseProvider, CourseDetail, DocumentDetail, MaterialDetail } from '@/components/builder/site-content-blocks';
import { SiteAuthClient } from '@/components/builder/site-auth-page';
import { getLocale } from '@/lib/i18n';
import { siteRt } from '@/lib/site-runtime-dict';
import { translateNodeAuto } from '@/lib/auto-translate';
import type { BuilderDoc, BuilderPage } from '@/lib/builder/types';

export function findPageByPath(doc: BuilderDoc, slug: string[]): BuilderPage | null {
  const target = (slug ?? []).join('/');
  return doc.pages.find((p) => p.path === target) ?? null;
}

/** Reserved built-in auth paths (per tenant), not editable in the builder. */
export const AUTH_PATHS = new Set(['login', 'register', 'account', 'reset']);

/** Reserved member-content detail paths: /<resource>/<id>. Rendered by
 *  SiteResourcePage inside the tenant chrome; gated to approved members. */
export const RESOURCE_PATHS = new Set(['course', 'document', 'material']);

/** Detail page for a single member-content item (course/document/material).
 *  Wrapped in the tenant chrome + auth/base context; content itself is
 *  member-gated by the /api/site-auth resource it fetches. */
export async function SiteResourcePage({ doc, resource, id }: { doc: BuilderDoc; resource: string; id: string }) {
  const t = siteRt(await getLocale());
  const base = doc.base === undefined ? '/site' : doc.base || '';
  const detail =
    resource === 'course' ? <CourseDetail id={id} />
    : resource === 'document' ? <DocumentDetail id={id} />
    : <MaterialDetail id={id} />;
  return (
    <>
      <ThemeStyle theme={doc.themeId && doc.themeId !== 'auto' ? getTheme(doc.themeId) : DEFAULT_THEME} />
      <SiteAuthProvider siteId={doc.siteId ?? ''}>
        <SiteBaseProvider base={base}>
          <SiteChrome doc={doc} t={t}>
            <section className="py-12">{detail}</section>
          </SiteChrome>
        </SiteBaseProvider>
      </SiteAuthProvider>
    </>
  );
}

/** Beautiful, non-editable login / register / account page — same construction
 *  as the platform auth (glass Shell), themed with the tenant's theme and wired
 *  to the isolated per-site auth. Standalone (no site chrome). */
export function SiteAuthPage({ doc, mode }: { doc: BuilderDoc; mode: 'login' | 'register' | 'account' | 'reset' }) {
  const theme = doc.themeId && doc.themeId !== 'auto' ? getTheme(doc.themeId) : DEFAULT_THEME;
  const base = doc.base === undefined ? '/site' : doc.base || '';
  return (
    <>
      {/* The account cabinet mirrors the platform admin/superadmin dashboards:
          it uses the neutral platform palette (globals.css) rather than the
          tenant's brand theme. Login/register/reset stay on-brand. */}
      {mode !== 'account' && <ThemeStyle theme={theme} />}
      <SiteAuthProvider siteId={doc.siteId ?? ''}>
        <SiteAuthClient siteId={doc.siteId ?? ''} base={base} brand={doc.brand} mode={mode} />
      </SiteAuthProvider>
    </>
  );
}

export async function SiteRenderer({ doc, page, edit, platformChrome }: { doc: BuilderDoc; page: BuilderPage; edit?: boolean; platformChrome?: boolean }) {
  const theme = doc.themeId && doc.themeId !== 'auto' ? getTheme(doc.themeId) : DEFAULT_THEME;
  const locale = await getLocale();
  const t = siteRt(locale);
  const base = doc.base === undefined ? '/site' : doc.base || '';
  const translated = await Promise.all(page.blocks.map((node) => translateNodeAuto(node, locale)));
  const blocks = translated.map((node) => (
    <RenderNode key={node.id} node={node} t={t} />
  ));
  return (
    <>
      <ThemeStyle theme={theme} />
      {edit && <EditBridge />}
      <SiteAuthProvider siteId={doc.siteId ?? ''}>
        <SiteBaseProvider base={base}>
          {platformChrome ? (
            // The platform landing (/) keeps the real site header/footer — only
            // the sections between them come from the builder document.
            <main className="min-h-dvh">
              <SiteHeader />
              {blocks}
              <SiteFooter />
            </main>
          ) : (
            <SiteChrome doc={doc} t={t}>
              {blocks}
            </SiteChrome>
          )}
        </SiteBaseProvider>
      </SiteAuthProvider>
    </>
  );
}
