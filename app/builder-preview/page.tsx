'use client';

import { useEffect, useState } from 'react';
import { getTheme, DEFAULT_THEME } from '@/lib/themes';
import { ThemeStyle } from '@/components/theme-style';
import { SiteChrome } from '@/components/builder/site-chrome';
import { RenderNode } from '@/components/builder/render-node';
import type { BuilderDoc } from '@/lib/builder/types';

// Isolated live preview. Receives the full editor state via postMessage and
// re-renders instantly (no save needed). Clicking an element selects it in the
// editor; the selected element gets a highlight outline.
interface Incoming {
  source: 'builder-editor';
  doc: BuilderDoc;
  pageId: string;
  selectedId: string | null;
}

export default function BuilderPreview() {
  const [state, setState] = useState<Incoming | null>(null);

  useEffect(() => {
    document.body.classList.add('builder-edit');
    const onMsg = (e: MessageEvent) => {
      if (e.data?.source === 'builder-editor') setState(e.data as Incoming);
    };
    window.addEventListener('message', onMsg);
    // tell the editor we're ready to receive state
    window.parent?.postMessage({ source: 'builder-preview', type: 'ready' }, '*');

    const onClick = (ev: MouseEvent) => {
      const el = (ev.target as HTMLElement | null)?.closest('[data-nid]');
      if (!el) return;
      ev.preventDefault();
      ev.stopPropagation();
      window.parent?.postMessage({ source: 'builder-preview', type: 'select', id: el.getAttribute('data-nid') }, '*');
    };
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('message', onMsg);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  if (!state) {
    return <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">Загрузка предпросмотра…</div>;
  }

  const { doc, pageId, selectedId } = state;
  const page = doc.pages.find((p) => p.id === pageId) ?? doc.pages[0];
  const theme = doc.themeId && doc.themeId !== 'auto' ? getTheme(doc.themeId) : DEFAULT_THEME;

  return (
    <>
      <ThemeStyle theme={theme} />
      {selectedId && (
        <style
          dangerouslySetInnerHTML={{
            __html: `[data-nid="${selectedId}"]{outline:2px solid var(--primary)!important;outline-offset:2px;border-radius:2px}`,
          }}
        />
      )}
      {page ? (
        <SiteChrome doc={doc}>
          {page.blocks.map((node) => (
            <RenderNode key={node.id} node={node} />
          ))}
        </SiteChrome>
      ) : (
        <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">Нет страницы</div>
      )}
    </>
  );
}
