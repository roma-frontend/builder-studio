// Turns a short brief into a polished, "cinematic" video prompt by layering in
// professional shot / lighting / motion / lens modifiers. Deterministic and
// offline — no LLM needed. Swap this for an LLM call later if you want.

export type Section = 'hero' | 'background' | 'card';

const SHOT: Record<Section, string> = {
  hero: 'sweeping cinematic wide establishing shot',
  background: 'slow parallax cinematic shot',
  card: 'macro close-up product shot',
};

const LIGHT = [
  'golden hour light',
  'soft volumetric fog',
  'dramatic rim lighting',
  'moody neon glow',
  'high-key studio light',
];

const MOTION = [
  'slow motion',
  'smooth dolly move',
  'gentle orbiting camera',
  'subtle time-lapse',
];

const LOOK = 'shallow depth of field, anamorphic bokeh, 35mm film grain, ultra-detailed, 4k, photorealistic';

/** Stable pick from an array based on a string seed. */
function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

export interface ComposeInput {
  brief: string;
  section: Section;
  index?: number;
}

/** Compose one cinematic prompt from a brief + target section. */
export function composePrompt({ brief, section, index = 0 }: ComposeInput): string {
  const subject = brief.trim().replace(/\.$/, '');
  if (!subject) return '';
  const seed = `${subject}-${section}-${index}`;
  const shot = SHOT[section];
  const light = pick(LIGHT, seed);
  const motion = pick(MOTION, `${seed}-m`);
  return `${shot} of ${subject}, ${light}, ${motion}, ${LOOK}`;
}

export interface PlanItem {
  section: Section;
  title: string;
  prompt: string;
  aspect: string;
}

/**
 * Build a small multi-section plan from a free-text brief (or the body of an
 * uploaded .md). Heuristics: the first non-empty line becomes the hero; bullet
 * lines / subsequent lines become cards. Everything gets a cinematic prompt.
 */
export function planFromBrief(brief: string): PlanItem[] {
  const lines = brief
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*+#>\d.\s]+/, '').trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const [first, ...rest] = lines;
  const plan: PlanItem[] = [
    { section: 'hero', title: titleCase(first), prompt: composePrompt({ brief: first, section: 'hero' }), aspect: '16:9' },
  ];
  rest.slice(0, 6).forEach((line, i) => {
    plan.push({
      section: 'card',
      title: titleCase(line),
      prompt: composePrompt({ brief: line, section: 'card', index: i + 1 }),
      aspect: '1:1',
    });
  });
  return plan;
}

function titleCase(s: string): string {
  const t = s.trim().slice(0, 48);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
