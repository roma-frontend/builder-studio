'use client';

// "60-second site" AI onboarding. The user types their business name + a short
// brief; we orchestrate the existing building blocks — create the org
// (self-serve), pick a theme, generate the home page — then drop them into the
// builder with a ready, themed, content-filled site. Every step degrades
// gracefully (theme→keywords, content→deterministic fallback), so it always
// produces a site even with no LLM. Self-contained i18n (ru/en/hy).

import { useState } from 'react';
import { Sparkles, Wand2, Loader2, Check, Palette, LayoutTemplate, Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/hooks/use-locale';

type StepKey = 'org' | 'theme' | 'content' | 'save';
type Phase = 'idle' | StepKey | 'done' | 'pending' | 'error';

const COPY: Record<'ru' | 'en' | 'hy', {
  badge: string; title: string; subtitle: string;
  nameLabel: string; namePlaceholder: string; briefLabel: string; briefPlaceholder: string;
  cta: string; building: string; pending: string; error: string; retry: string;
  steps: Record<StepKey, string>;
  examples: string[]; examplesLabel: string;
}> = {
  ru: {
    badge: 'AI-конструктор',
    title: 'Сайт за 60 секунд',
    subtitle: 'Опишите бизнес — ИИ подберёт тему, соберёт страницу и откроет её в редакторе.',
    nameLabel: 'Название', namePlaceholder: 'Напр. «Кофейня “Утро”»',
    briefLabel: 'О чём ваш сайт', briefPlaceholder: 'Напр. «Уютная кофейня в центре: спешелти-кофе, завтраки, доставка. Хотим бронь стола и меню».',
    cta: 'Собрать сайт', building: 'Собираем ваш сайт…', pending: 'Заявка отправлена — ждёт одобрения администратора.',
    error: 'Что-то пошло не так. Попробуйте ещё раз.', retry: 'Повторить',
    steps: { org: 'Создаём организацию', theme: 'Подбираем тему', content: 'Генерируем страницу', save: 'Открываем редактор' },
    examplesLabel: 'Примеры:',
    examples: ['Кофейня со спешелти-кофе и доставкой', 'Студия йоги: расписание и абонементы', 'SaaS для учёта задач', 'Барбершоп: онлайн-запись'],
  },
  en: {
    badge: 'AI builder',
    title: 'A site in 60 seconds',
    subtitle: 'Describe your business — AI picks a theme, builds a page and opens it in the editor.',
    nameLabel: 'Name', namePlaceholder: 'e.g. “Morning Coffee”',
    briefLabel: 'What is your site about', briefPlaceholder: 'e.g. “A cozy downtown coffee shop: specialty coffee, breakfast, delivery. We want table booking and a menu.”',
    cta: 'Build my site', building: 'Building your site…', pending: 'Request sent — awaiting admin approval.',
    error: 'Something went wrong. Please try again.', retry: 'Retry',
    steps: { org: 'Creating your organization', theme: 'Picking a theme', content: 'Generating the page', save: 'Opening the editor' },
    examplesLabel: 'Examples:',
    examples: ['Specialty coffee shop with delivery', 'Yoga studio: schedule and memberships', 'SaaS for task tracking', 'Barbershop: online booking'],
  },
  hy: {
    badge: 'AI-կառուցիչ',
    title: 'Կայք 60 վայրկյանում',
    subtitle: 'Նկարագրեք բիզնեսը — AI-ն կընտրի թեմա, կկառուցի էջ և կբացի խմբագրիչում։',
    nameLabel: 'Անվանում', namePlaceholder: 'Օր. «Առավոտյան սուրճ»',
    briefLabel: 'Ինչի՞ մասին է կայքը', briefPlaceholder: 'Օր. «Հարմարավետ սրճարան կենտրոնում. specialty սուրճ, նախաճաշեր, առաքում։ Ուզում ենք սեղանի ամրագրում և մենյու»։',
    cta: 'Կառուցել կայքը', building: 'Կառուցում ենք ձեր կայքը…', pending: 'Հայտն ուղարկվեց — սպասում է հաստատման։',
    error: 'Ինչ-որ բան սխալ գնաց։ Փորձեք կրկին։', retry: 'Կրկնել',
    steps: { org: 'Ստեղծում ենք կազմակերպությունը', theme: 'Ընտրում ենք թեմա', content: 'Գեներացնում ենք էջը', save: 'Բացում ենք խմբագրիչը' },
    examplesLabel: 'Օրինակներ՝',
    examples: ['Specialty սրճարան առաքումով', 'Յոգա ստուդիա. ժամանակացույց և բաժանորդագրություն', 'SaaS առաջադրանքների համար', 'Վարսավիրանոց. առցանց գրանցում'],
  },
};

const STEP_ORDER: StepKey[] = ['org', 'theme', 'content', 'save'];
const STEP_ICON: Record<StepKey, typeof Palette> = { org: Rocket, theme: Palette, content: LayoutTemplate, save: Wand2 };

export function AiSiteWizard() {
  const { locale } = useLocale();
  const c = COPY[(locale as 'ru' | 'en' | 'hy')] ?? COPY.en;
  const [name, setName] = useState('');
  const [brief, setBrief] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');

  const busy = ['org', 'theme', 'content', 'save'].includes(phase);
  const stepState = (k: StepKey): 'done' | 'active' | 'todo' => {
    if (phase === 'done' || phase === 'save') return k === 'save' && phase === 'save' ? 'active' : 'done';
    const idx = STEP_ORDER.indexOf(phase as StepKey);
    const kIdx = STEP_ORDER.indexOf(k);
    if (idx < 0) return 'todo';
    if (kIdx < idx) return 'done';
    if (kIdx === idx) return 'active';
    return 'todo';
  };

  const run = async () => {
    setPhase('org');
    try {
      // 1) Create the org (self-serve). Returns {autoApproved, siteId} or a
      //    pending request when manual approval is enabled.
      const orgRes = await fetch('/api/org-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'create', requestedName: name.trim() || (c.title), message: brief.slice(0, 500) }),
      });
      const org = await orgRes.json().catch(() => ({}));
      if (!orgRes.ok) { setPhase('error'); return; }
      if (!org.autoApproved || !org.siteId) { setPhase('pending'); return; }
      const siteId: string = org.siteId;

      // 2) Pick a theme (best-effort).
      setPhase('theme');
      let themeId = '';
      try {
        const tr = await fetch('/api/pick-theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief }) });
        if (tr.ok) themeId = (await tr.json()).themeId || '';
      } catch { /* keep default theme */ }

      // 3) Generate the home page (best-effort; server has a fallback).
      setPhase('content');
      let page: { id: string; title: string; blocks: unknown[] } | null = null;
      try {
        const gr = await fetch('/api/generate-page', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief, title: name.trim() }) });
        if (gr.ok) page = (await gr.json()).page ?? null;
      } catch { /* keep default page */ }

      // 4) Merge into the site's draft doc and save.
      setPhase('save');
      try {
        const dr = await fetch(`/api/builder?site=${encodeURIComponent(siteId)}`);
        if (dr.ok) {
          const { doc } = await dr.json();
          if (doc && Array.isArray(doc.pages)) {
            if (themeId) doc.themeId = themeId;
            if (name.trim()) doc.brand = name.trim();
            if (page && Array.isArray(page.blocks) && page.blocks.length) {
              doc.pages = [{ id: page.id, path: '', title: page.title || name.trim() || 'Home', blocks: page.blocks }];
            }
            await fetch(`/api/builder?site=${encodeURIComponent(siteId)}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc),
            });
          }
        }
      } catch { /* the site still exists with defaults — proceed */ }

      setPhase('done');
      window.location.href = `/studio/builder?site=${encodeURIComponent(siteId)}`;
    } catch {
      setPhase('error');
    }
  };

  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 shadow-lg">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <Sparkles className="h-3.5 w-3.5" /> {c.badge}
      </span>
      <h2 className="mt-3 text-2xl font-black tracking-tight">{c.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>

      {!busy && phase !== 'done' && (
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{c.nameLabel}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={c.namePlaceholder} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{c.briefLabel}</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              placeholder={c.briefPlaceholder}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {c.examples.map((ex) => (
                <button key={ex} type="button" onClick={() => setBrief(ex)}
                  className="rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                  {ex}
                </button>
              ))}
            </div>
          </div>
          {phase === 'pending' && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">{c.pending}</p>}
          {phase === 'error' && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{c.error}</p>}
          <Button onClick={run} disabled={!name.trim() && !brief.trim()} size="lg" className="w-full gap-2">
            <Wand2 className="h-4 w-4" /> {phase === 'error' ? c.retry : c.cta} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {(busy || phase === 'done') && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{c.building}</p>
          {STEP_ORDER.map((k) => {
            const st = stepState(k);
            const Icon = STEP_ICON[k];
            return (
              <div key={k} className={[
                'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                st === 'done' ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : st === 'active' ? 'border-primary/50 bg-primary/[0.06]' : 'border-border/60 opacity-60',
              ].join(' ')}>
                <span className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  st === 'done' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary',
                ].join(' ')}>
                  {st === 'done' ? <Check className="h-4 w-4" /> : st === 'active' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="text-sm font-medium">{c.steps[k]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
