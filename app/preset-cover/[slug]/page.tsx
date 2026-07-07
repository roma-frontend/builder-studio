import { notFound } from 'next/navigation';
import { getPreset } from '@/lib/presets';
import { getTheme } from '@/lib/themes';
import { oklchToCss, oklchToRgb } from '@/lib/oklch';

// Designed "cover" mockup for a preset: the real landing rendered inside a
// browser window, floating on a theme-colored gradient with soft glows and a
// big shadow — the Envato/Figma-style hero image. Meant to be screenshotted at
// 1600×1000 (see scripts/preset-shots.mjs, MODE=cover). Standalone: no site
// chrome, fills the viewport exactly.
export const dynamic = 'force-dynamic';

function darken([r, g, b]: [number, number, number], k: number): string {
  return `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
}

export default async function PresetCover({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ scheme?: string }> }) {
  const { slug } = await params;
  const { scheme: schemeParam } = await searchParams;
  const scheme = schemeParam === 'light' ? 'light' : 'dark';
  const preset = getPreset(slug);
  if (!preset) notFound();
  const theme = getTheme(preset.theme);
  const pal = scheme === 'light' ? theme.light : theme.dark;

  // The colored backdrop always uses the vivid primary (Envato-cover vibe); the
  // browser chrome + the embedded landing flip with the chosen scheme.
  const primary = oklchToCss(theme.dark.primary);
  const rgb = oklchToRgb(...(theme.dark.primary.split(/\s+/).map(Number) as [number, number, number]));
  const mid = darken(rgb, 0.5);
  const deep = darken(rgb, 0.22);
  const cardBg = oklchToCss(pal.card);
  const light = scheme === 'light';
  const border = light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.14)';
  const barBg = light ? 'rgba(0,0,0,0.045)' : 'rgba(0,0,0,0.25)';
  const pill = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)';
  const pillFg = light ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';

  // iframe renders a desktop width then scales to fill the window content box.
  const RENDER_W = 1280;
  const CONTENT_W = 1160;
  const scale = CONTENT_W / RENDER_W;
  const CONTENT_H = 660;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${primary} 0%, ${mid} 55%, ${deep} 100%)`,
      }}
    >
      {/* Soft light glows */}
      <div style={{ position: 'absolute', top: '-25%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.35), transparent 60%)' }} />
      <div style={{ position: 'absolute', bottom: '-30%', right: '-8%', width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 62%)' }} />

      {/* Browser window */}
      <div
        style={{
          width: CONTENT_W,
          borderRadius: 18,
          overflow: 'hidden',
          background: cardBg,
          border: `1px solid ${border}`,
          boxShadow: '0 60px 120px -30px rgba(0,0,0,0.55), 0 20px 50px -20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 46, padding: '0 18px', background: barBg, borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 420, width: '100%', height: 26, borderRadius: 999, background: pill, color: pillFg, fontSize: 12, justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
              <span style={{ opacity: 0.7 }}>🔒</span> {slug}.builder.studio
            </div>
          </div>
          <div style={{ width: 44 }} />
        </div>

        {/* Live preset, scaled */}
        <div style={{ position: 'relative', width: CONTENT_W, height: CONTENT_H, overflow: 'hidden', background: cardBg }}>
          <iframe
            src={`/presets/${slug}`}
            title={slug}
            scrolling="no"
            style={{ position: 'absolute', top: 0, left: 0, width: RENDER_W, height: CONTENT_H / scale, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          />
        </div>
      </div>
    </div>
  );
}
