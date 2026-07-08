import 'server-only';
import { createHash } from 'node:crypto';
import { getRawDb } from '@/lib/db';
import { trc, NUMERIC, TEXT_PROPS } from '@/lib/builder/templates-i18n';
import type { Locale } from '@/lib/seo';
import type { BuilderNode, BuilderPage } from '@/lib/builder/types';

/**
 * Automatic content translation for arbitrary user-authored text (builder
 * content, gallery captions, etc.). Unlike the curated RU→{en,hy} dictionary
 * in templates-i18n (fast, hand-tuned), this layer translates ANY string so a
 * service owner never has to register each phrase by hand.
 *
 * Order of resolution per atomic string:
 *   1. curated dictionary (trc)         — instant, best quality
 *   2. persistent cache (SQLite)        — instant, filled on first use
 *   3. free machine-translation online  — once per unique string, then cached
 *   4. original Russian (graceful)      — if MT is unreachable
 *
 * The MT provider is Google's public gtx endpoint (no API key, same "free,
 * keyless" spirit as pollinations.ai used for images). Override with
 * TRANSLATE_URL/TRANSLATE_KEY (OpenAI-compatible) if a paid provider is wanted.
 *
 * Content translated here is user-authored, publicly published website copy —
 * never secrets — so routing it through a public translation service is safe.
 */

const CYRILLIC = /[А-Яа-яЁё]/;
const MT_TIMEOUT_MS = 8000;

function keyFor(locale: Locale, source: string): string {
  return createHash('sha256').update(`${locale}\u0000${source}`).digest('hex');
}

function cacheGet(id: string): string | null {
  try {
    const row = getRawDb().prepare('SELECT translated FROM translations WHERE id = ?').get(id) as
      | { translated: string }
      | undefined;
    return row ? row.translated : null;
  } catch {
    return null;
  }
}

function cacheSet(id: string, locale: Locale, source: string, translated: string): void {
  try {
    getRawDb()
      .prepare(
        'INSERT INTO translations (id, locale, source, translated, created_at) VALUES (?, ?, ?, ?, ?) ' +
          'ON CONFLICT(id) DO UPDATE SET translated = excluded.translated, created_at = excluded.created_at',
      )
      .run(id, locale, source, translated, Date.now());
  } catch {
    /* cache is best-effort */
  }
}

/** Free, keyless machine translation via Google's public gtx endpoint. */
async function machineTranslate(text: string, locale: Locale): Promise<string | null> {
  const tl = locale === 'en' ? 'en' : 'hy';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(MT_TIMEOUT_MS) });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    // Shape: [ [ [translatedChunk, originalChunk, ...], ... ], ... ]
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const out = (data[0] as unknown[])
      .map((seg) => (Array.isArray(seg) ? String(seg[0] ?? '') : ''))
      .join('');
    return out.trim() ? out : null;
  } catch {
    return null;
  }
}

/** Translate one atomic string (no list/pair delimiters). */
async function translateAtom(s: string, locale: Locale): Promise<string> {
  const t = s.trim();
  if (!t) return s;

  // 1. curated dictionary (handles exact known phrases)
  const dict = trc(t, locale);
  if (dict !== t) return s.replace(t, dict);

  // Skip non-Russian / numeric-symbol strings (urls, prices, "24/7", …).
  if (!CYRILLIC.test(t) || NUMERIC.test(t)) return s;

  // 2. persistent cache
  const id = keyFor(locale, t);
  const cached = cacheGet(id);
  if (cached !== null) return s.replace(t, cached);

  // 3. machine translation (then cache)
  const mt = await machineTranslate(t, locale);
  if (!mt) return s; // 4. graceful fallback to Russian
  cacheSet(id, locale, t, mt);
  return s.replace(t, mt);
}

/**
 * Translate a content string, mirroring trc's composite handling (newline
 * lists, "Q::A" pairs, "Label|url" socials) but with the MT+cache fallback.
 */
export async function translateAuto(s: string, locale: Locale): Promise<string> {
  if (locale === 'ru' || !s) return s;
  if (s.includes('\n')) {
    const lines = await Promise.all(s.split('\n').map((l) => translateAuto(l, locale)));
    return lines.join('\n');
  }
  if (s.includes('::')) {
    const [q, ...rest] = s.split('::');
    const [tq, tr] = await Promise.all([
      translateAuto(q, locale),
      translateAuto(rest.join('::'), locale),
    ]);
    return `${tq}::${tr}`;
  }
  if (s.includes('|')) {
    const i = s.indexOf('|');
    return `${await translateAuto(s.slice(0, i), locale)}|${s.slice(i + 1)}`;
  }
  return translateAtom(s, locale);
}

/** Deep-clone a node tree, auto-translating known text-bearing props. */
export async function translateNodeAuto(node: BuilderNode, locale: Locale): Promise<BuilderNode> {
  if (locale === 'ru') return node;
  const props: Record<string, string> = {};
  await Promise.all(
    Object.entries(node.props ?? {}).map(async ([k, v]) => {
      if (TEXT_PROPS.has(k) && typeof v === 'string' && !(k === 'value' && NUMERIC.test(v))) {
        props[k] = await translateAuto(v, locale);
      } else {
        props[k] = v;
      }
    }),
  );
  const children = node.children
    ? await Promise.all(node.children.map((c) => translateNodeAuto(c, locale)))
    : undefined;
  return { ...node, props, children };
}

/** Deep-clone a page, auto-translating its title, description and block tree. */
export async function translatePageAuto(page: BuilderPage, locale: Locale): Promise<BuilderPage> {
  if (locale === 'ru') return page;
  const [title, description, blocks] = await Promise.all([
    translateAuto(page.title, locale),
    page.description ? translateAuto(page.description, locale) : Promise.resolve(page.description),
    Promise.all(page.blocks.map((b) => translateNodeAuto(b, locale))),
  ]);
  return { ...page, title, description, blocks };
}
