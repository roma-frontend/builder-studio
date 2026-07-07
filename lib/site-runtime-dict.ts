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
  // forgot / reset password (tenant end-user; reset uses 8-char min)
  forgotTitle: string;
  forgotSubtitle: string;
  sendLink: string;
  forgotSentTitle: string;
  forgotSent: string;
  backToLogin: string;
  resetTitle: string;
  resetSubtitle: string;
  newPassword: string;
  repeatPassword: string;
  savePassword: string;
  resetDoneTitle: string;
  resetDoneSubtitle: string;
  resetNoTokenTitle: string;
  resetNoTokenSubtitle: string;
  requestNewLink: string;
  pwMin8: string;
  pwMin8Ph: string;
  // member content blocks (courses / documents / materials)
  membersOnly: string;
  signInToAccess: string;
  loadFailed: string;
  empty: string;
  lessonsCount: string;
  completedOf: string;
  open: string;
  download: string;
  back: string;
  markComplete: string;
  markIncomplete: string;
  completed: string;
  notFound: string;
  openLink: string;
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
  forgotTitle: 'Восстановление пароля',
  forgotSubtitle: 'Укажите email — мы отправим ссылку для сброса',
  sendLink: 'Отправить ссылку',
  forgotSentTitle: 'Проверьте почту',
  forgotSent: 'Если аккаунт с таким адресом существует, мы отправили на него ссылку для сброса пароля.',
  backToLogin: 'Вернуться ко входу',
  resetTitle: 'Новый пароль',
  resetSubtitle: 'Придумайте новый надёжный пароль для аккаунта',
  newPassword: 'Новый пароль',
  repeatPassword: 'Повторите пароль',
  savePassword: 'Сохранить пароль',
  resetDoneTitle: 'Пароль обновлён',
  resetDoneSubtitle: 'Теперь войдите с новым паролем. Все старые сессии завершены.',
  resetNoTokenTitle: 'Ссылка недействительна',
  resetNoTokenSubtitle: 'В адресе нет токена сброса. Запросите новую ссылку.',
  requestNewLink: 'Запросить новую ссылку',
  pwMin8: 'Пароль должен быть не короче 8 символов.',
  pwMin8Ph: 'Минимум 8 символов',
  membersOnly: 'Только для участников',
  signInToAccess: 'Войдите в аккаунт, чтобы получить доступ к этому разделу.',
  loadFailed: 'Не удалось загрузить.',
  empty: 'Пока ничего нет.',
  lessonsCount: 'уроков',
  completedOf: 'пройдено',
  open: 'Открыть',
  download: 'Скачать',
  back: 'Назад',
  markComplete: 'Отметить пройденным',
  markIncomplete: 'Снять отметку',
  completed: 'Пройдено',
  notFound: 'Не найдено.',
  openLink: 'Открыть ссылку',
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
  forgotTitle: 'Reset your password',
  forgotSubtitle: 'Enter your email — we’ll send a reset link',
  sendLink: 'Send link',
  forgotSentTitle: 'Check your email',
  forgotSent: 'If an account with that address exists, we’ve sent it a password reset link.',
  backToLogin: 'Back to sign in',
  resetTitle: 'New password',
  resetSubtitle: 'Choose a new strong password for your account',
  newPassword: 'New password',
  repeatPassword: 'Repeat password',
  savePassword: 'Save password',
  resetDoneTitle: 'Password updated',
  resetDoneSubtitle: 'Now sign in with your new password. All old sessions have ended.',
  resetNoTokenTitle: 'Link is invalid',
  resetNoTokenSubtitle: 'There is no reset token in the address. Request a new link.',
  requestNewLink: 'Request a new link',
  pwMin8: 'Password must be at least 8 characters.',
  pwMin8Ph: 'At least 8 characters',
  membersOnly: 'Members only',
  signInToAccess: 'Sign in to your account to access this section.',
  loadFailed: 'Could not load.',
  empty: 'Nothing here yet.',
  lessonsCount: 'lessons',
  completedOf: 'completed',
  open: 'Open',
  download: 'Download',
  back: 'Back',
  markComplete: 'Mark complete',
  markIncomplete: 'Mark incomplete',
  completed: 'Completed',
  notFound: 'Not found.',
  openLink: 'Open link',
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
  forgotTitle: 'Գաղտնաբառի վերականգնում',
  forgotSubtitle: 'Նշեք ձեր email-ը — մենք կուղարկենք վերականգնման հղում',
  sendLink: 'Ուղարկել հղումը',
  forgotSentTitle: 'Ստուգեք ձեր փոստը',
  forgotSent: 'Եթե այդ հասցեով հաշիվ գոյություն ունի, մենք ուղարկել ենք գաղտնաբառի վերականգնման հղում։',
  backToLogin: 'Վերադառնալ մուտք',
  resetTitle: 'Նոր գաղտնաբառ',
  resetSubtitle: 'Ընտրեք ձեր հաշվի համար նոր ամուր գաղտնաբառ',
  newPassword: 'Նոր գաղտնաբառ',
  repeatPassword: 'Կրկնեք գաղտնաբառը',
  savePassword: 'Պահպանել գաղտնաբառը',
  resetDoneTitle: 'Գաղտնաբառը թարմացվեց',
  resetDoneSubtitle: 'Այժմ մուտք գործեք նոր գաղտնաբառով։ Բոլոր հին սեսիաներն ավարտված են։',
  resetNoTokenTitle: 'Հղումն անվավեր է',
  resetNoTokenSubtitle: 'Հասցեում վերականգնման կոդ չկա։ Հայցեք նոր հղում։',
  requestNewLink: 'Հայցել նոր հղում',
  pwMin8: 'Գաղտնաբառը պետք է լինի առնվազն 8 նիշ։',
  pwMin8Ph: 'Առնվազն 8 նիշ',
  membersOnly: 'Միայն անդամների համար',
  signInToAccess: 'Մուտք գործեք ձեր հաշիվ՝ այս բաժնին հասանելիություն ստանալու համար։',
  loadFailed: 'Չհաջողվեց բեռնել։',
  empty: 'Դեռ ոչինչ չկա։',
  lessonsCount: 'դաս',
  completedOf: 'ավարտված',
  open: 'Բացել',
  download: 'Ներբեռնել',
  back: 'Հետ',
  markComplete: 'Նշել որպես ավարտված',
  markIncomplete: 'Հանել նշումը',
  completed: 'Ավարտված',
  notFound: 'Չի գտնվել։',
  openLink: 'Բացել հղումը',
};

export const SITE_RT: Record<Locale, SiteRtDict> = { ru, en, hy };

export function siteRt(locale: Locale): SiteRtDict {
  return SITE_RT[locale];
}
