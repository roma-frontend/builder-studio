// Superadmin Control Center dictionary (ru/en/hy). Domain-scoped, client-safe.

import type { Locale } from '@/lib/seo';

export type CcDict = {
  title: string;
  desc: string;
  exportsBtn: string;
  opError: string;
  network: string;
  roles: { superadmin: string; admin: string; customer: string };
  tabs: { monitor: string; security: string; sessions: string; users: string; sites: string; audit: string; export: string };
  alertLevel: { critical: string; warn: string; info: string };
  alertKind: Record<string, string>;
  qualityLabel: Record<string, string>;
  // shared
  noName: string;
  you: string;
  dash: string;
  online: string;
  blocked: string;
  active: string;
  expired: string;
  justNow: string;
  minAgo: string; // {n}
  hAgo: string; // {n}
  published: string;
  draft: string;
  // confirms
  impTitle: string; impDesc: string; impConfirm: string;
  delUserTitle: string; delUserDesc: string; delConfirm: string;
  blockTitle: string; blockDesc: string; blockConfirm: string;
  unblockTitle: string; unblockDesc: string; unblockConfirm: string;
  revokeAllTitle: string; revokeAllDesc: string; revokeAllConfirm: string;
  unpubTitle: string; unpubDesc: string; unpubConfirm: string;
  delSiteTitle: string; delSiteDesc: string;
  cleanupDone: string; // {n}
  // monitor stats
  stUsers: string; stOnline: string; stSites: string; stPublished: string; stSubmissions: string; stActiveSessions: string;
  // pulse
  pulseTitle: string; pulseSub: string;
  pRegistrations: string; pLogins: string; pNewSites: string; pPublishes: string; pSubmissions: string;
  per24h: string; lastHour: string; // {n}
  // quality
  qualityTitle: string; qualityClean: string; qualityIssues: string; cleanupExpired: string; // {n} {sites}
  // hot sites
  hotTitle: string; hotNone: string;
  // backup
  backupTitle: string; backupLast: string; backupAgo: string; backupNeedUpdate: string; backupNever: string; backupDbFile: string; backupJson: string;
  // system
  sysTitle: string; sysHost: string; sysNode: string; sysDbSize: string; sysKb: string; sysIntegrations: string;
  intAiVideo: string; intLlm: string; intAnalytics: string; intServerIp: string;
  // activity
  actTitle: string; actNone: string;
  // security
  secCritical: string; secWarn: string; secInfo: string; secIn48h: string;
  secLevel: string; secEvent: string; secWho: string; secWhen: string; secNone: string;
  // sessions table
  seUser: string; seDeviceIp: string; seActivity: string; seExpires: string; seStatus: string; seRevoke: string;
  // users table
  usRole: string; usStatus: string; usSitesSessions: string; usActions: string; usDossier: string; usLoginAs: string; usRevokeAll: string; usDeleteUser: string;
  // sites table
  siSite: string; siOwner: string; siStatus: string; siActions: string; siUnpublish: string; siDeleteSite: string;
  // audit table
  auAction: string; auWho: string; auTarget: string; auWhen: string; auNone: string;
  // export
  exUsers: string; exUsersHint: string;
  exSites: string; exSitesHint: string;
  exSessions: string; exSessionsHint: string;
  exSubmissions: string; exSubmissionsHint: string;
  exAudit: string; exAuditHint: string;
  exAllDb: string; exAllDbHint: string; exSqlite: string;
  exFooter: string;
};

