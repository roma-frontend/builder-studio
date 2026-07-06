// Dashboard UI dictionary (ru/en/hy): shell navigation, command palette, top
// bar and shared chrome. Client-safe, domain-scoped.

import type { Locale } from '@/lib/seo';

export type DashDict = {
  nav: {
    overview: string;
    sites: string;
    organization: string;
    submissions: string;
    account: string;
    users: string;
    allSites: string;
    organizations: string;
    database: string;
    control: string;
  };
  roles: { superadmin: string; admin: string; customer: string };
  brandSub: string;
  gatedTitle: string;
  gatedNote: string;
  dashboard: string;
  searchCommands: string;
  newSite: string;
  site: string;
  logout: string;
  close: string;
  menu: string;
  noName: string;
  cmd: {
    section: string;
    createSite: string;
    action: string;
    openSite: string;
    link: string;
    studio: string;
    goto: string;
    builder: string;
    logout: string;
  };
  sites: {
    title: string;
    subtitle: string;
    newNamePlaceholder: string;
    create: string;
    createFailed: string;
    networkError: string;
    publishError: string;
    published: string;
    draft: string;
    edit: string;
    open: string;
    publish: string;
    unpublish: string;
    settings: string;
    emptyTitle: string;
    emptyDesc: string;
    reqOne: string;
    reqMany: string; // contains {n}
    review: string;
  };
};

const ru: DashDict = {
  nav: {
    overview: 'Обзор',
    sites: 'Мои сайты',
    organization: 'Организация',
    submissions: 'Заявки',
    account: 'Аккаунт',
    users: 'Пользователи',
    allSites: 'Все сайты',
    organizations: 'Организации',
    database: 'База данных',
    control: 'Центр контроля',
  },
  roles: { superadmin: 'Суперадмин', admin: 'Админ', customer: 'Клиент' },
  brandSub: 'Дашборд',
  gatedTitle: 'Доступ ограничен',
  gatedNote: 'Доступ к разделам откроется после одобрения заявки суперадмином.',
  dashboard: 'Дашборд',
  searchCommands: 'Поиск команд',
  newSite: 'Новый сайт',
  site: 'Сайт',
  logout: 'Выйти',
  close: 'Закрыть',
  menu: 'Меню',
  noName: 'Без имени',
  cmd: {
    section: 'Раздел',
    createSite: 'Создать новый сайт',
    action: 'Действие',
    openSite: 'Открыть сайт',
    link: 'Ссылка',
    studio: 'Студия',
    goto: 'Переход',
    builder: 'Конструктор',
    logout: 'Выйти из аккаунта',
  },
  sites: {
    title: 'Мои сайты',
    subtitle: 'Создавайте, редактируйте и публикуйте свои сайты.',
    newNamePlaceholder: 'Название нового сайта, например «Кофейня У Ромы»',
    create: 'Создать сайт',
    createFailed: 'Не удалось создать сайт.',
    networkError: 'Сеть недоступна.',
    publishError: 'Ошибка публикации.',
    published: 'Опубликован',
    draft: 'Черновик',
    edit: 'Редактировать',
    open: 'Открыть',
    publish: 'Опубликовать',
    unpublish: 'Снять',
    settings: 'Настройки',
    emptyTitle: 'Пока ни одного сайта',
    emptyDesc: 'Создайте первый — конструктор откроется автоматически.',
    reqOne: '1 заявка на вступление',
    reqMany: '{n} заявок на вступление',
    review: 'Рассмотреть →',
  },
};

