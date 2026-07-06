// Runtime dictionary for tenant-facing builder surfaces (published sites):
// auth blocks, account, chrome defaults, form/render-node placeholders.
// ru/en/hy. Client components call siteRt(useLocale().locale); server components
// receive the locale from the SiteRenderer.

import type { Locale } from '@/lib/seo';

export type SiteRtDict = {
  account: string;
  login: string;
  registerFree: string;
  loggedInAs: string;
  done: string;
  error: string;
  network: string;
  loginTitle: string;
  registerTitle: string;
  name: string;
  email: string;
  password: string;
  createAccount: string;
  accountTitle: string;
  signInToSee: string;
  nameLabel: string;
  logout: string;
  openMenu: string;
  closeMenu: string;
  lightTheme: string;
  darkTheme: string;
  formError: string;
  // server-rendered defaults (render-node / site-chrome)
  imagePlaceholder: string;
  videoPlaceholder: string;
  submit: string;
  thanks: string;
  motion: string;
  navigation: string;
  links: string;
  subscribe: string;
  logo: string;
  // tenant auth page specifics (platform uses 8-char min; tenant uses 6)
  loginFailed: string;
  registerFailed: string;
  pwMin6: string;
  pwMin6Ph: string;
};

const ru: SiteRtDict = {
  account: 'Кабинет',
  login: 'Войти',
  registerFree: 'Начать бесплатно',
  loggedInAs: 'Вы вошли как',
  done: 'Готово.',
  error: 'Ошибка',
  network: 'Сеть недоступна',
  loginTitle: 'Вход',
  registerTitle: 'Регистрация',
  name: 'Имя',
  email: 'Email',
  password: 'Пароль',
  createAccount: 'Создать аккаунт',
  accountTitle: 'Личный кабинет',
  signInToSee: 'Войдите, чтобы увидеть личный кабинет.',
  nameLabel: 'Имя',
  logout: 'Выйти',
  openMenu: 'Открыть меню',
  closeMenu: 'Закрыть меню',
  lightTheme: 'Светлая тема',
  darkTheme: 'Тёмная тема',
  formError: 'Не удалось отправить. Попробуйте ещё раз.',
  imagePlaceholder: 'Изображение',
  videoPlaceholder: 'Видео',
  submit: 'Отправить',
  thanks: 'Спасибо!',
  motion: 'движение',
  navigation: 'Навигация',
  links: 'Ссылки',
  subscribe: 'Подписаться',
  logo: 'Логотип',
  loginFailed: 'Не удалось войти',
  registerFailed: 'Не удалось зарегистрировать',
  pwMin6: 'Пароль должен быть не короче 6 символов.',
  pwMin6Ph: 'Минимум 6 символов',
};

const en: SiteRtDict = {
  account: 'Account',
  login: 'Log in',
  registerFree: 'Start free',
  loggedInAs: 'You are signed in as',
  done: 'Done.',
  error: 'Error',
  network: 'Network unavailable',
  loginTitle: 'Sign in',
  registerTitle: 'Sign up',
  name: 'Name',
  email: 'Email',
  password: 'Password',
  createAccount: 'Create account',
  accountTitle: 'Account',
  signInToSee: 'Sign in to see your account.',
  nameLabel: 'Name',
  logout: 'Log out',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  lightTheme: 'Light theme',
  darkTheme: 'Dark theme',
  formError: 'Could not send. Please try again.',
  imagePlaceholder: 'Image',
  videoPlaceholder: 'Video',
  submit: 'Send',
  thanks: 'Thank you!',
  motion: 'motion',
  navigation: 'Navigation',
  links: 'Links',
  subscribe: 'Subscribe',
  logo: 'Logo',
  loginFailed: 'Could not sign in',
  registerFailed: 'Could not register',
  pwMin6: 'Password must be at least 6 characters.',
  pwMin6Ph: 'At least 6 characters',
};

const hy: SiteRtDict = {
  account: 'Անձնական էջ',
  login: 'Մուտք',
  registerFree: 'Սկսել անվճար',
  loggedInAs: 'Դուք մուտք եք գործել որպես',
  done: 'Պատրաստ է։',
  error: 'Սխալ',
  network: 'Ցանցն անհասանելի է',
  loginTitle: 'Մուտք',
  registerTitle: 'Գրանցում',
  name: 'Անուն',
  email: 'Email',
  password: 'Գաղտնաբառ',
  createAccount: 'Ստեղծել հաշիվ',
  accountTitle: 'Անձնական էջ',
  signInToSee: 'Մուտք գործեք՝ ձեր անձնական էջը տեսնելու համար։',
  nameLabel: 'Անուն',
  logout: 'Դուրս գալ',
  openMenu: 'Բացել մենյուն',
  closeMenu: 'Փակել մենյուն',
  lightTheme: 'Բաց թեմա',
  darkTheme: 'Մուգ թեմա',
  formError: 'Չհաջողվեց ուղարկել։ Փորձեք կրկին։',
  imagePlaceholder: 'Պատկեր',
  videoPlaceholder: 'Վիդեո',
  submit: 'Ուղարկել',
  thanks: 'Շնորհակալություն։',
  motion: 'շարժում',
  navigation: 'Նավիգացիա',
  links: 'Հղումներ',
  subscribe: 'Բաժանորդագրվել',
  logo: 'Լոգո',
  loginFailed: 'Չհաջողվեց մուտք գործել',
  registerFailed: 'Չհաջողվեց գրանցվել',
  pwMin6: 'Գաղտնաբառը պետք է լինի առնվազն 6 նիշ։',
  pwMin6Ph: 'Առնվազն 6 նիշ',
};

export const SITE_RT: Record<Locale, SiteRtDict> = { ru, en, hy };

export function siteRt(locale: Locale): SiteRtDict {
  return SITE_RT[locale];
}