const ru: CcDict = {
  title: 'Центр контроля',
  desc: 'Полный мониторинг и управление платформой. Доступно только суперадмину.',
  exportsBtn: 'Экспорты',
  opError: 'Ошибка операции.',
  network: 'Сеть недоступна.',
  roles: { superadmin: 'Суперадмин', admin: 'Админ', customer: 'Клиент' },
  tabs: { monitor: 'Мониторинг', security: 'Безопасность', sessions: 'Сессии', users: 'Пользователи', sites: 'Сайты', audit: 'Аудит', export: 'Экспорт' },
  alertLevel: { critical: 'Критично', warn: 'Внимание', info: 'Инфо' },
  alertKind: {
    burst: 'Всплеск разрушительных действий',
    off_hours: 'Активность в нерабочие часы',
    export: 'Экспорт данных',
    role_change: 'Изменение роли',
    impersonation: 'Вход под пользователем',
    destructive: 'Удаление',
    many_sessions: 'Много активных сессий',
  },
  qualityLabel: {
    emptyDrafts: 'Пустые черновики',
    brokenDocs: 'Битые документы',
    staleDrafts: 'Заброшенные черновики (7+ дней)',
    unverifiedDomains: 'Неподтверждённые домены',
    orphanSubmissions: 'Заявки без сайта',
    expiredSessions: 'Истёкшие сессии в БД',
    usersNoSites: 'Пользователи без сайтов',
  },
  noName: 'Без имени', you: '(вы)', dash: '—', online: 'Онлайн', blocked: 'Заблокирован', active: 'Активна', expired: 'Истекла',
  justNow: 'только что', minAgo: '{n} мин назад', hAgo: '{n} ч назад', published: 'Опубликован', draft: 'Черновик',
  impTitle: 'Войти под пользователем {name}?', impDesc: 'Вы увидите платформу его глазами. В любой момент сможете вернуться в свой аккаунт.', impConfirm: 'Войти как',
  delUserTitle: 'Удалить {name}?', delUserDesc: 'Пользователь будет удалён вместе со всеми его сайтами, сессиями и заявками. Действие необратимо.', delConfirm: 'Удалить',
  blockTitle: 'Заблокировать {name}?', blockDesc: 'Все активные сессии будут немедленно завершены, вход в аккаунт станет невозможен до разблокировки.', blockConfirm: 'Заблокировать',
  unblockTitle: 'Разблокировать {name}?', unblockDesc: 'Пользователь снова сможет входить в аккаунт.', unblockConfirm: 'Разблокировать',
  revokeAllTitle: 'Завершить все сессии {name}?', revokeAllDesc: 'Пользователь будет разлогинен на всех устройствах, но сможет войти снова.', revokeAllConfirm: 'Завершить',
  unpubTitle: 'Снять «{name}» с публикации?', unpubDesc: 'Сайт перестанет открываться у посетителей, но черновик останется у владельца.', unpubConfirm: 'Снять',
  delSiteTitle: 'Удалить сайт «{name}»?', delSiteDesc: 'Страницы, домены и заявки сайта будут удалены безвозвратно.',
  cleanupDone: 'Очистка выполнена: удалено {n} истёкших сессий.',
  stUsers: 'Пользователи', stOnline: '{n} онлайн', stSites: 'Сайты', stPublished: '{n} опубликовано', stSubmissions: 'Заявки', stActiveSessions: 'Активные сессии',
  pulseTitle: 'Пульс платформы', pulseSub: '— 24 часа против предыдущих 24',
  pRegistrations: 'Регистрации', pLogins: 'Входы', pNewSites: 'Новые сайты', pPublishes: 'Публикации', pSubmissions: 'Заявки',
  per24h: '/ 24ч', lastHour: '{n} за последний час',
  qualityTitle: 'Качество данных', qualityClean: 'Проблем не найдено — всё чисто.', qualityIssues: '{n} проблем на {sites} сайтах.', cleanupExpired: 'Очистить истёкшие сессии',
  hotTitle: 'Горячие сайты (заявки за 24ч)', hotNone: 'За последние сутки заявок не было.',
  backupTitle: 'Резервная копия', backupLast: 'Последняя:', backupAgo: '{n} ч назад', backupNeedUpdate: '— пора обновить', backupNever: 'Резервная копия ещё ни разу не снималась.', backupDbFile: 'Файл .db', backupJson: 'JSON-снапшот',
  sysTitle: 'Система', sysHost: 'Хост', sysNode: 'Node', sysDbSize: 'Размер БД', sysKb: 'КБ', sysIntegrations: 'Интеграции',
  intAiVideo: 'ИИ-видео (MUAPI)', intLlm: 'LLM темы', intAnalytics: 'Аналитика', intServerIp: 'SERVER_IP',
  actTitle: 'Активность', actNone: 'Событий пока нет.',
  secCritical: 'Критичные', secWarn: 'Предупреждения', secInfo: 'Информационные', secIn48h: 'за 48 часов',
  secLevel: 'Уровень', secEvent: 'Событие', secWho: 'Кто', secWhen: 'Когда', secNone: 'Аномалий за последние 48 часов не обнаружено.',
  seUser: 'Пользователь', seDeviceIp: 'Устройство / IP', seActivity: 'Активность', seExpires: 'Истекает', seStatus: 'Статус', seRevoke: 'Отозвать',
  usRole: 'Роль', usStatus: 'Статус', usSitesSessions: 'Сайты / сессии', usActions: 'Действия', usDossier: 'Досье', usLoginAs: 'Войти как', usRevokeAll: 'Завершить все сессии', usDeleteUser: 'Удалить пользователя',
  siSite: 'Сайт', siOwner: 'Владелец', siStatus: 'Статус', siActions: 'Действия', siUnpublish: 'Снять', siDeleteSite: 'Удалить сайт',
  auAction: 'Действие', auWho: 'Кто', auTarget: 'Объект / детали', auWhen: 'Когда', auNone: 'Записей аудита пока нет.',
  exUsers: 'Пользователи', exUsersHint: 'ID, email, роль, статус, регистрация',
  exSites: 'Сайты', exSitesHint: 'Владельцы, публикация, даты',
  exSessions: 'Сессии', exSessionsHint: 'Устройства, IP, активность',
  exSubmissions: 'Заявки', exSubmissionsHint: 'Все формы со всех сайтов',
  exAudit: 'Аудит', exAuditHint: 'Журнал действий (до 5000)',
  exAllDb: 'Вся база данных', exAllDbHint: 'Полный бэкап для восстановления', exSqlite: 'SQLite .db',
  exFooter: 'XLSX-файлы отформатированы (фирменная шапка, зебра, автофильтр) и готовы к отправке. Каждый экспорт фиксируется в аудите.',
};

