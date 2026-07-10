'use client';

// Activation checklist ("Getting started") shown on the dashboard overview for
// site owners. It nudges the user along the value path — create a site → design
// it in the studio → publish → collect leads — which is the single biggest
// lever on activation/conversion. Dismissible (persisted per-account via
// user_prefs) and auto-hides once every step is done. Self-contained i18n
// (ru/en/hy) to keep it drop-in, matching the pattern used elsewhere.

import Link from 'next/link';
import { useMemo } from 'react';
import { Check, Sparkles, Rocket, Inbox, Wand2, X, ArrowRight, PartyPopper } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { usePref } from '@/hooks/use-user-prefs';

export interface GettingStartedProps {
  hasSite: boolean;
  hasPublished: boolean;
  hasLeads: boolean;
  /** Site id to deep-link "design in studio" / "publish"; falls back to /dashboard/sites. */
  primarySiteId?: string | null;
}

type Copy = {
  title: string;
  subtitle: string;
  done: string;
  dismiss: string;
  allDoneTitle: string;
  allDoneDesc: string;
  steps: { create: string; design: string; publish: string; leads: string };
  stepDesc: { create: string; design: string; publish: string; leads: string };
  cta: { create: string; design: string; publish: string; leads: string };
};

const COPY: Record<'ru' | 'en' | 'hy', Copy> = {
  ru: {
    title: 'Быстрый старт',
    subtitle: 'Пройдите 4 шага — и ваш сайт в эфире',
    done: 'готово',
    dismiss: 'Скрыть',
    allDoneTitle: 'Всё готово — вы великолепны!',
    allDoneDesc: 'Сайт создан, опубликован и собирает заявки. Так держать!',
    steps: { create: 'Создайте сайт', design: 'Оформите в Студии', publish: 'Опубликуйте', leads: 'Соберите заявки' },
    stepDesc: {
      create: 'Начните с шаблона или чистого листа',
      design: 'Блоки, тема и кинематографичное AI-видео',
      publish: 'Один клик — и сайт доступен всем',
      leads: 'Форма на сайте приводит первых клиентов',
    },
    cta: { create: 'Создать сайт', design: 'Открыть Студию', publish: 'К публикации', leads: 'Смотреть заявки' },
  },
  en: {
    title: 'Quick start',
    subtitle: 'Four steps and your site is live',
    done: 'done',
    dismiss: 'Dismiss',
    allDoneTitle: 'All set — you nailed it!',
    allDoneDesc: 'Your site is built, published and collecting leads. Keep it up!',
    steps: { create: 'Create a site', design: 'Design in the Studio', publish: 'Publish', leads: 'Collect leads' },
    stepDesc: {
      create: 'Start from a template or a blank page',
      design: 'Blocks, a theme and cinematic AI video',
      publish: 'One click and your site is live',
      leads: 'A form turns visitors into customers',
    },
    cta: { create: 'Create site', design: 'Open Studio', publish: 'Publish', leads: 'View leads' },
  },
  hy: {
    title: 'Արագ մեկնարկ',
    subtitle: 'Չորս քայլ, և ձեր կայքը եթերում է',
    done: 'պատրաստ է',
    dismiss: 'Թաքցնել',
    allDoneTitle: 'Ամեն ինչ պատրաստ է — հիանալի է!',
    allDoneDesc: 'Կայքը ստեղծված է, հրապարակված և հավաքում է հայտեր։ Այդպես շարունակեք։',
    steps: { create: 'Ստեղծեք կայք', design: 'Ձևավորեք Ստուդիայում', publish: 'Հրապարակեք', leads: 'Հավաքեք հայտեր' },
    stepDesc: {
      create: 'Սկսեք ձևանմուշից կամ դատարկ էջից',
      design: 'Բլոկներ, թեմա և կինեմատոգրաֆիկ AI-վիդեո',
      publish: 'Մեկ սեղմում, և կայքը հասանելի է բոլորին',
      leads: 'Ձևը այցելուներին դարձնում է հաճախորդ',
    },
    cta: { create: 'Ստեղծել կայք', design: 'Բացել Ստուդիան', publish: 'Հրապարակել', leads: 'Դիտել հայտերը' },
  },
};

export function GettingStarted({ hasSite, hasPublished, hasLeads, primarySiteId }: GettingStartedProps) {
  const { locale } = useLocale();
  const c = COPY[(locale as 'ru' | 'en' | 'hy')] ?? COPY.en;
  const [dismissed, setDismissed] = usePref<boolean>('onboarding-dismissed', false);

  const studioHref = primarySiteId ? `/studio/builder?site=${primarySiteId}` : '/dashboard/sites';
  const steps = useMemo(
    () => [
      { key: 'create', done: hasSite, icon: Sparkles, href: '/dashboard/sites' },
      { key: 'design', done: hasSite, icon: Wand2, href: studioHref },
      { key: 'publish', done: hasPublished, icon: Rocket, href: hasSite ? studioHref : '/dashboard/sites' },
      { key: 'leads', done: hasLeads, icon: Inbox, href: '/dashboard/submissions' },
    ] as const,
    [hasSite, hasPublished, hasLeads, studioHref],
  );

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);

  // Hidden when the owner dismissed it, or once fully completed (no nagging).
  if (dismissed || allDone) return null;

  // The first not-yet-done step is the "current" one we highlight.
  const currentKey = steps.find((s) => !s.done)?.key;

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.07] via-card to-card p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={c.dismiss}
        title={c.dismiss}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-md shadow-primary/30">
          <PartyPopper className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight">{c.title}</h2>
          <p className="truncate text-sm text-muted-foreground">{c.subtitle}</p>
        </div>
        <span className="ml-auto mr-6 shrink-0 text-sm font-semibold tabular-nums text-primary">{doneCount}/{steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isCurrent = s.key === currentKey;
          return (
            <li
              key={s.key}
              className={[
                'flex items-start gap-3 rounded-xl border p-3.5 transition-colors',
                s.done ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : isCurrent ? 'border-primary/50 bg-primary/[0.06]' : 'border-border/60 bg-card/60',
              ].join(' ')}
            >
              <span
                className={[
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  s.done ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary',
                ].join(' ')}
              >
                {s.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={['text-sm font-semibold', s.done ? 'text-muted-foreground line-through' : ''].join(' ')}>
                  {c.steps[s.key]}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.stepDesc[s.key]}</p>
                {!s.done && (
                  <Link
                    href={s.href}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
                  >
                    {c.cta[s.key]} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
