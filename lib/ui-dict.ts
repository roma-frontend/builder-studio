// Lightweight, dependency-free UI dictionaries (ru/en) for the shared chrome
// (header, footer, common actions). Landing marketing copy lives in
// data/landing[.en].json; per-tenant site content is data-driven and separate.
//
// Usage (client): const t = useUi();  t.actions.login
// Usage (server): const t = ui(await getLocale());

import type { Locale } from '@/lib/seo';

export type UiDict = {
  nav: {
    how: string;
    features: string;
    themes: string;
    examples: string;
    builder: string;
    studio: string;
    presets: string;
  };
  actions: {
    login: string;
    start: string;
    logout: string;
    dashboard: string;
    sites: string;
    account: string;
    allThemes: string;
  };
  roles: { superadmin: string; admin: string };
  header: { tagline: string; noName: string };
  a11y: { openMenu: string; closeMenu: string; language: string };
  examples: { badge: string; title: string; subtitle: string };
  active: string;
  footer: {
    product: string;
    account: string;
    resources: string;
    register: string;
    mySites: string;
    blurb: string;
    startFree: string;
    rights: string;
    madeOn: string;
  };
};

const ru: UiDict = {
  nav: {
    how: 'Как это работает',
    features: 'Возможности',
    themes: 'Темы',
    examples: 'Примеры',
    builder: 'Конструктор',
    studio: 'Студия',
    presets: 'Пресеты',
  },
  actions: {
    login: 'Войти',
    start: 'Начать',
    logout: 'Выйти',
    dashboard: 'Дашборд',
    sites: 'Мои сайты',
    account: 'Аккаунт',
    allThemes: 'Все темы',
  },
  roles: { superadmin: 'Суперадмин', admin: 'Админ' },
  header: { tagline: 'ИИ-конструктор сайтов', noName: 'Без имени' },
  a11y: { openMenu: 'Открыть меню', closeMenu: 'Закрыть меню', language: 'Язык' },
  examples: {
    badge: 'Сделано на платформе',
    title: 'Пример живого сайта',
    subtitle: 'Эти секции с ИИ-видео собраны прямо в Студии — так выглядит результат.',
  },
  active: 'активна',
  footer: {
    product: 'Продукт',
    account: 'Аккаунт',
    resources: 'Ресурсы',
    register: 'Регистрация',
    mySites: 'Мои сайты',
    blurb: 'Опишите идею — платформа сгенерирует видео и тему, соберёт страницы и опубликует сайт на вашем поддомене.',
    startFree: 'Начать бесплатно',
    rights: 'Все права защищены.',
    madeOn: 'Собрано на платформе',
  },
};

const en: UiDict = {
  nav: {
    how: 'How it works',
    features: 'Features',
    themes: 'Themes',
    examples: 'Examples',
    builder: 'Builder',
    studio: 'Studio',
    presets: 'Presets',
  },
  actions: {
    login: 'Sign in',
    start: 'Get started',
    logout: 'Sign out',
    dashboard: 'Dashboard',
    sites: 'My sites',
    account: 'Account',
    allThemes: 'All themes',
  },
  roles: { superadmin: 'Superadmin', admin: 'Admin' },
  header: { tagline: 'AI website builder', noName: 'No name' },
  a11y: { openMenu: 'Open menu', closeMenu: 'Close menu', language: 'Language' },
  examples: {
    badge: 'Made on the platform',
    title: 'A live site example',
    subtitle: 'These AI-video sections were composed right in the Studio — this is the result.',
  },
  active: 'active',
  footer: {
    product: 'Product',
    account: 'Account',
    resources: 'Resources',
    register: 'Sign up',
    mySites: 'My sites',
    blurb: 'Describe your idea — the platform generates video and a theme, composes the pages and publishes your site on your subdomain.',
    startFree: 'Start free',
    rights: 'All rights reserved.',
    madeOn: 'Built on the platform',
  },
};

const hy: UiDict = {
  nav: {
    how: 'Ինչպես է աշխատում',
    features: 'Հնարավորություններ',
    themes: 'Թեմաներ',
    examples: 'Օրինակներ',
    builder: 'Կառուցիչ',
    studio: 'Ստուդիա',
    presets: 'Կաղապարներ',
  },
  actions: {
    login: 'Մուտք',
    start: 'Սկսել',
    logout: 'Ելք',
    dashboard: 'Վահանակ',
    sites: 'Իմ կայքերը',
    account: 'Հաշիվ',
    allThemes: 'Բոլոր թեմաները',
  },
  roles: { superadmin: 'Գերադմին', admin: 'Ադմին' },
  header: { tagline: 'AI կայքերի կառուցիչ', noName: 'Առանց անվան' },
  a11y: { openMenu: 'Բացել ընտրացանկը', closeMenu: 'Փակել ընտրացանկը', language: 'Լեզու' },
  examples: {
    badge: 'Ստեղծված հարթակում',
    title: 'Կենդանի կայքի օրինակ',
    subtitle: 'Այս AI-վիդեո բաժինները հավաքվել են հենց Ստուդիայում — ահա արդյունքը։',
  },
  active: 'ակտիվ',
  footer: {
    product: 'Արտադրանք',
    account: 'Հաշիվ',
    resources: 'Ռեսուրսներ',
    register: 'Գրանցում',
    mySites: 'Իմ կայքերը',
    blurb: 'Նկարագրեք գաղափարը — հարթակը կստեղծի վիդեո և թեմա, կհավաքի էջերը և կհրապարակի կայքը ձեր ենթատիրույթում։',
    startFree: 'Սկսել անվճար',
    rights: 'Բոլոր իրավունքները պաշտպանված են։',
    madeOn: 'Ստեղծված հարթակում',
  },
};

export const UI: Record<Locale, UiDict> = { ru, en, hy };

/** Dictionary for a locale. */
export function ui(locale: Locale): UiDict {
  return UI[locale];
}