const en: DashDict = {
  nav: {
    overview: 'Overview',
    sites: 'My sites',
    organization: 'Organization',
    submissions: 'Submissions',
    account: 'Account',
    users: 'Users',
    allSites: 'All sites',
    organizations: 'Organizations',
    database: 'Database',
    control: 'Control center',
  },
  roles: { superadmin: 'Superadmin', admin: 'Admin', customer: 'Customer' },
  brandSub: 'Dashboard',
  gatedTitle: 'Access restricted',
  gatedNote: 'Sections unlock once a superadmin approves your request.',
  dashboard: 'Dashboard',
  searchCommands: 'Search commands',
  newSite: 'New site',
  site: 'Site',
  logout: 'Sign out',
  close: 'Close',
  menu: 'Menu',
  noName: 'No name',
  cmd: {
    section: 'Section',
    createSite: 'Create a new site',
    action: 'Action',
    openSite: 'Open the site',
    link: 'Link',
    studio: 'Studio',
    goto: 'Navigate',
    builder: 'Builder',
    logout: 'Sign out of the account',
  },
  sites: {
    title: 'My sites',
    subtitle: 'Create, edit and publish your sites.',
    newNamePlaceholder: 'New site name, e.g. “Roma’s Coffee”',
    create: 'Create site',
    createFailed: 'Could not create the site.',
    networkError: 'Network unavailable.',
    publishError: 'Publishing error.',
    published: 'Published',
    draft: 'Draft',
    edit: 'Edit',
    open: 'Open',
    publish: 'Publish',
    unpublish: 'Unpublish',
    settings: 'Settings',
    emptyTitle: 'No sites yet',
    emptyDesc: 'Create the first one — the builder opens automatically.',
    reqOne: '1 join request',
    reqMany: '{n} join requests',
    review: 'Review →',
  },
};

const hy: DashDict = {
  nav: {
    overview: 'Ընդհանուր',
    sites: 'Իմ կայքերը',
    organization: 'Կազմակերպություն',
    submissions: 'Հայտեր',
    account: 'Հաշիվ',
    users: 'Օգտատերեր',
    allSites: 'Բոլոր կայքերը',
    organizations: 'Կազմակերպություններ',
    database: 'Տվյալների բազա',
    control: 'Կառավարման կենտրոն',
  },
  roles: { superadmin: 'Գերադմին', admin: 'Ադմին', customer: 'Հաճախորդ' },
  brandSub: 'Վահանակ',
  gatedTitle: 'Մուտքը սահմանափակ է',
  gatedNote: 'Բաժինները կբացվեն, երբ գերադմինը հաստատի ձեր հայտը։',
  dashboard: 'Վահանակ',
  searchCommands: 'Հրամանների որոնում',
  newSite: 'Նոր կայք',
  site: 'Կայք',
  logout: 'Ելք',
  close: 'Փակել',
  menu: 'Ընտրացանկ',
  noName: 'Առանց անվան',
  cmd: {
    section: 'Բաժին',
    createSite: 'Ստեղծել նոր կայք',
    action: 'Գործողություն',
    openSite: 'Բացել կայքը',
    link: 'Հղում',
    studio: 'Ստուդիա',
    goto: 'Անցում',
    builder: 'Կառուցիչ',
    logout: 'Դուրս գալ հաշվից',
  },
  sites: {
    title: 'Իմ կայքերը',
    subtitle: 'Ստեղծեք, խմբագրեք և հրապարակեք ձեր կայքերը։',
    newNamePlaceholder: 'Նոր կայքի անուն, օրինակ՝ «Ռոմայի սրճարան»',
    create: 'Ստեղծել կայք',
    createFailed: 'Չհաջողվեց ստեղծել կայքը։',
    networkError: 'Ցանցն անհասանելի է։',
    publishError: 'Հրապարակման սխալ։',
    published: 'Հրապարակված',
    draft: 'Սևագիր',
    edit: 'Խմբագրել',
    open: 'Բացել',
    publish: 'Հրապարակել',
    unpublish: 'Հանել',
    settings: 'Կարգավորումներ',
    emptyTitle: 'Դեռ կայքեր չկան',
    emptyDesc: 'Ստեղծեք առաջինը — կառուցիչը կբացվի ինքնաբերաբար։',
    reqOne: '1 միանալու հայտ',
    reqMany: '{n} միանալու հայտ',
    review: 'Դիտել →',
  },
};

export const DASH: Record<Locale, DashDict> = { ru, en, hy };

export function dashDict(locale: Locale): DashDict {
  return DASH[locale];
}
