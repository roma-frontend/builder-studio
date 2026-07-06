// Seed-content localization for the visual builder. Ready-made templates,
// landings, section presets and the starter page are authored in Russian
// (lib/builder/templates.ts); at insert time we deep-walk the produced node
// tree and translate known text-bearing props via a central RU→{en,hy} map.
// Unmapped strings fall back to the original Russian, so the ru/default output
// stays byte-identical (existing tests keep passing) and coverage can grow
// incrementally without ever breaking the build.
import type { Locale } from '@/lib/seo';
import type { BuilderNode, BuilderPage } from './types';

interface Tr {
  en: string;
  hy: string;
}

// Every atomic Russian content string → English / Armenian. Composite strings
// (multiline lists, "Q::A" faq/tabs, "Label|url" socials) are split into these
// atomic segments before lookup — so only the segments need entries here.
const CONTENT: Record<string, Tr> = {
  // ── generic page titles / paths labels ──
  'Главная': { en: 'Home', hy: 'Գլխավոր' },
  'О нас': { en: 'About', hy: 'Մեր մասին' },
  'О компании': { en: 'About us', hy: 'Ընկերության մասին' },
  'Услуги': { en: 'Services', hy: 'Ծառայություններ' },
  'Тарифы': { en: 'Pricing', hy: 'Սակագներ' },
  'Контакты': { en: 'Contacts', hy: 'Կոնտակտներ' },
  'Портфолио': { en: 'Portfolio', hy: 'Պորտֆոլիո' },
  'Дашборд': { en: 'Dashboard', hy: 'Վահանակ' },
  'Документация': { en: 'Documentation', hy: 'Փաստաթղթեր' },
  'Конференция': { en: 'Conference', hy: 'Համաժողով' },

  // ── template labels + descriptions ──
  'Лендинг (SaaS)': { en: 'Landing (SaaS)', hy: 'Լենդինգ (SaaS)' },
  'Hero, преимущества, тарифы, отзыв, FAQ и форма.': { en: 'Hero, features, pricing, testimonial, FAQ and a form.', hy: 'Hero, առավելություններ, սակագներ, կարծիք, FAQ և ձև։' },
  'Заголовок, миссия, команда и цифры.': { en: 'Heading, mission, team and numbers.', hy: 'Վերնագիր, առաքելություն, թիմ և թվեր։' },
  'Три тарифа и блок FAQ.': { en: 'Three plans and a FAQ block.', hy: 'Երեք սակագին և FAQ բլոկ։' },
  'Сетка услуг и вкладки с деталями.': { en: 'Services grid and detail tabs.', hy: 'Ծառայությունների ցանց և մանրամասների ներդիրներ։' },
  'Форма обратной связи и соцсети.': { en: 'Contact form and social links.', hy: 'Հետադարձ կապի ձև և սոցցանցեր։' },
  'Галерея работ и призыв к действию.': { en: 'Work gallery and a call to action.', hy: 'Աշխատանքների պատկերասրահ և կոչ գործողության։' },
  'Дашборд (с сайдбаром)': { en: 'Dashboard (with sidebar)', hy: 'Վահանակ (կողագոտիով)' },
  'Страница с боковой панелью, метрики и карточки.': { en: 'Page with a sidebar, metrics and cards.', hy: 'Էջ կողային վահանակով, մետրիկաներ և քարտեր։' },
  'Док-сайт (с сайдбаром)': { en: 'Docs site (with sidebar)', hy: 'Փաստաթղթերի կայք (կողագոտիով)' },
  'Документация с навигацией сбоку.': { en: 'Documentation with side navigation.', hy: 'Փաստաթղթեր կողային նավիգացիայով։' },

  // ── template page descriptions (SEO) ──
  'Современный лендинг: возможности, тарифы и форма заявки.': { en: 'A modern landing: features, pricing and a lead form.', hy: 'Ժամանակակից լենդինգ՝ հնարավորություններ, սակագներ և հայտի ձև։' },
  'Кто мы, наша миссия и команда.': { en: 'Who we are, our mission and team.', hy: 'Ովքեր ենք մենք, մեր առաքելությունը և թիմը։' },
  'Прозрачные тарифы для команд любого размера.': { en: 'Transparent pricing for teams of any size.', hy: 'Թափանցիկ սակագներ ցանկացած չափի թիմերի համար։' },
  'Что мы предлагаем и как работаем.': { en: 'What we offer and how we work.', hy: 'Ինչ ենք առաջարկում և ինչպես ենք աշխատում։' },
  'Свяжитесь с нами — форма и соцсети.': { en: 'Get in touch — form and socials.', hy: 'Կապվեք մեզ հետ՝ ձև և սոցցանցեր։' },
  'Избранные проекты и кейсы.': { en: 'Selected projects and case studies.', hy: 'Ընտրված նախագծեր և դեպքեր։' },
  'Панель управления с метриками.': { en: 'A control panel with metrics.', hy: 'Կառավարման վահանակ մետրիկաներով։' },
  'Раздел документации.': { en: 'Documentation section.', hy: 'Փաստաթղթերի բաժին։' },

  // ── SaaS landing template body ──
  'Запускайте быстрее с нашим продуктом': { en: 'Launch faster with our product', hy: 'Գործարկեք ավելի արագ մեր արտադրանքով' },
  'Платформа, которая помогает командам расти. Без кода и с полным адаптивом.': { en: 'A platform that helps teams grow. No code, fully responsive.', hy: 'Հարթակ, որը օգնում է թիմերին աճել։ Առանց կոդի և լիովին ադապտիվ։' },
  'Начать бесплатно': { en: 'Start free', hy: 'Սկսել անվճար' },
  'Смотреть демо': { en: 'Watch demo', hy: 'Դիտել դեմո' },
  'Возможности': { en: 'Features', hy: 'Հնարավորություններ' },
  'Скорость': { en: 'Speed', hy: 'Արագություն' },
  'Мгновенный запуск и молниеносная загрузка страниц.': { en: 'Instant launch and lightning-fast page loads.', hy: 'Ակնթարթային գործարկում և կայծակնային էջերի բեռնում։' },
  'Гибкость': { en: 'Flexibility', hy: 'Ճկունություն' },
  'Собирайте что угодно из блоков и секций.': { en: 'Build anything from blocks and sections.', hy: 'Կառուցեք ինչ ուզեք բլոկներից և բաժիններից։' },
  'Аналитика': { en: 'Analytics', hy: 'Անալիտիկա' },
  'Понимайте пользователей с помощью встроенных метрик.': { en: 'Understand users with built-in metrics.', hy: 'Հասկացեք օգտատերերին ներկառուցված մետրիկաներով։' },
  'Начать': { en: 'Start', hy: 'Սկսել' },
  'Выбрать': { en: 'Choose', hy: 'Ընտրել' },
  'Связаться': { en: 'Contact us', hy: 'Կապվել' },
  'Собрали и запустили сайт за один вечер. Невероятно удобно!': { en: 'Built and launched a site in one evening. Incredibly easy!', hy: 'Կառուցեցինք և գործարկեցինք կայքը մեկ երեկոյում։ Աներևակայելի հարմար է։' },
  'Частые вопросы': { en: 'FAQ', hy: 'Հաճախակի հարցեր' },
  'Нужна ли карта?': { en: 'Is a card required?', hy: 'Քարտ պե՞տք է։' },
  'Нет, бесплатный тариф без карты.': { en: 'No, the free plan needs no card.', hy: 'Ոչ, անվճար սակագինը քարտ չի պահանջում։' },
  'Могу отменить?': { en: 'Can I cancel?', hy: 'Կարո՞ղ եմ չեղարկել։' },
  'Да, в любой момент.': { en: 'Yes, anytime.', hy: 'Այո, ցանկացած պահի։' },

  // ── plan features (list segments) ──
  '1 проект': { en: '1 project', hy: '1 նախագիծ' },
  'Базовые блоки': { en: 'Basic blocks', hy: 'Հիմնական բլոկներ' },
  'Сообщество': { en: 'Community', hy: 'Համայնք' },
  'Безлимит проектов': { en: 'Unlimited projects', hy: 'Անսահմանափակ նախագծեր' },
  'Все блоки': { en: 'All blocks', hy: 'Բոլոր բլոկները' },
  'Приоритет': { en: 'Priority', hy: 'Առաջնահերթություն' },
  'Всё из Pro': { en: 'Everything in Pro', hy: 'Ամեն ինչ Pro-ից' },
  'Команда': { en: 'Team', hy: 'Թիմ' },

  // ── prices / periods ──
  '0₽': { en: '$0', hy: '0֏' },
  '990₽': { en: '$12', hy: '4900֏' },
  '2990₽': { en: '$29', hy: '11900֏' },
  '/мес': { en: '/mo', hy: '/ամիս' },
  '₽1.2M': { en: '$1.2M', hy: '֏480Մ' },

  // ── starter page (freshly created site) ──
  'Добро пожаловать! Эта страница создана автоматически — откройте конструктор и соберите сайт из готовых секций и лендингов.': {
    en: 'Welcome! This page was created automatically — open the builder and assemble your site from ready-made sections and landings.',
    hy: 'Բարի գալուստ։ Այս էջը ստեղծվել է ավտոմատ — բացեք կոնստրուկտորը և հավաքեք ձեր կայքը պատրաստի բաժիններից և լենդինգներից։',
  },
  'Быстрый старт': { en: 'Quick start', hy: 'Արագ մեկնարկ' },
  'Замените этот текст на описание вашего продукта или услуги.': { en: 'Replace this text with a description of your product or service.', hy: 'Փոխարինեք այս տեքստը ձեր ապրանքի կամ ծառայության նկարագրությամբ։' },
  'Готовые секции': { en: 'Ready-made sections', hy: 'Պատրաստի բաժիններ' },
  'Добавляйте тарифы, отзывы, FAQ и галереи в пару кликов.': { en: 'Add pricing, testimonials, FAQ and galleries in a couple of clicks.', hy: 'Ավելացրեք սակագներ, կարծիքներ, FAQ և պատկերասրահներ մի քանի կլիկով։' },
  'Свой домен': { en: 'Your own domain', hy: 'Ձեր սեփական դոմեյնը' },
  'Привяжите собственный домен в настройках сайта.': { en: 'Connect your own domain in the site settings.', hy: 'Կապեք ձեր սեփական դոմեյնը կայքի կարգավորումներում։' },
  'Оставьте заявку': { en: 'Leave a request', hy: 'Թողեք հայտ' },
  'Все права защищены': { en: 'All rights reserved', hy: 'Բոլոր իրավունքները պաշտպանված են' },

  // ── common form / field strings ──
  'Отправить': { en: 'Send', hy: 'Ուղարկել' },
  'Отправить заявку': { en: 'Send request', hy: 'Ուղարկել հայտը' },
  'Спасибо! Мы свяжемся с вами.': { en: 'Thank you! We will get in touch.', hy: 'Շնորհակալություն։ Մենք կկապվենք ձեզ հետ։' },
  'Спасибо! Скоро свяжемся.': { en: 'Thank you! We will be in touch soon.', hy: 'Շնորհակալություն։ Շուտով կկապվենք։' },
  'Спасибо! Свяжемся для подтверждения.': { en: 'Thank you! We will contact you to confirm.', hy: 'Շնորհակալություն։ Կկապվենք հաստատման համար։' },
  'Имя': { en: 'Name', hy: 'Անուն' },
  'Ваше имя': { en: 'Your name', hy: 'Ձեր անունը' },
  'Как вас зовут?': { en: 'What is your name?', hy: 'Ինչպե՞ս է ձեր անունը։' },
  'Телефон': { en: 'Phone', hy: 'Հեռախոս' },
  'Сообщение': { en: 'Message', hy: 'Հաղորդագրություն' },
  'Чем можем помочь?': { en: 'How can we help?', hy: 'Ինչո՞վ կարող ենք օգնել։' },
  'Расскажите о задаче…': { en: 'Tell us about your task…', hy: 'Պատմեք ձեր խնդրի մասին…' },
  'Ваше сообщение…': { en: 'Your message…', hy: 'Ձեր հաղորդագրությունը…' },
  'Напишите нам': { en: 'Write to us', hy: 'Գրեք մեզ' },
  'Свяжитесь с нами': { en: 'Get in touch', hy: 'Կապվեք մեզ հետ' },
  'Расскажите о задаче — предложим решение и сроки.': { en: 'Tell us about your task — we will propose a solution and timeline.', hy: 'Պատմեք ձեր խնդրի մասին՝ կառաջարկենք լուծում և ժամկետներ։' },
  'Оставьте заявку — ответим в течение дня.': { en: 'Leave a request — we will reply within a day.', hy: 'Թողեք հայտ՝ կպատասխանենք օրվա ընթացքում։' },
  'Бесплатная консультация': { en: 'Free consultation', hy: 'Անվճար խորհրդատվություն' },
  'Ответ в течение дня': { en: 'Reply within a day', hy: 'Պատասխան օրվա ընթացքում' },
  'Без спама': { en: 'No spam', hy: 'Առանց սպամի' },
};

