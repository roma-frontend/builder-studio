import siteConfig from '@/data/site.json';
import { getTheme, DEFAULT_THEME, type Theme } from '@/lib/themes';

/**
 * The site-wide theme saved from the Studio (data/site.json). For content-less
 * pages (presets index, vitals, themes gallery) we can't derive from content,
 * so `auto` resolves to the default theme.
 */
export function siteTheme(): Theme {
  const id = (siteConfig as { theme?: string }).theme ?? 'auto';
  return id !== 'auto' ? getTheme(id) : DEFAULT_THEME;
}
