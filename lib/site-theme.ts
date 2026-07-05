import siteConfig from '@/data/site.json';
import mediaData from '@/data/media.json';
import { getTheme, pickTheme, DEFAULT_THEME, type Theme } from '@/lib/themes';

/**
 * The site-wide theme saved from the Studio (data/site.json). For content-less
 * pages (presets index, vitals, themes gallery) we can't derive from content,
 * so `auto` resolves to the default theme.
 */
export function siteTheme(): Theme {
  const id = (siteConfig as { theme?: string }).theme ?? 'auto';
  return id !== 'auto' ? getTheme(id) : DEFAULT_THEME;
}

/**
 * The theme actually rendered on the homepage: saved site theme, or — when set
 * to `auto` — the palette derived from the current content. Shared so the
 * homepage and the themes gallery stay visually in sync.
 */
export function activeSiteTheme(): Theme {
  const id = (siteConfig as { theme?: string }).theme ?? 'auto';
  if (id && id !== 'auto') return getTheme(id);
  const media = mediaData as Array<{ title?: string; subtitle?: string; prompt?: string }>;
  const brief = media.map((m) => `${m.title ?? ''} ${m.subtitle ?? ''} ${m.prompt ?? ''}`).join(' ');
  return pickTheme(brief);
}
