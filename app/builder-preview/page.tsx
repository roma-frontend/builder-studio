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
  previewDark?: boolean;
}

export default function BuilderPreview() {
  const [state, setState] = useState<Incoming | null>(null);

  useEffect(() => {
    if (state?.previewDark === false) document.documentElement.classList.remove('dark');
    else document.documentElement.classList.add('dark');
  }, [state?.previewDark]);
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

    // Drag a palette element from the editor directly onto the page, snapping
    // to the nearest container so it joins the layout/grid correctly.
    let lastTarget: HTMLElement | null = null;
    const clearTarget = () => {
      if (lastTarget) lastTarget.classList.remove('b-drop-target');
      lastTarget = null;
    };
    const dropZone = (t: HTMLElement | null): HTMLElement | null =>
      t?.closest('[data-container]') ?? t?.closest('[data-nid]') ?? null;
    const onDragOver = (ev: DragEvent) => {
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
      const zone = dropZone(ev.target as HTMLElement);
      if (zone !== lastTarget) {
        clearTarget();
        lastTarget = zone;
        zone?.classList.add('b-drop-target');
      }
    };
    const onDrop = (ev: DragEvent) => {
      const type = ev.dataTransfer?.getData('text/builder-type');
      clearTarget();
      if (!type) return;
      ev.preventDefault();
      const zone = dropZone(ev.target as HTMLElement);
      window.parent?.postMessage(
        { source: 'builder-preview', type: 'drop', nodeType: type, targetId: zone?.getAttribute('data-nid') ?? null },
        '*',
      );
    };
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('message', onMsg);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
      clearTarget();
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
