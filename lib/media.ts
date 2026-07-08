/** One media clip, as written by the pipeline into data/media.json. */
export interface MediaEntry {
  id: string;
  title: string;
  section: 'hero' | 'background' | 'card';
  prompt?: string;
  /** Cinematic style preset id used to generate this clip. */
  style?: string;
  /** Negative prompt passed to the model. */
  negativePrompt?: string;
  /** Clip retains an audio track (pipeline --audio) — enables the sound toggle. */
  sound?: boolean;
  src: string;
  /** Optional MP4 (H.264) fallback for browsers without VP9/WebM. */
  srcMp4?: string;
  poster?: string;
  /** Optional dark-theme variant (shown in dark mode when set). */
  srcDark?: string;
  posterDark?: string;
  aspectRatio?: string;
  createdAt?: string;
  /** Optional CTA for hero/background sections. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Optional subtitle/eyebrow text. */
  subtitle?: string;
  /** Optional link — when set, the whole card becomes clickable. */
  href?: string;
}

/** Known preset slugs (see lib/presets.ts). Includes a common misspelling
 *  ("mainson") so filenames like "Mainson-dark.webp" still resolve to maison. */
const PRESET_SLUG_ALIASES: Record<string, string> = {
  launch: 'launch',
  roast: 'roast',
  arena: 'arena',
  studio: 'studio',
  maison: 'maison',
  mainson: 'maison',
  pulse: 'pulse',
};

/**
 * Derive a `/presets/<slug>` link from any of the given media URLs by matching
 * a known preset name in the filename (e.g. ".../Pulse-dark.webp" → /presets/pulse).
 * Returns undefined when no preset name is found.
 */
export function presetHrefFromSources(...sources: (string | undefined)[]): string | undefined {
  for (const src of sources) {
    if (!src) continue;
    const name = src.toLowerCase();
    for (const [alias, slug] of Object.entries(PRESET_SLUG_ALIASES)) {
      if (name.includes(alias)) return `/presets/${slug}`;
    }
  }
  return undefined;
}

/** Pad a list to at least `n` items by cycling, giving each a unique id. */
export function padEntries(entries: MediaEntry[], n: number): MediaEntry[] {
  if (entries.length === 0) return [];
  const out: MediaEntry[] = [];
  for (let i = 0; i < n; i++) {
    const base = entries[i % entries.length];
    out.push({ ...base, id: `${base.id}-${i}` });
  }
  return out;
}
