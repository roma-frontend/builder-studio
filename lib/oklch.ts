// Convert the theme palette's `oklch(...)` component strings into plain
// rgb()/rgba() that satori (next/og ImageResponse) understands — it has no
// oklch parser. Values come in the "L C H" form used across lib/themes.ts,
// optionally with an alpha suffix ("1 0 0 / 0.1").
//
// Math: OKLCH → OKLab → linear sRGB → gamma-encoded sRGB (Björn Ottosson).

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function gamma(x: number): number {
  x = clamp01(x);
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

/** OKLCH components (L 0–1, C, H degrees) → [r,g,b] 0–255. */
export function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [Math.round(gamma(r) * 255), Math.round(gamma(g) * 255), Math.round(gamma(bl) * 255)];
}

/**
 * Parse a theme component string ("L C H" or "L C H / A") to a CSS color.
 * Unknown/blank input falls back to transparent so a bad token never throws.
 */
export function oklchToCss(triplet: string | undefined): string {
  if (!triplet) return 'transparent';
  const [main, alphaPart] = triplet.split('/');
  const nums = main.trim().split(/\s+/).map(Number);
  if (nums.length < 3 || nums.some((n) => Number.isNaN(n))) return 'transparent';
  const [L, C, H] = nums;
  const [r, g, b] = oklchToRgb(L, C, H);
  const alpha = alphaPart !== undefined ? Number(alphaPart.trim()) : 1;
  return Number.isFinite(alpha) && alpha < 1
    ? `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`
    : `rgb(${r}, ${g}, ${b})`;
}