/** Translate a single atomic string (no delimiters). RU / unmapped → original. */
function atom(s: string, locale: Locale): string {
  if (locale === 'ru') return s;
  const hit = CONTENT[s.trim()];
  if (!hit) return s;
  const v = locale === 'en' ? hit.en : hit.hy;
  // preserve surrounding whitespace of the original segment
  return s.replace(s.trim(), v);
}

/** Numeric / symbol-only values we must never translate (stats, prices already mapped). */
const NUMERIC = /^[\d\s.,%+★$₽֏/–—-]+$/;

/**
 * Translate a content string, handling the composite formats used by the
 * builder props: newline-separated lists, "Q::A" pairs (faq/tabs) and
 * "Label|url" socials. Falls back to the original for anything unmapped.
 */
export function trc(s: string, locale: Locale): string {
  if (locale === 'ru' || !s) return s;
  if (CONTENT[s.trim()]) return atom(s, locale);
  if (s.includes('\n')) return s.split('\n').map((line) => trc(line, locale)).join('\n');
  if (s.includes('::')) {
    const [q, ...rest] = s.split('::');
    return `${trc(q, locale)}::${trc(rest.join('::'), locale)}`;
  }
  if (s.includes('|')) {
    const i = s.indexOf('|');
    return `${trc(s.slice(0, i), locale)}|${s.slice(i + 1)}`;
  }
  return atom(s, locale);
}

