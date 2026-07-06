// Localized column headers, sheet titles and enum cell values for the
// superadmin data export (XLSX/CSV) — see app/api/admin/export/route.ts.
// Same dict pattern as the rest of the app (ru source, en/hy translations).
import type { Locale } from '@/lib/seo';

export interface ExportDict {
  titles: { users: string; sites: string; sessions: string; submissions: string; audit: string };
  users: string[];
  sites: string[];
  sessions: string[];
  submissions: string[];
  audit: string[];
  cell: {
    active: string; // user account active
    blocked: string; // user account blocked
    yes: string;
    no: string;
    sessionActive: string;
    sessionExpired: string;
  };
}

const ru: ExportDict = {
  titles: { users: 'Пользователи', sites: 'Сайты', sessions: 'Сессии', submissions: 'Заявки', audit: 'Аудит' },
  users: ['ID', 'Email', 'Имя', 'Роль', 'Статус', 'Регистрация'],
  sites: ['ID', 'Название', 'Slug', 'Владелец', 'Email владельца', 'Опубликован', 'Публикация', 'Создан', 'Обновлён'],
  sessions: ['Пользователь', 'Email', 'Роль', 'Устройство', 'IP', 'Создана', 'Активность', 'Истекает', 'Статус'],
  submissions: ['ID', 'Сайт', 'Форма', 'Данные', 'Получена'],
  audit: ['Дата', 'Действие', 'Кто', 'Объект', 'Детали'],
  cell: { active: 'активен', blocked: 'заблокирован', yes: 'да', no: 'нет', sessionActive: 'активна', sessionExpired: 'истекла' },
};

const en: ExportDict = {
  titles: { users: 'Users', sites: 'Sites', sessions: 'Sessions', submissions: 'Submissions', audit: 'Audit' },
  users: ['ID', 'Email', 'Name', 'Role', 'Status', 'Registered'],
  sites: ['ID', 'Name', 'Slug', 'Owner', 'Owner email', 'Published', 'Published at', 'Created', 'Updated'],
  sessions: ['User', 'Email', 'Role', 'Device', 'IP', 'Created', 'Last active', 'Expires', 'Status'],
  submissions: ['ID', 'Site', 'Form', 'Data', 'Received'],
  audit: ['Date', 'Action', 'Actor', 'Target', 'Details'],
  cell: { active: 'active', blocked: 'blocked', yes: 'yes', no: 'no', sessionActive: 'active', sessionExpired: 'expired' },
};

const hy: ExportDict = {
  titles: { users: 'Օգտատերեր', sites: 'Կայքեր', sessions: 'Աշխատաշրջաններ', submissions: 'Հայտեր', audit: 'Աուդիտ' },
  users: ['ID', 'Email', 'Անուն', 'Դեր', 'Կարգավիճակ', 'Գրանցում'],
  sites: ['ID', 'Անվանում', 'Slug', 'Սեփականատեր', 'Սեփականատիրոջ email', 'Հրապարակված', 'Հրապարակման ամսաթիվ', 'Ստեղծված', 'Թարմացված'],
  sessions: ['Օգտատեր', 'Email', 'Դեր', 'Սարք', 'IP', 'Ստեղծված', 'Վերջին ակտիվություն', 'Ավարտվում է', 'Կարգավիճակ'],
  submissions: ['ID', 'Կայք', 'Ձև', 'Տվյալներ', 'Ստացված'],
  audit: ['Ամսաթիվ', 'Գործողություն', 'Ով', 'Օբյեկտ', 'Մանրամասներ'],
  cell: { active: 'ակտիվ', blocked: 'արգելափակված', yes: 'այո', no: 'ոչ', sessionActive: 'ակտիվ', sessionExpired: 'ավարտված' },
};

export const EXPORT_DICT: Record<Locale, ExportDict> = { ru, en, hy };

export function exportDict(locale: Locale): ExportDict {
  return EXPORT_DICT[locale] ?? ru;
}
