// One-click "effect" presets for the site builder. Each preset is a bundle of
// the advanced style props (anim*/hv*/css*/customCss) consumed by the renderer
// in components/builder/render-node.tsx. Applying a preset patches all of its
// props onto a node at once; the live preview then shows the effect instantly.
//
// Kept as a pure, framework-free module so it can be unit-tested and reused.

export interface EffectPreset {
  id: string;
  /** Localized-ish short label (ru); the editor wraps it in tr(). */
  label: string;
  /** 'entrance' plays once on load, 'loop' runs forever, 'hover' reacts to hover,
   *  'style' is a static look. Used only to group buttons in the UI. */
  kind: 'entrance' | 'loop' | 'hover' | 'style';
  props: Record<string, string>;
}

export const EFFECT_PRESETS: EffectPreset[] = [
  // — Entrance (play once) —
  { id: 'fade-up', label: 'Появление снизу', kind: 'entrance', props: { animName: 'fadeup', animDuration: '.7s', animTiming: 'smooth', animFill: 'both' } },
  { id: 'fade-in', label: 'Плавное проявление', kind: 'entrance', props: { animName: 'fadein', animDuration: '.8s', animTiming: 'ease-out', animFill: 'both' } },
  { id: 'zoom-in', label: 'Наплыв (zoom)', kind: 'entrance', props: { animName: 'zoomin', animDuration: '.6s', animTiming: 'spring', animFill: 'both' } },
  { id: 'reveal-right', label: 'Выезд слева', kind: 'entrance', props: { animName: 'faderight', animDuration: '.7s', animTiming: 'smooth', animFill: 'both' } },
  { id: 'reveal-left', label: 'Выезд справа', kind: 'entrance', props: { animName: 'fadeleft', animDuration: '.7s', animTiming: 'smooth', animFill: 'both' } },
  // — Loop (infinite) —
  { id: 'float', label: 'Парение', kind: 'loop', props: { animName: 'float', animDuration: '3s', animTiming: 'ease-in-out', animIter: 'infinite' } },
  { id: 'pulse', label: 'Пульс', kind: 'loop', props: { animName: 'pulse', animDuration: '2s', animTiming: 'ease-in-out', animIter: 'infinite' } },
  { id: 'spin', label: 'Вращение', kind: 'loop', props: { animName: 'spin', animDuration: '6s', animTiming: 'linear', animIter: 'infinite' } },
  { id: 'heartbeat', label: 'Сердцебиение', kind: 'loop', props: { animName: 'heartbeat', animDuration: '1.5s', animTiming: 'ease-in-out', animIter: 'infinite' } },
  { id: 'blink', label: 'Мерцание', kind: 'loop', props: { animName: 'blink', animDuration: '1.4s', animTiming: 'ease-in-out', animIter: 'infinite' } },
  // — Hover —
  { id: 'lift', label: 'Подъём при наведении', kind: 'hover', props: { cssTransition: 'all .25s ease', hvTranslateY: '-6px', hvShadow: '0 18px 40px rgba(0,0,0,.18)' } },
  { id: 'grow', label: 'Увеличение при наведении', kind: 'hover', props: { cssTransition: 'transform .25s ease', hvScale: '1.05' } },
  { id: 'neon', label: 'Неоновое свечение', kind: 'hover', props: { cssTransition: 'all .3s ease', hvShadow: '0 0 18px var(--primary), 0 0 42px var(--primary)', hvBorderColor: 'primary' } },
  { id: 'tilt', label: '3D-наклон', kind: 'hover', props: { cssTransition: 'transform .3s ease', hvTransform: 'perspective(600px) rotateX(6deg) rotateY(-6deg)' } },
  { id: 'brighten', label: 'Подсветка при наведении', kind: 'hover', props: { cssTransition: 'filter .25s ease', hvFilter: 'brightness(1.12) saturate(1.1)' } },
  // — Static styles —
  { id: 'glass', label: 'Стекло (glassmorphism)', kind: 'style', props: { cssBackdrop: 'blur(12px)', cssGradient: 'linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.04))', borderWidth: '1', borderColor: 'white', radius: 'xl', cssShadow: '0 8px 32px rgba(0,0,0,.18)' } },
  { id: 'gradient-text', label: 'Градиентный текст', kind: 'style', props: { cssGradient: 'linear-gradient(90deg, var(--primary), #8b5cf6, #ec4899)', customCss: '-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent' } },
  { id: 'gradient-animated', label: 'Анимированный градиент', kind: 'style', props: { cssGradient: 'linear-gradient(270deg, var(--primary), #8b5cf6, #ec4899, var(--primary))', customCss: 'background-size:400% 400%', animName: 'gradient-shift', animDuration: '8s', animTiming: 'linear', animIter: 'infinite' } },
  { id: 'soft-shadow', label: 'Мягкая тень', kind: 'style', props: { cssShadow: '0 20px 60px -20px rgba(0,0,0,.35)', radius: 'xl' } },
];

/** All prop keys any preset can set — used to clear a node's effect props on
 *  "reset" so switching presets doesn't leave stale values behind. */
export const EFFECT_KEYS: string[] = Array.from(
  new Set(EFFECT_PRESETS.flatMap((e) => Object.keys(e.props))),
);

export function getEffect(id: string): EffectPreset | undefined {
  return EFFECT_PRESETS.find((e) => e.id === id);
}

/** Returns a patch that applies `id`'s props, first clearing every effect key so
 *  the result is exactly the preset (no leftovers from a previously applied one). */
export function applyEffectPatch(id: string): Record<string, string> {
  const eff = getEffect(id);
  if (!eff) return {};
  const patch: Record<string, string> = {};
  for (const k of EFFECT_KEYS) patch[k] = '';
  return { ...patch, ...eff.props };
}

/** A patch that clears all effect props (the "reset" button). */
export function clearEffectPatch(): Record<string, string> {
  const patch: Record<string, string> = {};
  for (const k of EFFECT_KEYS) patch[k] = '';
  return patch;
}
