// Preset catalog: 6 ready-made, full-page landing compositions — one per
// industry, each rendered in its own theme for a distinct look. Purely a
// showcase/starting point: every control is a link (see PresetLanding), no
// forms or real logic. Text lives in lib/preset-demo-dict.ts (ru/en/hy); this
// file holds the non-localized design config (theme, icons, gradients, order).

export type PresetSection = 'stats' | 'logos' | 'features' | 'showcase' | 'gallery' | 'offer' | 'testimonials';

export interface PresetDef {
  slug: string;
  /** Theme id applied to the whole page (unique palette / font / motion). */
  theme: string;
  /** Lucide icon keys (mapped in PresetLanding) for the three feature cards. */
  featureIcons: [string, string, string];
  /** Tailwind gradient for the index card cover + hero accent. */
  cover: string;
  /** Which optional sections render, in order (hero + final CTA are always on). */
  sections: PresetSection[];
  /** Style of the "offer" block: pricing tiers, a menu, or a schedule. */
  offerStyle: 'pricing' | 'menu' | 'schedule';
}

export const PRESETS: PresetDef[] = [
  {
    slug: 'launch',
    theme: 'tech-saas',
    featureIcons: ['zap', 'shield', 'gauge'],
    cover: 'from-indigo-500 via-violet-500 to-sky-400',
    sections: ['logos', 'features', 'showcase', 'offer', 'testimonials'],
    offerStyle: 'pricing',
  },
  {
    slug: 'roast',
    theme: 'editorial-coffee',
    featureIcons: ['coffee', 'leaf', 'heart'],
    cover: 'from-amber-700 via-orange-600 to-yellow-500',
    sections: ['showcase', 'gallery', 'offer', 'testimonials'],
    offerStyle: 'menu',
  },
  {
    slug: 'arena',
    theme: 'sport-dynamic',
    featureIcons: ['dumbbell', 'flame', 'trophy'],
    cover: 'from-red-600 via-rose-500 to-orange-500',
    sections: ['stats', 'features', 'offer', 'testimonials'],
    offerStyle: 'schedule',
  },
  {
    slug: 'studio',
    theme: 'modern-clean',
    featureIcons: ['pen-tool', 'layers', 'sparkles'],
    cover: 'from-blue-500 via-cyan-400 to-slate-300',
    sections: ['logos', 'gallery', 'showcase', 'testimonials'],
    offerStyle: 'pricing',
  },
  {
    slug: 'maison',
    theme: 'luxury-dark',
    featureIcons: ['gem', 'wine', 'star'],
    cover: 'from-yellow-600 via-amber-500 to-stone-700',
    sections: ['showcase', 'gallery', 'offer', 'testimonials'],
    offerStyle: 'menu',
  },
  {
    slug: 'pulse',
    theme: 'neon-night',
    featureIcons: ['music', 'zap', 'ticket'],
    cover: 'from-fuchsia-500 via-purple-500 to-indigo-600',
    sections: ['stats', 'gallery', 'offer', 'testimonials'],
    offerStyle: 'schedule',
  },
];

export function getPreset(slug: string): PresetDef | undefined {
  return PRESETS.find((p) => p.slug === slug);
}
