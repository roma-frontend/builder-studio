'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Sparkles, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';

const COPY = {
  ru: {
    badge: 'Автоматизация выполнена',
    title: 'Рабочее пространство готово',
    text: 'Мы подтвердили аккаунт, включили персональный onboarding и подготовили маршрут до первого опубликованного сайта.',
    account: 'Аккаунт защищён',
    guide: 'Тур готов к запуску',
    action: 'Создать первый сайт',
    close: 'Скрыть приветствие',
  },
  en: {
    badge: 'Automation completed',
    title: 'Your workspace is ready',
    text: 'We verified your account, enabled personalized onboarding, and prepared the path to your first published site.',
    account: 'Account secured',
    guide: 'Guided tour is ready',
    action: 'Create your first site',
    close: 'Dismiss welcome',
  },
  hy: {
    badge: 'Ավտոմատացումը կատարված է',
    title: 'Ձեր աշխատանքային տարածքը պատրաստ է',
    text: 'Մենք հաստատեցինք հաշիվը, միացրինք անհատական onboarding-ը և պատրաստեցինք առաջին հրապարակված կայքի ուղին։',
    account: 'Հաշիվը պաշտպանված է',
    guide: 'Ուղեցույցը պատրաստ է',
    action: 'Ստեղծել առաջին կայքը',
    close: 'Փակել ողջույնը',
  },
} as const;

export function WelcomeAutomation({ name }: { name?: string }) {
  const router = useRouter();
  const locale = useLocale().locale as keyof typeof COPY;
  const t = COPY[locale] ?? COPY.en;

  const dismiss = () => router.replace('/dashboard', { scroll: false });

  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-card to-primary/10 p-6 shadow-lg shadow-emerald-500/5 sm:p-8" role="status">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <button type="button" onClick={dismiss} aria-label={t.close} title={t.close} className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
      <div className="relative max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400"><Sparkles className="h-4 w-4" /> {t.badge}</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{name ? `${name}, ${t.title.toLocaleLowerCase(locale)}` : t.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.text}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {t.account}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-primary"><Wand2 className="h-4 w-4" /> {t.guide}</span>
        </div>
        <Button asChild className="mt-6 gap-2 shadow-lg shadow-primary/20">
          <Link href="/dashboard/sites?new=1"><Sparkles className="h-4 w-4" /> {t.action}</Link>
        </Button>
      </div>
    </section>
  );
}
