import 'server-only';
import { getLandingSite } from '@/lib/landing-site';
import { parseDoc } from '@/lib/sites';
import { getTheme, type Theme } from '@/lib/themes';
import { activeSiteTheme } from '@/lib/site-theme';
import { ThemeStyle } from '@/components/theme-style';

// Single source of truth for the platform-wide palette: the theme chosen and
// PUBLISHED in the Studio (the landing site's doc.themeId). Applied on every
// platform surface — landing, themes gallery, presets, vitals, legal and the
// whole dashboard — so switching the theme in the builder re-skins everything.
// Falls back to the site-wide/auto theme when the landing has no explicit theme
// (or the DB isn't reachable).
export function platformThemeResolved(): Theme {
  try {
    const site = getLandingSite();
    const id = site ? parseDoc(site.publishedDoc)?.themeId : undefined;
    if (id && id !== 'auto') return getTheme(id);
  } catch {
    /* no DB / no landing yet — fall back below */
  }
  return activeSiteTheme();
}

/** Drop-in <ThemeStyle> that paints the platform-wide theme. */
export function PlatformThemeStyle({ id }: { id?: string }) {
  return <ThemeStyle theme={platformThemeResolved()} id={id} />;
}
