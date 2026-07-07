// Dictionary for the per-theme demo landing (/themes/[id]). All copy is generic
// showcase text — the page has no real logic, only redirects. (ru/en/hy)

import type { Locale } from '@/lib/seo';

export type ThemeDemoDict = {
  metaSuffix: string;
  metaDesc: string; // {label}
  backToThemes: string;
  previewBadge: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  featuresTitle: string;
  featuresSubtitle: string;
  features: { title: string; body: string }[];
  showcaseTitle: string;
  showcaseBody: string;
  showcasePoints: string[];
  button: string;
  pricingTitle: string;
  pricingSubtitle: string;
  popular: string;
  perMonth: string;
  choosePlan: string;
  plans: { name: string; price: string; features: string[] }[];
  testimonials: { name: string; role: string; quote: string }[];
  finalTitle: string;
  finalSubtitle: string;
  footerNote: string;
};

const ru: ThemeDemoDict = {
  metaSuffix: 'демо темы',
  metaDesc: 'Полноценный демо-лендинг в теме «{label}» — только для предпросмотра дизайна.',
  backToThemes: 'Ко всем темам',
  previewBadge: 'Превью',
  heroEyebrow: 'Демо оформления',
  heroTitle: 'Запустите продукт, который выглядит дорого',
  heroSubtitle: 'Так будет выглядеть ваш сайт в этой теме: палитра, шрифты, скругления и анимации подобраны заранее. Это демонстрация — кнопки просто ведут дальше.',
  ctaPrimary: 'Начать бесплатно',
  ctaSecondary: 'Другие темы',
  featuresTitle: 'Всё, что нужно для старта',
  featuresSubtitle: 'Готовые блоки, продуманная типографика и единый визуальный язык.',
  features: [
    { title: 'Молниеносно', body: 'Оптимизированные страницы и мгновенная загрузка из коробки.' },
    { title: 'Надёжно', body: 'Безопасные настройки по умолчанию и предсказуемое поведение.' },
    { title: 'Красиво', body: 'Тема автоматически задаёт цвета, шрифты и характер анимаций.' },
  ],
  showcaseTitle: 'Дизайн, который продаёт',
  showcaseBody: 'Каждая секция выстроена по единой сетке и палитре темы — ничего не нужно настраивать вручную.',
  showcasePoints: ['Единая палитра и радиусы', 'Адаптивная вёрстка', 'Тёмная и светлая схемы'],
  button: 'Кнопка',
  pricingTitle: 'Простые тарифы',
  pricingSubtitle: 'Выберите план — это демо, поэтому кнопки просто ведут к регистрации.',
  popular: 'Популярный',
  perMonth: '/мес',
  choosePlan: 'Выбрать план',
  plans: [
    { name: 'Старт', price: '$0', features: ['1 сайт', 'Базовые блоки', 'Поддомен'] },
    { name: 'Про', price: '$19', features: ['10 сайтов', 'Все темы', 'Свой домен', 'Аналитика'] },
    { name: 'Бизнес', price: '$49', features: ['Безлимит сайтов', 'Команда', 'Приоритетная поддержка'] },
  ],
  testimonials: [
    { name: 'Анна', role: 'Основатель', quote: 'Собрали лендинг за вечер — выглядит как работа студии.' },
    { name: 'Максим', role: 'Маркетолог', quote: 'Тема сразу задаёт тон. Конверсия выросла заметно.' },
    { name: 'Лена', role: 'Дизайнер', quote: 'Приятно, что палитра и шрифты уже согласованы между собой.' },
  ],
  finalTitle: 'Готовы попробовать эту тему?',
  finalSubtitle: 'Создайте свой сайт с таким же оформлением за пару минут.',
  footerNote: 'Демонстрационная страница · функционал отключён',
};

const en: ThemeDemoDict = {
  metaSuffix: 'theme demo',
  metaDesc: 'A full demo landing in the “{label}” theme — for design preview only.',
  backToThemes: 'All themes',
  previewBadge: 'Preview',
  heroEyebrow: 'Design demo',
  heroTitle: 'Launch a product that looks premium',
  heroSubtitle: 'This is how your site looks in this theme: palette, fonts, radii and motion are chosen for you. It is a showcase — buttons only redirect.',
  ctaPrimary: 'Start free',
  ctaSecondary: 'Other themes',
  featuresTitle: 'Everything you need to launch',
  featuresSubtitle: 'Ready-made blocks, considered typography and one visual language.',
  features: [
    { title: 'Blazing fast', body: 'Optimized pages and instant loads out of the box.' },
    { title: 'Reliable', body: 'Secure defaults and predictable behavior everywhere.' },
    { title: 'Beautiful', body: 'The theme sets colors, fonts and motion automatically.' },
  ],
  showcaseTitle: 'Design that sells',
  showcaseBody: 'Every section follows the theme’s grid and palette — nothing to tweak by hand.',
  showcasePoints: ['One palette and radii', 'Responsive layout', 'Dark and light schemes'],
  button: 'Button',
  pricingTitle: 'Simple pricing',
  pricingSubtitle: 'Pick a plan — this is a demo, so buttons just lead to sign-up.',
  popular: 'Popular',
  perMonth: '/mo',
  choosePlan: 'Choose plan',
  plans: [
    { name: 'Start', price: '$0', features: ['1 site', 'Basic blocks', 'Subdomain'] },
    { name: 'Pro', price: '$19', features: ['10 sites', 'All themes', 'Custom domain', 'Analytics'] },
    { name: 'Business', price: '$49', features: ['Unlimited sites', 'Team', 'Priority support'] },
  ],
  testimonials: [
    { name: 'Anna', role: 'Founder', quote: 'Built a landing in an evening — looks like studio work.' },
    { name: 'Max', role: 'Marketer', quote: 'The theme sets the tone instantly. Conversions went up.' },
    { name: 'Lena', role: 'Designer', quote: 'Love that the palette and fonts already harmonize.' },
  ],
  finalTitle: 'Ready to try this theme?',
  finalSubtitle: 'Create your own site with this exact look in minutes.',
  footerNote: 'Demo page · functionality disabled',
};

