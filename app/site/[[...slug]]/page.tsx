import { notFound } from 'next/navigation';
import { loadDoc, findPage } from '@/lib/builder/store';
import { getTheme, DEFAULT_THEME } from '@/lib/themes';
import { ThemeStyle } from '@/components/theme-style';
import { SiteChrome } from '@/components/builder/site-chrome';
import { RenderNode } from '@/components/builder/render-node';
import { EditBridge } from '@/components/builder/edit-bridge';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const doc = await loadDoc();
  const { page } = findPage(doc, slug ?? []);
  return {
    title: page ? `${page.title} — ${doc.brand}` : doc.brand,
    description: page?.description || undefined,
  };
}

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const { edit } = await searchParams;
  const doc = await loadDoc();
  const { page } = findPage(doc, slug ?? []);
  if (!page) notFound();

  const theme = doc.themeId && doc.themeId !== 'auto' ? getTheme(doc.themeId) : DEFAULT_THEME;

  return (
    <>
      <ThemeStyle theme={theme} />
      {edit === '1' && <EditBridge />}
      <SiteChrome doc={doc}>
        {page.blocks.map((node) => (
          <RenderNode key={node.id} node={node} />
        ))}
      </SiteChrome>
    </>
  );
}