const en: CcDict = {
  title: 'Control Center',
  desc: 'Full platform monitoring and management. Superadmin only.',
  exportsBtn: 'Exports',
  opError: 'Operation failed.',
  network: 'Network unavailable.',
  roles: { superadmin: 'Superadmin', admin: 'Admin', customer: 'Customer' },
  tabs: { monitor: 'Monitoring', security: 'Security', sessions: 'Sessions', users: 'Users', sites: 'Sites', audit: 'Audit', export: 'Export' },
  alertLevel: { critical: 'Critical', warn: 'Warning', info: 'Info' },
  alertKind: {
    burst: 'Burst of destructive actions',
    off_hours: 'Off-hours activity',
    export: 'Data export',
    role_change: 'Role change',
    impersonation: 'User impersonation',
    destructive: 'Deletion',
    many_sessions: 'Many active sessions',
  },
  qualityLabel: {
    emptyDrafts: 'Empty drafts',
    brokenDocs: 'Broken documents',
    staleDrafts: 'Abandoned drafts (7+ days)',
    unverifiedDomains: 'Unverified domains',
    orphanSubmissions: 'Submissions without a site',
    expiredSessions: 'Expired sessions in DB',
    usersNoSites: 'Users without sites',
  },
  noName: 'No name', you: '(you)', dash: '—', online: 'Online', blocked: 'Blocked', active: 'Active', expired: 'Expired',
  justNow: 'just now', minAgo: '{n} min ago', hAgo: '{n} h ago', published: 'Published', draft: 'Draft',
  impTitle: 'Log in as {name}?', impDesc: 'You will see the platform through their eyes. You can return to your account at any time.', impConfirm: 'Log in as',
  delUserTitle: 'Delete {name}?', delUserDesc: 'The user will be deleted along with all their sites, sessions and submissions. This action is irreversible.', delConfirm: 'Delete',
  blockTitle: 'Block {name}?', blockDesc: 'All active sessions will be terminated immediately, sign-in will be blocked until unblocked.', blockConfirm: 'Block',
  unblockTitle: 'Unblock {name}?', unblockDesc: 'The user will be able to sign in again.', unblockConfirm: 'Unblock',
  revokeAllTitle: 'End all sessions of {name}?', revokeAllDesc: 'The user will be signed out on all devices but can sign in again.', revokeAllConfirm: 'End',
  unpubTitle: 'Unpublish “{name}”?', unpubDesc: 'The site will stop opening for visitors, but the draft will remain with the owner.', unpubConfirm: 'Unpublish',
  delSiteTitle: 'Delete site “{name}”?', delSiteDesc: 'The site pages, domains and submissions will be deleted permanently.',
  cleanupDone: 'Cleanup done: {n} expired sessions deleted.',
  stUsers: 'Users', stOnline: '{n} online', stSites: 'Sites', stPublished: '{n} published', stSubmissions: 'Submissions', stActiveSessions: 'Active sessions',
  pulseTitle: 'Platform pulse', pulseSub: '— 24 hours vs previous 24',
  pRegistrations: 'Registrations', pLogins: 'Logins', pNewSites: 'New sites', pPublishes: 'Publishes', pSubmissions: 'Submissions',
  per24h: '/ 24h', lastHour: '{n} in the last hour',
  qualityTitle: 'Data quality', qualityClean: 'No issues found — all clean.', qualityIssues: '{n} issues across {sites} sites.', cleanupExpired: 'Clean expired sessions',
  hotTitle: 'Hot sites (submissions in 24h)', hotNone: 'No submissions in the last 24 hours.',
  backupTitle: 'Backup', backupLast: 'Latest:', backupAgo: '{n} h ago', backupNeedUpdate: '— time to refresh', backupNever: 'A backup has never been taken.', backupDbFile: '.db file', backupJson: 'JSON snapshot',
  sysTitle: 'System', sysHost: 'Host', sysNode: 'Node', sysDbSize: 'DB size', sysKb: 'KB', sysIntegrations: 'Integrations',
  intAiVideo: 'AI video (MUAPI)', intLlm: 'LLM themes', intAnalytics: 'Analytics', intServerIp: 'SERVER_IP',
  actTitle: 'Activity', actNone: 'No events yet.',
  secCritical: 'Critical', secWarn: 'Warnings', secInfo: 'Informational', secIn48h: 'in 48 hours',
  secLevel: 'Level', secEvent: 'Event', secWho: 'Who', secWhen: 'When', secNone: 'No anomalies detected in the last 48 hours.',
  seUser: 'User', seDeviceIp: 'Device / IP', seActivity: 'Activity', seExpires: 'Expires', seStatus: 'Status', seRevoke: 'Revoke',
  usRole: 'Role', usStatus: 'Status', usSitesSessions: 'Sites / sessions', usActions: 'Actions', usDossier: 'Dossier', usLoginAs: 'Log in as', usRevokeAll: 'End all sessions', usDeleteUser: 'Delete user',
  siSite: 'Site', siOwner: 'Owner', siStatus: 'Status', siActions: 'Actions', siUnpublish: 'Unpublish', siDeleteSite: 'Delete site',
  auAction: 'Action', auWho: 'Who', auTarget: 'Target / details', auWhen: 'When', auNone: 'No audit records yet.',
  exUsers: 'Users', exUsersHint: 'ID, email, role, status, registration',
  exSites: 'Sites', exSitesHint: 'Owners, publication, dates',
  exSessions: 'Sessions', exSessionsHint: 'Devices, IP, activity',
  exSubmissions: 'Submissions', exSubmissionsHint: 'All forms from all sites',
  exAudit: 'Audit', exAuditHint: 'Action log (up to 5000)',
  exAllDb: 'Entire database', exAllDbHint: 'Full backup for restoration', exSqlite: 'SQLite .db',
  exFooter: 'XLSX files are formatted (branded header, zebra striping, auto-filter) and ready to send. Every export is recorded in the audit log.',
};

