import { describe, expect, it } from 'vitest';
import {
  createABTest,
  getVariantForUser,
  recordImpression,
  recordConversion,
  calculateWinner,
  getConversionRate,
  type ABTest,
} from '@/lib/cinematic-ab';
import {
  DNA_PRESETS,
  getDna,
  pickDnaFromBrief,
  dnaToPromptLayers,
  dnaConsistencyCheck,
  getDnaFromMood,
} from '@/lib/cinematic-dna';
import {
  DNA_PRESETS as ClientDnaPresets,
  getDna as getClientDna,
  pickDnaFromBrief as pickClientDna,
  dnaConsistencyCheck as clientDnaConsistencyCheck,
} from '@/lib/cinematic-dna-client';
import { calculateCinematicScore } from '@/lib/cinematic-score';
import {
  TRANSITION_PRESETS,
  getTransitionCss,
  type TransitionType,
} from '@/lib/cinematic-transitions';
import {
  INTERACTION_PRESETS,
  getInteractionTransform,
  type InteractionType,
} from '@/lib/scene-director';
import {
  TIME_VARIANTS,
  getTimeOfDay,
  getTimeVariant,
  timeAwarePromptSuffix,
  timeAwareCssVars,
} from '@/lib/time-aware';
import { analyzeBrandVoice, generateCopyWithVoice } from '@/lib/brand-voice';
import { generateBrandFilmScript } from '@/lib/brand-film';
import { extractMoodFromImages, analyzeImageColors, type ColorPalette } from '@/lib/mood-board';
import { composePrompt } from '@/lib/prompt-composer';
import type { BuilderDoc } from '@/lib/builder/types';

