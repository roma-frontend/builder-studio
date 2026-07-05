'use client';

import { useEffect } from 'react';

// Rendered only in preview edit mode (?edit=1). Turns clicks on any element
// carrying data-nid into a postMessage to the parent editor, so clicking an
// element in the live preview selects it in the builder. Also suppresses link
// navigation while editing and shows a hover outline.
export function EditBridge() {
  useEffect(() => {
    document.body.classList.add('builder-edit');
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest('[data-nid]');
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      window.parent?.postMessage({ source: 'builder-preview', type: 'select', id: el.getAttribute('data-nid') }, '*');
    };
    // capture phase so we intercept before links/buttons act
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.body.classList.remove('builder-edit');
    };
  }, []);
  return null;
}