const hy: CcDict = {
  title: 'Կառավարման կենտրոն',
  desc: 'Հարթակի ամբողջական մոնիտորինգ և կառավարում։ Հասանելի է միայն գերադմինին։',
  exportsBtn: 'Արտահանումներ',
  opError: 'Գործողությունը ձախողվեց։',
  network: 'Ցանցն անհասանելի է։',
  roles: { superadmin: 'Գերադմին', admin: 'Ադմին', customer: 'Հաճախորդ' },
  tabs: { monitor: 'Մոնիտորինգ', security: 'Անվտանգություն', sessions: 'Սեսիաներ', users: 'Օգտատերեր', sites: 'Կայքեր', audit: 'Աուդիտ', export: 'Արտահանում' },
  alertLevel: { critical: 'Կրիտիկական', warn: 'Ուշադրություն', info: 'Ինֆո' },
  alertKind: {
    burst: 'Կործանարար գործողությունների պոռթկում',
    off_hours: 'Ակտիվություն ոչ աշխատանքային ժամերին',
    export: 'Տվյալների արտահանում',
    role_change: 'Դերի փոփոխություն',
    impersonation: 'Մուտք որպես օգտատեր',
    destructive: 'Ջնջում',
    many_sessions: 'Շատ ակտիվ սեսիաներ',
  },
  qualityLabel: {
    emptyDrafts: 'Դատարկ սևագրեր',
    brokenDocs: 'Կոտրված փաստաթղթեր',
    staleDrafts: 'Լքված սևագրեր (7+ օր)',
    unverifiedDomains: 'Չհաստատված դոմեններ',
    orphanSubmissions: 'Հայտեր առանց կայքի',
    expiredSessions: 'Ժամկետանց սեսիաներ ԲԴ-ում',
    usersNoSites: 'Օգտատերեր առանց կայքերի',
  },
  noName: 'Առանց անվան', you: '(դուք)', dash: '—', online: 'Առցանց', blocked: 'Արգելափակված', active: 'Ակտիվ', expired: 'Ժամկետանց',
  justNow: 'հենց հիմա', minAgo: '{n} րոպե առաջ', hAgo: '{n} ժ առաջ', published: 'Հրապարակված', draft: 'Սևագիր',
  impTitle: 'Մուտք գործե՞լ որպես {name}։', impDesc: 'Դուք հարթակը կտեսնեք նրա աչքերով։ Ցանկացած պահի կարող եք վերադառնալ ձեր հաշիվ։', impConfirm: 'Մուտք որպես',
  delUserTitle: 'Ջնջե՞լ {name}-ին։', delUserDesc: 'Օգտատերը կջնջվի իր բոլոր կայքերի, սեսիաների և հայտերի հետ։ Գործողությունն անշրջելի է։', delConfirm: 'Ջնջել',
  blockTitle: 'Արգելափակե՞լ {name}-ին։', blockDesc: 'Բոլոր ակտիվ սեսիաները անմիջապես կավարտվեն, մուտքն անհնար կդառնա մինչև ապաարգելափակումը։', blockConfirm: 'Արգելափակել',
  unblockTitle: 'Ապաարգելափակե՞լ {name}-ին։', unblockDesc: 'Օգտատերը կրկին կկարողանա մուտք գործել։', unblockConfirm: 'Ապաարգելափակել',
  revokeAllTitle: 'Ավարտե՞լ {name}-ի բոլոր սեսիաները։', revokeAllDesc: 'Օգտատերը դուրս կգա բոլոր սարքերից, բայց կկարողանա կրկին մուտք գործել։', revokeAllConfirm: 'Ավարտել',
  unpubTitle: 'Հանե՞լ «{name}»-ը հրապարակումից։', unpubDesc: 'Կայքը կդադարի բացվել այցելուների համար, բայց սևագիրը կմնա սեփականատիրոջ մոտ։', unpubConfirm: 'Հանել',
  delSiteTitle: 'Ջնջե՞լ «{name}» կայքը։', delSiteDesc: 'Կայքի էջերը, դոմեններն ու հայտերը կջնջվեն անվերադարձ։',
  cleanupDone: 'Մաքրումն ավարտված է՝ ջնջվել է {n} ժամկետանց սեսիա։',
  stUsers: 'Օգտատերեր', stOnline: '{n} առցանց', stSites: 'Կայքեր', stPublished: '{n} հրապարակված', stSubmissions: 'Հայտեր', stActiveSessions: 'Ակտիվ սեսիաներ',
  pulseTitle: 'Հարթակի պուլս', pulseSub: '— 24 ժամ ընդդեմ նախորդ 24-ի',
  pRegistrations: 'Գրանցումներ', pLogins: 'Մուտքեր', pNewSites: 'Նոր կայքեր', pPublishes: 'Հրապարակումներ', pSubmissions: 'Հայտեր',
  per24h: '/ 24ժ', lastHour: '{n} վերջին ժամում',
  qualityTitle: 'Տվյալների որակ', qualityClean: 'Խնդիրներ չեն հայտնաբերվել — ամեն ինչ մաքուր է։', qualityIssues: '{n} խնդիր {sites} կայքում։', cleanupExpired: 'Մաքրել ժամկետանց սեսիաները',
  hotTitle: 'Թեժ կայքեր (հայտեր 24ժ-ում)', hotNone: 'Վերջին օրվա ընթացքում հայտեր չեն եղել։',
  backupTitle: 'Պահուստային պատճեն', backupLast: 'Վերջինը՝', backupAgo: '{n} ժ առաջ', backupNeedUpdate: '— ժամանակն է թարմացնել', backupNever: 'Պահուստային պատճեն դեռ երբեք չի արվել։', backupDbFile: '.db ֆայլ', backupJson: 'JSON-պատկեր',
  sysTitle: 'Համակարգ', sysHost: 'Հոսթ', sysNode: 'Node', sysDbSize: 'ԲԴ չափ', sysKb: 'ԿԲ', sysIntegrations: 'Ինտեգրացիաներ',
  intAiVideo: 'ԱԲ-վիդեո (MUAPI)', intLlm: 'LLM թեմաներ', intAnalytics: 'Անալիտիկա', intServerIp: 'SERVER_IP',
  actTitle: 'Ակտիվություն', actNone: 'Դեռ իրադարձություններ չկան։',
  secCritical: 'Կրիտիկական', secWarn: 'Նախազգուշացումներ', secInfo: 'Տեղեկատվական', secIn48h: '48 ժամում',
  secLevel: 'Մակարդակ', secEvent: 'Իրադարձություն', secWho: 'Ով', secWhen: 'Երբ', secNone: 'Վերջին 48 ժամում անոմալիաներ չեն հայտնաբերվել։',
  seUser: 'Օգտատեր', seDeviceIp: 'Սարք / IP', seActivity: 'Ակտիվություն', seExpires: 'Ավարտվում է', seStatus: 'Կարգավիճակ', seRevoke: 'Հետ կանչել',
  usRole: 'Դեր', usStatus: 'Կարգավիճակ', usSitesSessions: 'Կայքեր / սեսիաներ', usActions: 'Գործողություններ', usDossier: 'Անձնական գործ', usLoginAs: 'Մուտք որպես', usRevokeAll: 'Ավարտել բոլոր սեսիաները', usDeleteUser: 'Ջնջել օգտատիրոջը',
  siSite: 'Կայք', siOwner: 'Սեփականատեր', siStatus: 'Կարգավիճակ', siActions: 'Գործողություններ', siUnpublish: 'Հանել', siDeleteSite: 'Ջնջել կայքը',
  auAction: 'Գործողություն', auWho: 'Ով', auTarget: 'Օբյեկտ / մանրամասներ', auWhen: 'Երբ', auNone: 'Դեռ աուդիտի գրառումներ չկան։',
  exUsers: 'Օգտատերեր', exUsersHint: 'ID, email, դեր, կարգավիճակ, գրանցում',
  exSites: 'Կայքեր', exSitesHint: 'Սեփականատերեր, հրապարակում, ամսաթվեր',
  exSessions: 'Սեսիաներ', exSessionsHint: 'Սարքեր, IP, ակտիվություն',
  exSubmissions: 'Հայտեր', exSubmissionsHint: 'Բոլոր ձևերը բոլոր կայքերից',
  exAudit: 'Աուդիտ', exAuditHint: 'Գործողությունների մատյան (մինչև 5000)',
  exAllDb: 'Ամբողջ տվյալների բազան', exAllDbHint: 'Ամբողջական պահուստ վերականգնման համար', exSqlite: 'SQLite .db',
  exFooter: 'XLSX ֆայլերը ֆորմատավորված են (ֆիրմային վերնագիր, զեբրա, ավտոֆիլտր) և պատրաստ են ուղարկելու։ Յուրաքանչյուր արտահանում գրանցվում է աուդիտում։',
};

export const CONTROL_CENTER: Record<Locale, CcDict> = { ru, en, hy };

export function ccDict(locale: Locale): CcDict {
  return CONTROL_CENTER[locale];
}