function baseDoc(overrides: Partial<BuilderDoc> = {}): BuilderDoc {
  return {
    brand: 'Test',
    themeId: 'tech-saas',
    dnaId: 'nolan',
    nav: [],
    footer: { text: '', links: [] },
    pages: [
      {
        id: 'home',
        path: '',
        title: 'Home',
        blocks: [
          {
            id: 's1',
            type: 'section',
            props: { padding: 'lg', bg: 'none' },
            children: [
              {
                id: 'v1',
                type: 'video',
                props: { src: '/v.mp4', ratio: '16:9', animName: 'fade' },
              },
            ],
          },
          {
            id: 's2',
            type: 'section',
            props: { padding: 'md', bg: 'muted' },
            children: [
              {
                id: 'v2',
                type: 'video',
                props: { src: '/v2.mp4', hvScale: '1.05' },
              },
            ],
          },
          {
            id: 's3',
            type: 'section',
            props: { padding: 'sm', bg: 'primary' },
            children: [
              {
                id: 'v3',
                type: 'video',
                props: { src: '/v3.mp4', hvTranslateY: '-4' },
              },
            ],
          },
          {
            id: 's4',
            type: 'section',
            props: { padding: 'lg', bg: 'card' },
            children: [
              { id: 't1', type: 'text', props: { text: 'hello' } },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('cinematic-ab', () => {
  it('creates a draft A/B test with labeled variants', () => {
    const test = createABTest('Hero DNA', 'compare looks', ['nolan', 'wong']);
    expect(test.status).toBe('draft');
    expect(test.variants).toHaveLength(2);
    expect(test.variants[0].label).toBe('Variant A');
    expect(test.variants[1].label).toBe('Variant B');
    expect(test.variants[0].impressions).toBe(0);
    expect(test.name).toBe('Hero DNA');
  });

  it('assigns a stable variant only while the test is running', () => {
    const draft = createABTest('t', 'd', ['nolan', 'wong']);
    expect(getVariantForUser(draft, 'user-1')).toBeNull();

    const running: ABTest = { ...draft, status: 'running' };
    const a = getVariantForUser(running, 'user-1');
    const b = getVariantForUser(running, 'user-1');
    expect(a).not.toBeNull();
    expect(a?.id).toBe(b?.id);
  });

  it('records impressions/conversions and picks a winner by rate', () => {
    let test = createABTest('t', 'd', ['nolan', 'wong']);
    test = recordImpression(test, 'variant-1');
    test = recordImpression(test, 'variant-1');
    test = recordConversion(test, 'variant-1');
    test = recordImpression(test, 'variant-2');
    test = recordConversion(test, 'variant-2');
    test = recordConversion(test, 'variant-2');

    expect(test.variants[0].impressions).toBe(2);
    expect(test.variants[0].conversions).toBe(1);
    expect(getConversionRate(test.variants[0])).toBe(50);
    expect(getConversionRate({ ...test.variants[0], impressions: 0 })).toBe(0);
    expect(calculateWinner(test)).toBe('variant-2');
    expect(calculateWinner(createABTest('empty', 'd', ['nolan']))).toBeNull();
  });
});

describe('cinematic-dna (server)', () => {
  it('looks up presets and builds prompt layers', () => {
    expect(DNA_PRESETS.length).toBeGreaterThanOrEqual(8);
    expect(getDna('nolan')?.label).toContain('Nolan');
    expect(getDna('missing')).toBeUndefined();

    const layers = dnaToPromptLayers(getDna('wong')!);
    expect(layers.lens).toContain('24mm');
    expect(layers.mood).toMatch(/romantic|melancholic/i);
  });

  it('picks DNA from brief keywords and checks theme affinity', () => {
    expect(pickDnaFromBrief('neon night city romantic loneliness').id).toBe('wong');
    expect(pickDnaFromBrief('').id).toBe('nolan');

    const match = dnaConsistencyCheck(getDna('nolan')!, 'tech-saas');
    expect(match.score).toBe(100);
    expect(match.suggestions).toHaveLength(0);

    const mismatch = dnaConsistencyCheck(getDna('nolan')!, 'neon-night');
    expect(mismatch.score).toBe(60);
    expect(mismatch.suggestions[0]).toContain('tech-saas');
  });

  it('maps mood analysis to a DNA preset', () => {
    expect(getDnaFromMood({ energy: 'low', mood: 'calm', temperature: 'cool', style: 'modern' }).id).toBe('villeneuve');
    expect(getDnaFromMood({ energy: 'low', mood: 'calm', temperature: 'warm', style: 'modern' }).id).toBe('miyazaki');
    expect(getDnaFromMood({ energy: 'medium', mood: 'balanced', temperature: 'neutral', style: 'modern' }).id).toBe('anderson');
    expect(getDnaFromMood({ energy: 'high', mood: 'energetic', temperature: 'warm', style: 'modern' }).id).toBe('tarantino');
    expect(getDnaFromMood({ energy: 'high', mood: 'energetic', temperature: 'cool', style: 'modern' }).id).toBe('nolan');
    expect(getDnaFromMood({ energy: 'medium', mood: 'dramatic', temperature: 'cool', style: 'modern' }).id).toBe('kubrick');
    expect(getDnaFromMood({ energy: 'medium', mood: 'dramatic', temperature: 'warm', style: 'vibrant' }).id).toBe('wong');
    expect(getDnaFromMood({ energy: 'low', mood: 'balanced', temperature: 'cool', style: 'luxury' }).id).toBe('fincher');
    expect(getDnaFromMood({ energy: 'low', mood: 'balanced', temperature: 'warm', style: 'luxury' }).id).toBe('villeneuve');
    expect(getDnaFromMood({ energy: 'low', mood: 'calm', temperature: 'neutral', style: 'minimal' }).id).toBe('fincher');
  });
});

describe('cinematic-dna-client', () => {
  it('mirrors server DNA helpers for the client bundle', () => {
    expect(ClientDnaPresets).toHaveLength(DNA_PRESETS.length);
    expect(getClientDna('anderson')?.director).toBe('anderson');
    expect(pickClientDna('pastel symmetry retro vintage').id).toBe('anderson');
    expect(clientDnaConsistencyCheck(getClientDna('miyazaki')!, 'nature-fresh').score).toBe(100);
    expect(clientDnaConsistencyCheck(getClientDna('miyazaki')!, 'tech-saas').score).toBe(60);
  });
});

describe('cinematic-score', () => {
  it('scores a strong cinematic doc highly', () => {
    const result = calculateCinematicScore(baseDoc(), 'en');
    expect(result.total).toBeGreaterThanOrEqual(80);
    expect(result.grade).toMatch(/^[SABCD]$/);
    expect(result.breakdown.dnaConsistency).toBe(100);
    expect(result.breakdown.videoQuality).toBe(100);
    expect(result.breakdown.colorHarmony).toBe(100);
  });

  it('suggests improvements for a weak doc in each locale', () => {
    const weak = baseDoc({
      dnaId: 'none',
      themeId: 'auto',
      pages: [
        {
          id: 'home',
          path: '',
          title: 'Home',
          blocks: [
            { id: 's1', type: 'section', props: { padding: 'md', bg: 'none' }, children: [] },
            { id: 's2', type: 'section', props: { padding: 'md', bg: 'none' }, children: [] },
          ],
        },
      ],
    });

    const ru = calculateCinematicScore(weak, 'ru');
    expect(ru.breakdown.dnaConsistency).toBe(40);
    expect(ru.breakdown.videoQuality).toBe(30);
    expect(ru.breakdown.colorHarmony).toBe(60);
    expect(ru.suggestions.some((s) => s.includes('DNA') || s.includes('видео'))).toBe(true);

    const en = calculateCinematicScore(weak, 'en');
    expect(en.suggestions.some((s) => /video|DNA|theme/i.test(s))).toBe(true);

    const hy = calculateCinematicScore(weak, 'hy');
    expect(hy.suggestions.length).toBeGreaterThan(0);
  });

  it('covers motion and rhythm edge branches', () => {
    const noMotion = baseDoc({
      pages: [
        {
          id: 'home',
          path: '',
          title: 'Home',
          blocks: Array.from({ length: 4 }, (_, i) => ({
            id: `s${i}`,
            type: 'section' as const,
            props: { padding: 'md', bg: 'none' },
            children: [{ id: `t${i}`, type: 'text' as const, props: { text: 'x' } }],
          })),
        },
      ],
    });
    const motionScore = calculateCinematicScore(noMotion);
    expect(motionScore.breakdown.motionDesign).toBeLessThan(100);
    expect(motionScore.breakdown.visualRhythm).toBeLessThan(100);

    const empty = baseDoc({ pages: [] });
    expect(calculateCinematicScore(empty).breakdown.visualRhythm).toBe(0);

    const fewVideos = baseDoc({
      pages: [
        {
          id: 'home',
          path: '',
          title: 'Home',
          blocks: [
            {
              id: 's1',
              type: 'section',
              props: { padding: 'lg', bg: 'none' },
              children: [{ id: 'v1', type: 'video', props: { src: '/a.mp4' } }],
            },
            {
              id: 's2',
              type: 'section',
              props: { padding: 'md', bg: 'muted' },
              children: [{ id: 'v2', type: 'video', props: { src: '/b.mp4' } }],
            },
            {
              id: 's3',
              type: 'section',
              props: { padding: 'sm', bg: 'primary' },
              children: [{ id: 't1', type: 'text', props: { text: 'x' } }],
            },
            {
              id: 's4',
              type: 'section',
              props: { padding: 'lg', bg: 'card' },
              children: [{ id: 't2', type: 'text', props: { text: 'y' } }],
            },
          ],
        },
      ],
    });
    const few = calculateCinematicScore(fewVideos);
    expect(few.breakdown.videoQuality).toBe(60);

    const noHeroRatio = baseDoc({
      pages: [
        {
          id: 'home',
          path: '',
          title: 'Home',
          blocks: [
            {
              id: 's1',
              type: 'section',
              props: { padding: 'lg', bg: 'none' },
              children: [
                { id: 'v1', type: 'video', props: { src: '/a.mp4', ratio: '1:1' } },
                { id: 'v2', type: 'video', props: { src: '/b.mp4', ratio: '1:1' } },
                { id: 'v3', type: 'video', props: { src: '/c.mp4', ratio: '1:1' } },
              ],
            },
            {
              id: 's2',
              type: 'section',
              props: { padding: 'md', bg: 'muted' },
              children: [],
            },
            {
              id: 's3',
              type: 'section',
              props: { padding: 'sm', bg: 'primary' },
              children: [],
            },
            {
              id: 's4',
              type: 'section',
              props: { padding: 'lg', bg: 'card' },
              children: [],
            },
          ],
        },
      ],
    });
    expect(calculateCinematicScore(noHeroRatio).breakdown.videoQuality).toBe(80);
  });
});

describe('cinematic-transitions', () => {
  const types = Object.keys(TRANSITION_PRESETS) as TransitionType[];

  it('has localized presets for every transition type', () => {
    expect(types.length).toBeGreaterThanOrEqual(12);
    for (const type of types) {
      expect(TRANSITION_PRESETS[type].label.ru).toBeTruthy();
      expect(TRANSITION_PRESETS[type].label.en).toBeTruthy();
    }
  });

  it('returns CSS for enter/exit of each transition type', () => {
    for (const type of types) {
      const enter = getTransitionCss({ type, duration: 400, easing: 'ease' }, 'enter');
      const exit = getTransitionCss({ type, duration: 400, easing: 'ease' }, 'exit');
      if (type === 'none') {
        expect(enter).toBe('');
        expect(exit).toBe('');
      } else {
        expect(enter).toContain('transition:');
        expect(exit).toContain('transition:');
        expect(enter).not.toBe(exit);
      }
    }
  });
});

describe('scene-director', () => {
  const types = Object.keys(INTERACTION_PRESETS) as InteractionType[];

  it('has interaction presets', () => {
    expect(types).toContain('parallax');
    expect(INTERACTION_PRESETS.parallax.label.en).toMatch(/parallax/i);
  });

  it('builds transforms for every interaction type', () => {
    for (const type of types) {
      const css = getInteractionTransform(
        { type, intensity: 0.5, smoothing: 0.2, axis: 'both' },
        0.4,
        0.2,
        0.8
      );
      if (type === 'none') expect(css).toBe('');
      else expect(css.length).toBeGreaterThan(0);
    }

    expect(
      getInteractionTransform({ type: 'mouse-tilt', intensity: 1, smoothing: 0, axis: 'x' }, 0, 1, 0)
    ).toContain('rotateY');
    expect(
      getInteractionTransform({ type: 'mouse-tilt', intensity: 1, smoothing: 0, axis: 'y' }, 0, 1, 0)
    ).toContain('rotateX');
  });
});

describe('time-aware', () => {
  it('maps hours of day to variants', () => {
    expect(getTimeOfDay(new Date(2026, 0, 1, 6))).toBe('morning');
    expect(getTimeOfDay(new Date(2026, 0, 1, 12))).toBe('day');
    expect(getTimeOfDay(new Date(2026, 0, 1, 18))).toBe('evening');
    expect(getTimeOfDay(new Date(2026, 0, 1, 23))).toBe('night');
    expect(TIME_VARIANTS).toHaveLength(4);
  });

  it('builds prompt suffixes and CSS vars', () => {
    expect(getTimeVariant('night').label).toBe('Ночь');
    expect(timeAwarePromptSuffix('morning')).toMatch(/golden hour/i);
    expect(timeAwareCssVars('night')).toContain('data-time="night"');
    expect(timeAwareCssVars('night')).toContain('--primary:');
  });
});

describe('brand-voice', () => {
  it('analyzes tone, style, keywords and audience', () => {
    const analysis = analyzeBrandVoice([
      'Привет, дружеский сервис для клиентов. Expert quality specialist. Story journey narrative.',
    ]);
    expect(analysis.tone).toBeTruthy();
    expect(analysis.style).toBeTruthy();
    expect(analysis.keywords.length).toBeGreaterThan(0);
    expect(analysis.audience).toMatch(/клиент|широкая аудитория|for /i);
    expect(analysis.confidence).toBeGreaterThanOrEqual(0);
  });

  it('falls back to default audience and generates voice-aware copy', () => {
    const empty = analyzeBrandVoice(['ok']);
    expect(empty.audience).toBe('широкая аудитория');

    const copy = generateCopyWithVoice(
      'Write a hero headline',
      {
        id: '1',
        siteId: 's1',
        tone: 'friendly',
        style: 'storytelling',
        audience: 'founders',
        keywords: ['cinematic', 'studio', 'builder'],
        examples: [],
        createdAt: 1,
        updatedAt: 1,
      },
      'en'
    );
    expect(copy).toContain('friendly');
    expect(copy).toContain('founders');
    expect(copy).toContain('cinematic');

    expect(
      generateCopyWithVoice(
        'x',
        {
          id: '1',
          siteId: 's1',
          tone: 'formal',
          style: 'concise',
          audience: 'a',
          keywords: [],
          examples: [],
          createdAt: 1,
          updatedAt: 1,
        },
        'ru'
      )
    ).toContain('официальном');
  });
});

describe('brand-film', () => {
  it('builds a 5-scene film script with optional DNA', () => {
    const scenes = generateBrandFilmScript(
      'Launch a cinematic studio. Fast export. Beautiful presets. Simple pricing.',
      'nolan',
      30
    );
    expect(scenes).toHaveLength(5);
    expect(scenes[0].type).toBe('hero');
    expect(scenes[scenes.length - 1].type).toBe('cta');
    expect(scenes[0].duration).toBe(6);
    expect(scenes[0].prompt).toContain('IMAX');
    expect(scenes[0].dna?.lens).toBeTruthy();
  });

  it('fills missing feature scenes from a short brief', () => {
    const scenes = generateBrandFilmScript('One short line only');
    expect(scenes).toHaveLength(5);
    expect(scenes.filter((s) => s.type === 'feature').length).toBe(3);
    expect(scenes.every((s) => s.aspect === '16:9')).toBe(true);
  });
});

describe('mood-board', () => {
  const palette = (partial: Partial<ColorPalette>): ColorPalette => ({
    dominant: ['#112233'],
    average: { r: 20, g: 30, b: 40 },
    brightness: 0.5,
    saturation: 0.5,
    warmth: 0,
    ...partial,
  });

  it('classifies mood from palettes across energy/temperature/style branches', () => {
    const high = extractMoodFromImages([
      palette({ brightness: 0.85, saturation: 0.7, warmth: 0.3 }),
    ]);
    expect(high.energy).toBe('high');
    expect(high.mood).toBe('energetic');
    expect(high.temperature).toBe('warm');
    expect(high.style).toBe('vibrant');

    const calm = extractMoodFromImages([
      palette({ brightness: 0.2, saturation: 0.1, warmth: -0.3 }),
    ]);
    expect(calm.energy).toBe('low');
    expect(calm.mood).toBe('calm');
    expect(calm.temperature).toBe('cool');

    const luxury = extractMoodFromImages([
      palette({ brightness: 0.25, saturation: 0.25, warmth: 0 }),
    ]);
    expect(luxury.style).toBe('luxury');

    const minimal = extractMoodFromImages([
      palette({ brightness: 0.85, saturation: 0.1, warmth: 0 }),
    ]);
    expect(minimal.style).toBe('minimal');

    const dramatic = extractMoodFromImages([
      palette({ brightness: 0.3, saturation: 0.55, warmth: 0 }),
    ]);
    expect(dramatic.mood).toBe('dramatic');
    expect(dramatic.confidence).toBeGreaterThan(0.6);
  });

  it('analyzes image colors via sharp and falls back on bad input', async () => {
    const sharp = (await import('sharp')).default;
    const png = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: { r: 220, g: 40, b: 40 },
      },
    })
      .png()
      .toBuffer();

    const colors = await analyzeImageColors(png);
    expect(colors.dominant.length).toBeGreaterThan(0);
    expect(colors.average.r).toBeGreaterThan(150);
    expect(colors.brightness).toBeGreaterThan(0);
    expect(colors.warmth).toBeGreaterThan(0);

    const fallback = await analyzeImageColors(Buffer.from('not-an-image'));
    expect(fallback.dominant).toEqual(['#808080']);
    expect(fallback.average).toEqual({ r: 128, g: 128, b: 128 });
  });
});

describe('prompt-composer dna path', () => {
  it('uses DNA layers instead of style presets when provided', () => {
    const out = composePrompt({
      brief: 'mountain road',
      section: 'hero',
      dna: {
        lens: 'IMAX lens',
        lighting: 'stark light',
        colorGrade: 'teal amber',
        filmStock: '65mm grain',
        mood: 'epic',
        motion: 'slow push-in',
      },
    });
    expect(out).toContain('IMAX lens');
    expect(out).toContain('slow push-in');
    expect(out).toContain('mountain road');
  });
});
