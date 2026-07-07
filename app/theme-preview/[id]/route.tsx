import { ImageResponse } from 'next/og';
import { getTheme, type DisplayFont } from '@/lib/themes';
import { oklchToCss } from '@/lib/oklch';

// Dynamic, on-brand PNG preview for a theme — a bold "poster" rendered from the
// theme's own palette. Open /theme-preview/<id> to view or save it.
//
// Query params:
//   ?scheme=light|dark   (default dark — more dramatic)
//   ?w=<px>&h=<px>       (custom size; clamped to sane bounds)
// e.g. /theme-preview/neon-night?scheme=light&w=1200&h=630
export const runtime = 'nodejs';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ── Real display fonts (Playfair / Montserrat / Inter), fetched from Google and
// cached in-process. The v1 CSS API with an IE9 UA serves woff (satori can't
// read woff2, which the v2 API always returns). Any failure → null, and the
// poster falls back to the system font. ──
const FONT_CACHE = new Map<string, ArrayBuffer | null>();
async function gfont(family: string): Promise<ArrayBuffer | null> {
  if (FONT_CACHE.has(family)) return FONT_CACHE.get(family)!;
  let out: ArrayBuffer | null = null;
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css?family=${family}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)' },
      })
    ).text();
    const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)\s*format\('(?:woff|truetype|opentype)'\)/)?.[1];
    if (url) {
      const r = await fetch(url);
      if (r.ok) out = await r.arrayBuffer();
    }
  } catch {
    out = null;
  }
  FONT_CACHE.set(family, out);
  return out;
}

const DISPLAY_QUERY: Record<DisplayFont, string> = {
  serif: 'Playfair+Display:800',
  grotesk: 'Montserrat:800',
  sans: 'Inter:800',
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const theme = getTheme(id);
  const url = new URL(req.url);
  const scheme = url.searchParams.get('scheme') === 'light' ? 'light' : 'dark';
  const p = scheme === 'light' ? theme.light : theme.dark;
  const width = clamp(Number(url.searchParams.get('w')) || 1320, 400, 2400);
  const height = clamp(Number(url.searchParams.get('h')) || 880, 300, 1600);

  const bg = oklchToCss(p.background);
  const fg = oklchToCss(p.foreground);
  const primary = oklchToCss(p.primary);
  const pfg = oklchToCss(p['primary-foreground']);
  const card = oklchToCss(p.card);
  const muted = oklchToCss(p.muted);
  const mfg = oklchToCss(p['muted-foreground']);
  const border = oklchToCss(p.border);
  const [pr, pg, pb] = (primary.match(/\d+/g) ?? ['120', '120', '255']).map(Number);
  const glow = (a: number) => `rgba(${pr}, ${pg}, ${pb}, ${a})`;
  const glowStrong = scheme === 'light' ? 0.38 : 0.55;

  const [displayBuf, uiBuf] = await Promise.all([gfont(DISPLAY_QUERY[theme.fontDisplay]), gfont('Inter:600')]);
  const fonts: { name: string; data: ArrayBuffer; weight: 600 | 800; style: 'normal' }[] = [];
  if (displayBuf) fonts.push({ name: 'BSDisplay', data: displayBuf, weight: 800, style: 'normal' });
  if (uiBuf) fonts.push({ name: 'BSUI', data: uiBuf, weight: 600, style: 'normal' });
  const displayFF = displayBuf ? 'BSDisplay' : 'sans-serif';
  const uiFF = uiBuf ? 'BSUI' : 'sans-serif';

  const swatches: [string, string][] = [
    ['primary', primary],
    ['card', card],
    ['muted', muted],
    ['text', fg],
    ['border', border],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: 72,
          background: `linear-gradient(140deg, ${bg} 0%, ${card} 100%)`,
          color: fg,
          fontFamily: uiFF,
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -260, right: -180, width: 720, height: 720, display: 'flex', background: `radial-gradient(circle at center, ${glow(glowStrong)} 0%, ${glow(0)} 62%)` }} />
        <div style={{ position: 'absolute', bottom: -300, left: -200, width: 640, height: 640, display: 'flex', background: `radial-gradient(circle at center, ${glow(glowStrong * 0.5)} 0%, ${glow(0)} 65%)` }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', background: primary }} />
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>Builder Studio</div>
          </div>
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase', color: mfg }}>{theme.id}</div>
        </div>

        {/* Label + descriptors */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 56, zIndex: 1 }}>
          <div style={{ display: 'flex', fontFamily: displayFF, fontSize: 122, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>{theme.label}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
            {[`${theme.fontDisplay} type`, `${theme.motion} motion`, `radius ${theme.radius}`].map((tag) => (
              <div key={tag} style={{ display: 'flex', fontSize: 22, fontWeight: 600, color: pfg, background: primary, borderRadius: 999, padding: '8px 20px' }}>{tag}</div>
            ))}
          </div>
        </div>

        {/* Mock site card */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', zIndex: 1, background: card, border: `1px solid ${border}`, borderRadius: 22, padding: 34, gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', width: 360, height: 26, borderRadius: 8, background: fg, opacity: 0.9 }} />
              <div style={{ display: 'flex', width: 260, height: 16, borderRadius: 8, background: mfg }} />
            </div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: pfg, background: primary, borderRadius: 12, padding: '14px 30px' }}>Get started</div>
          </div>
          <div style={{ display: 'flex', gap: 26, marginTop: 6 }}>
            {swatches.map(([name, val]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: val, border: `1px solid ${border}`, display: 'flex' }} />
                <div style={{ display: 'flex', fontSize: 18, color: mfg }}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width, height, ...(fonts.length ? { fonts } : {}) },
  );
}
