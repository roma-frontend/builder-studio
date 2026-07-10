import { NextResponse } from 'next/server';
import { requireUser, unauthorized } from '@/lib/api-guard';
import { rateLimit, isStaff } from '@/lib/auth';
import { enforceFeature } from '@/lib/billing/enforce';
import { getLocale } from '@/lib/i18n';
import { apiErrors } from '@/lib/api-errors-dict';
import { chatComplete } from '@/lib/llm';
import { THEMES, pickTheme, getTheme } from '@/lib/themes';

export const runtime = 'nodejs';

// In-builder AI agent: turns a natural-language instruction into ONE safe,
// structured action the builder client can apply to the live document:
//   { kind: 'theme', themeId }      — restyle the whole site
//   { kind: 'regenerate' }          — rewrite the current page from the brief
//   { kind: 'chat', message }       — a short helpful reply (no edit)
// The set is intentionally small and safe (no free-form doc mutation), so the
// model can never corrupt the document. Gated by the paid assistant feature.

type Action =
  | { kind: 'theme'; themeId: string; label: string }
  | { kind: 'regenerate' }
  | { kind: 'chat'; message: string };

const IDS = THEMES.map((t) => t.id);

// Deterministic fallback when no LLM is configured: keyword-match a theme, or a
// verb hint for regeneration, else a gentle chat nudge.
function fallbackAction(instruction: string, locale: string): Action {
  const s = instruction.toLowerCase();
  const wantsTheme = /(тема|стиль|цвет|theme|style|color|palette|неон|neon|люкс|luxur|тёмн|dark|светл|light)/.test(s);
  if (wantsTheme) {
    const t = pickTheme(instruction);
    return { kind: 'theme', themeId: t.id, label: t.label };
  }
  const wantsRewrite = /(перепиш|сгенерир|замен|обнов|rewrite|regenerate|redo|generate|content|текст|страниц|page)/.test(s);
  if (wantsRewrite) return { kind: 'regenerate' };
  const msg = locale === 'ru'
    ? 'Я могу сменить тему сайта или перегенерировать текущую страницу по вашему описанию. Например: «сделай неоновый ночной стиль» или «перепиши страницу под барбершоп».'
    : locale === 'hy'
      ? 'Կարող եմ փոխել կայքի թեման կամ վերագեներացնել ընթացիկ էջը ձեր նկարագրությամբ։'
      : 'I can change the site theme or regenerate the current page from your description. E.g. “make it a neon night style” or “rewrite the page for a barbershop”.';
  return { kind: 'chat', message: msg };
}

async function classify(instruction: string, locale: string): Promise<Action> {
  const catalog = THEMES.map((t) => `- ${t.id}: ${t.label}`).join('\n');
  const system =
    'You are an in-builder website assistant. Map the user instruction to ONE action and reply with ONLY compact JSON, no prose.\n' +
    'Actions:\n' +
    '1) {"kind":"theme","themeId":"<one id from the list>"} — when they want a different visual style/theme/colors/mood.\n' +
    '2) {"kind":"regenerate"} — when they want to rewrite/replace the current page content or layout.\n' +
    '3) {"kind":"chat","message":"<short helpful reply in the user\'s language>"} — anything else.\n' +
    `Theme ids:\n${catalog}`;
  const raw = await chatComplete(
    [
      { role: 'system', content: system },
      { role: 'user', content: instruction },
    ],
    { temperature: 0, maxTokens: 120 },
  );
  if (!raw) return fallbackAction(instruction, locale);
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return fallbackAction(instruction, locale);
    const obj = JSON.parse(m[0]) as { kind?: string; themeId?: string; message?: string };
    if (obj.kind === 'theme') {
      const id = IDS.find((x) => (obj.themeId || '').toLowerCase().includes(x)) ?? pickTheme(instruction).id;
      const t = getTheme(id);
      return { kind: 'theme', themeId: t.id, label: t.label };
    }
    if (obj.kind === 'regenerate') return { kind: 'regenerate' };
    if (obj.kind === 'chat' && obj.message) return { kind: 'chat', message: String(obj.message).slice(0, 600) };
  } catch {
    /* fall through */
  }
  return fallbackAction(instruction, locale);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const t = apiErrors(await getLocale());
  const locale = await getLocale();
  if (!isStaff(user)) {
    const gate = enforceFeature(user, 'assistant.use', t.forbidden);
    if (gate) return gate;
  }
  if (!rateLimit(`assistant-apply:${user.id}`, 20)) {
    return NextResponse.json({ error: t.tooManyRequests }, { status: 429 });
  }
  let instruction = '';
  try {
    instruction = String((await request.json())?.instruction ?? '').slice(0, 500);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!instruction.trim()) return NextResponse.json({ error: t.badRequest }, { status: 400 });

  const action = await classify(instruction, locale);
  return NextResponse.json({ ok: true, action });
}