// Props whose values are human-readable content and should be translated.
const TEXT_PROPS = new Set([
  'text', 'alt', 'label', 'placeholder', 'submitText', 'successMsg', 'quote',
  'role', 'author', 'plan', 'cta', 'period', 'price', 'features', 'items', 'tabs', 'links', 'value',
]);

/** Deep-clone a node tree translating known text-bearing props. */
export function translateNode(node: BuilderNode, locale: Locale): BuilderNode {
  if (locale === 'ru') return node;
  const props: Record<string, string> = {};
  for (const [k, v] of Object.entries(node.props ?? {})) {
    if (TEXT_PROPS.has(k) && typeof v === 'string' && !(k === 'value' && NUMERIC.test(v))) {
      props[k] = trc(v, locale);
    } else {
      props[k] = v;
    }
  }
  return {
    ...node,
    props,
    children: node.children?.map((c) => translateNode(c, locale)),
  };
}

/** Deep-clone a page translating its title, description and block tree. */
export function translatePage(page: BuilderPage, locale: Locale): BuilderPage {
  if (locale === 'ru') return page;
  return {
    ...page,
    title: trc(page.title, locale),
    description: page.description ? trc(page.description, locale) : page.description,
    blocks: page.blocks.map((b) => translateNode(b, locale)),
  };
}