const hy: ThemeDemoDict = {
  metaSuffix: 'թեմայի դեմո',
  metaDesc: '«{label}» թեմայով լիարժեք դեմո լենդինգ — միայn դիզայնի նախադիտման համար։',
  backToThemes: 'Բոլոր թեմաները',
  previewBadge: 'Նախադիտում',
  heroEyebrow: 'Դիզայնի դեմո',
  heroTitle: 'Գործարկեք արտադրանք, որ թանկ տեսք ունի',
  heroSubtitle: 'Ահա թե ինչպես կունենա ձեր կայքն այս թեմայում՝ գունապնակ, տառատեսակներ, շառավիղներ և անիմացիաներ արդեն ընտրված են։ Սա ցուցադրություն է — կոճակները միայն ուղղորդում են։',
  ctaPrimary: 'Սկսել անվճar',
  ctaSecondary: 'Այլ թեմաներ',
  featuresTitle: 'Ամեն ինչ մեկնարկի համար',
  featuresSubtitle: 'Պատրաստ բլոկներ, մտածված տիպոգրաֆիա և մեկ վիզուալ լեզու։',
  features: [
    { title: 'Կայծակնային', body: 'Օպտիմիզացված էջեր և ակնթարթային բեռնում։' },
    { title: 'Հուսալի', body: 'Անվտանգ կանխադրված կարգավորումներ և կանխատեսելի վարք։' },
    { title: 'Գեղեցիկ', body: 'Թեման ինքնաշխատ սահմանում է գույներ, տառատեսակներ և անիմացիա։' },
  ],
  showcaseTitle: 'Դիզայն, որ վաճառում է',
  showcaseBody: 'Յուրաքանչյուր բաժին հետևում է թեմայի ցանցին ու գունապնակին։',
  showcasePoints: ['Մեկ գունապնակ և շառավիղներ', 'Ադապտիվ դասավորություն', 'Մուգ և բաց սխեմաներ'],
  button: 'Կոճак',
  pricingTitle: 'Պարզ սակագներ',
  pricingSubtitle: 'Ընտրեք պլան — սա դեմո է, կոճակները տանում են գրանցման։',
  popular: 'Հանրահայտ',
  perMonth: '/ամիս',
  choosePlan: 'Ընտրել պլանը',
  plans: [
    { name: 'Ստարտ', price: '$0', features: ['1 կայք', 'Հիմնական բլոկներ', 'Ենթադոմեն'] },
    { name: 'Պրո', price: '$19', features: ['10 կայք', 'Բոլոր թեմաները', 'Սեփական դոմեն', 'Անալիտիկա'] },
    { name: 'Բիզնес', price: '$49', features: ['Անսահման կայքեր', 'Թիմ', 'Առաջնահերթ աջակցություն'] },
  ],
  testimonials: [
    { name: 'Աննա', role: 'Հիմնադիր', quote: 'Լենդինգը հավաքեցի մեկ երեկոյում — ստուդիայի աշխատանք է թվում։' },
    { name: 'Մաքս', role: 'Մարքեթer', quote: 'Թեման անմիջապես տոն է տալիս։ Կոնվերսիան աճեց։' },
    { name: 'Լենա', role: 'Դիզայներ', quote: 'Հաճելի է, որ գունապնակն ու տառատեսակներն արդեն համահունչ են։' },
  ],
  finalTitle: 'Պատրա՞ստ եք փորձել այս թեման',
  finalSubtitle: 'Ստեղծեք ձեր կայքը նույն տեսքով րոպեների ընթացքում։',
  footerNote: 'Դեմո էջ · ֆունկցիոնալն անջատված է',
};

export const THEME_DEMO: Record<Locale, ThemeDemoDict> = { ru, en, hy };

export function themeDemoDict(locale: Locale): ThemeDemoDict {
  return THEME_DEMO[locale];
}
