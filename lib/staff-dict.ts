// Staff/superadmin dictionary (ru/en/hy): Users page + users table, All sites.
// Client- and server-safe, domain-scoped.

import type { Locale } from '@/lib/seo';

export type StaffDict = {
  roles: { superadmin: string; admin: string; customer: string };
  usersMetaTitle: string;
  usersTitle: string;
  usersDescEdit: string;
  usersDescView: string;
  // users table
  colUser: string;
  colStatus: string;
  colSites: string;
  colSessions: string;
  colRegistered: string;
  colRole: string;
  noName: string;
  you: string;
  blocked: string;
  online: string;
  justNow: string;
  minAgo: string; // {n}
  hAgo: string; // {n}
  roleChangeFailed: string;
  statusChangeFailed: string;
  networkError: string;
  dossier: string;
  block: string;
  unblock: string;
  blockTitle: string; // {name}
  blockDesc: string;
  unblockTitle: string; // {name}
  // all sites
  allMetaTitle: string;
  allTitle: string;
  allSubtitle: string;
  allEmpty: string;
  colSite: string;
  colOwner: string;
  colUpdated: string;
  published: string;
  draft: string;
  open: string;
  dash: string;
};

const ru: StaffDict = {
  roles: { superadmin: 'Суперадмин', admin: 'Админ', customer: 'Клиент' },
  usersMetaTitle: 'Пользователи',
  usersTitle: 'Пользователи',
  usersDescEdit: 'Управляйте ролями и смотрите активность аккаунтов.',
  usersDescView: 'Список аккаунтов платформы.',
  colUser: 'Пользователь',
  colStatus: 'Статус',
  colSites: 'Сайты',
  colSessions: 'Сессии',
  colRegistered: 'Регистрация',
  colRole: 'Роль',
  noName: 'Без имени',
  you: '(вы)',
  blocked: 'Заблокирован',
  online: 'Онлайн',
  justNow: 'только что',
  minAgo: '{n} мин назад',
  hAgo: '{n} ч назад',
  roleChangeFailed: 'Не удалось изменить роль.',
  statusChangeFailed: 'Не удалось изменить статус.',
  networkError: 'Сеть недоступна.',
  dossier: 'Досье',
  block: 'Заблокировать',
  unblock: 'Разблокировать',
  blockTitle: 'Заблокировать {name}?',
  blockDesc: 'Все сессии будут завершены, вход станет невозможен.',
  unblockTitle: 'Разблокировать {name}?',
  allMetaTitle: 'Все сайты',
  allTitle: 'Все сайты',
  allSubtitle: 'Каждый сайт на платформе и его владелец.',
  allEmpty: 'Сайтов пока нет',
  colSite: 'Сайт',
  colOwner: 'Владелец',
  colUpdated: 'Обновлён',
  published: 'Опубликован',
  draft: 'Черновик',
  open: 'Открыть',
  dash: '—',
};

const en: StaffDict = {
  roles: { superadmin: 'Superadmin', admin: 'Admin', customer: 'Customer' },
  usersMetaTitle: 'Users',
  usersTitle: 'Users',
  usersDescEdit: 'Manage roles and see account activity.',
  usersDescView: 'Platform accounts list.',
  colUser: 'User',
  colStatus: 'Status',
  colSites: 'Sites',
  colSessions: 'Sessions',
  colRegistered: 'Registered',
  colRole: 'Role',
  noName: 'No name',
  you: '(you)',
  blocked: 'Blocked',
  online: 'Online',
  justNow: 'just now',
  minAgo: '{n} min ago',
  hAgo: '{n} h ago',
  roleChangeFailed: 'Could not change the role.',
  statusChangeFailed: 'Could not change the status.',
  networkError: 'Network unavailable.',
  dossier: 'Dossier',
  block: 'Block',
  unblock: 'Unblock',
  blockTitle: 'Block {name}?',
  blockDesc: 'All sessions will be terminated, sign-in will be blocked.',
  unblockTitle: 'Unblock {name}?',
  allMetaTitle: 'All sites',
  allTitle: 'All sites',
  allSubtitle: 'Every site on the platform and its owner.',
  allEmpty: 'No sites yet',
  colSite: 'Site',
  colOwner: 'Owner',
  colUpdated: 'Updated',
  published: 'Published',
  draft: 'Draft',
  open: 'Open',
  dash: '—',
};

const hy: StaffDict = {
  roles: { superadmin: 'Գերադմին', admin: 'Ադմին', customer: 'Հաճախորդ' },
  usersMetaTitle: 'Օգտատերեր',
  usersTitle: 'Օգտատերեր',
  usersDescEdit: 'Կառավարեք դերերը և դիտեք հաշիվների ակտիվությունը։',
  usersDescView: 'Հարթակի հաշիվների ցանկ։',
  colUser: 'Օգտատեր',
  colStatus: 'Կարգավիճակ',
  colSites: 'Կայքեր',
  colSessions: 'Սեսիաներ',
  colRegistered: 'Գրանցում',
  colRole: 'Դեր',
  noName: 'Առանց անվան',
  you: '(դուք)',
  blocked: 'Արգելափակված',
  online: 'Առցանց',
  justNow: 'հենց հիմա',
  minAgo: '{n} րոպե առաջ',
  hAgo: '{n} ժ առաջ',
  roleChangeFailed: 'Չհաջողվեց փոխել դերը։',
  statusChangeFailed: 'Չհաջողվեց փոխել կարգավիճակը։',
  networkError: 'Ցանցն անհասանելի է։',
  dossier: 'Անձնական գործ',
  block: 'Արգելափակել',
  unblock: 'Ապաարգելափակել',
  blockTitle: 'Արգելափակե՞լ {name}-ին։',
  blockDesc: 'Բոլոր սեսիաները կդադարեցվեն, մուտքն անհնար կդառնա։',
  unblockTitle: 'Ապաարգելափակե՞լ {name}-ին։',
  allMetaTitle: 'Բոլոր կայքերը',
  allTitle: 'Բոլոր կայքերը',
  allSubtitle: 'Հարթակի յուրաքանչյուր կայք և իր սեփականատերը։',
  allEmpty: 'Կայքեր դեռ չկան',
  colSite: 'Կայք',
  colOwner: 'Սեփականատեր',
  colUpdated: 'Թարմացված',
  published: 'Հրապարակված',
  draft: 'Սևագիր',
  open: 'Բացել',
  dash: '—',
};

export const STAFF: Record<Locale, StaffDict> = { ru, en, hy };

export function staffDict(locale: Locale): StaffDict {
  return STAFF[locale];
}
