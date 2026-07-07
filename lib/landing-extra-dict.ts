// Extra marketing copy for the upgraded, effects-rich landing sections that go
// beyond the editable landing.json (marquee band, live stats, testimonials,
// FAQ, section headers). Same ru-source + en/hy pattern as the rest of the app.
import type { Locale } from '@/lib/seo';

export interface LandingExtra {
  marquee: string[];
  trustedBy: string;
  heroPreviewLabels: { url: string; publish: string };
  stats: { title: string; subtitle: string; items: { value: string; label: string }[] };
  bento: { title: string; subtitle: string; items: { title: string; text: string }[] };
  testimonials: { title: string; subtitle: string; items: { quote: string; name: string; role: string }[] };
  faq: { title: string; subtitle: string; items: { q: string; a: string }[] };
  cta: { microcopy: string };
}

const ru: LandingExtra = {
  marquee: ['Конструктор', 'AI-генерация', 'Свой домен', 'Тёмная тема', 'Анимации', 'SEO', 'Аналитика', 'Формы', 'Мультиязычность', 'Скорость'],
  trustedBy: 'Всё, что нужно для запуска — из коробки',
  heroPreviewLabels: { url: 'ваш-сайт.ru', publish: 'Опубликовано' },
  stats: {
    title: 'Цифры, которые говорят сами за себя',
    subtitle: 'Платформа растёт вместе с вашими проектами',
    items: [
      { value: '6', label: 'готовых тем' },
      { value: '40+', label: 'блоков и секций' },
      { value: '19', label: 'эффектов в один клик' },
      { value: '100%', label: 'адаптив под любой экран' },
    ],
  },
  bento: {
    title: 'Возможности, от которых захватывает дух',
    subtitle: 'Профессиональные инструменты в интерфейсе, который понятен с первой минуты',
    items: [
      { title: 'Визуальный конструктор', text: 'Собирайте страницы из блоков перетаскиванием. Всё редактируется прямо на превью — без кода.' },
      { title: 'Кинематографичное видео', text: 'AI-генерация фоновых роликов и постеров: hero-баннеры, которые невозможно пролистать.' },
      { title: 'Движок анимаций', text: 'Появления, hover-состояния, бесконечные циклы и произвольный CSS — плавно и по-студийному.' },
      { title: 'Темы и брендинг', text: 'Шесть проработанных тем, светлая и тёмная схемы, свои шрифты и палитра в один клик.' },
      { title: 'Свой домен и SEO', text: 'Подключите домен, получите чистую разметку, sitemap и мгновенную загрузку.' },
      { title: 'Кабинеты и участники', text: 'Регистрация, роли, материалы и уведомления для клиентов вашего сайта.' },
    ],
  },
  testimonials: {
    title: 'Их уже впечатлило',
    subtitle: 'Дизайнеры и предприниматели о работе с платформой',
    items: [
      { quote: 'Собрал лендинг за вечер — выглядит так, будто над ним месяц работала студия.', name: 'Артур М.', role: 'основатель стартапа' },
      { quote: 'Анимации и темы — просто космос. Клиенты в восторге от результата.', name: 'Лия К.', role: 'веб-дизайнер' },
      { quote: 'Наконец-то конструктор, где не нужно бороться с интерфейсом. Всё интуитивно.', name: 'Давид А.', role: 'маркетолог' },
      { quote: 'AI-видео в hero-секции подняло конверсию заметно выше прошлого сайта.', name: 'Нина С.', role: 'владелица бренда' },
      { quote: 'Перенёс весь бизнес на свой домен за час. Поддержка тем — на высшем уровне.', name: 'Георгий В.', role: 'фотограф' },
      { quote: 'Ощущение, будто пользуешься инструментом уровня топовых зарубежных сервисов.', name: 'Мария Т.', role: 'продакт-дизайнер' },
    ],
  },
  faq: {
    title: 'Частые вопросы',
    subtitle: 'Коротко о главном',
    items: [
      { q: 'Нужно ли уметь программировать?', a: 'Нет. Весь сайт собирается визуально — перетаскиванием блоков и настройкой в понятной панели. Код доступен, но не обязателен.' },
      { q: 'Можно подключить свой домен?', a: 'Да, на планах Pro и Studio. Подключение занимает пару минут, дальше сайт работает на вашем адресе.' },
      { q: 'Есть ли бесплатный период?', a: 'Да — план Starter даёт 3 дня бесплатно, чтобы всё попробовать без риска.' },
      { q: 'Будут ли анимации и эффекты?', a: 'Да. Движок анимаций, hover-состояния, эффекты в один клик и произвольный CSS доступны на плане Studio.' },
      { q: 'Мой сайт будет быстрым?', a: 'Да. Оптимизированные медиа, чистая разметка и мгновенная загрузка — всё из коробки.' },
    ],
  },
  cta: { microcopy: 'Без кода · Отмена в любой момент · 3 дня бесплатно' },
};

const en: LandingExtra = {
  marquee: ['Builder', 'AI generation', 'Custom domain', 'Dark mode', 'Animations', 'SEO', 'Analytics', 'Forms', 'Multi-language', 'Speed'],
  trustedBy: 'Everything you need to launch — out of the box',
  heroPreviewLabels: { url: 'your-site.com', publish: 'Published' },
  stats: {
    title: 'Numbers that speak for themselves',
    subtitle: 'The platform grows with your projects',
    items: [
      { value: '6', label: 'ready-made themes' },
      { value: '40+', label: 'blocks & sections' },
      { value: '19', label: 'one-click effects' },
      { value: '100%', label: 'responsive on any screen' },
    ],
  },
  bento: {
    title: 'Capabilities that take your breath away',
    subtitle: 'Professional tools in an interface anyone gets in a minute',
    items: [
      { title: 'Visual builder', text: 'Compose pages from blocks by dragging. Everything edits right on the preview — no code.' },
      { title: 'Cinematic video', text: 'AI-generated background clips and posters: hero banners no one can scroll past.' },
      { title: 'Animation engine', text: 'Entrances, hover states, infinite loops and custom CSS — smooth and studio-grade.' },
      { title: 'Themes & branding', text: 'Six crafted themes, light & dark schemes, your fonts and palette in one click.' },
      { title: 'Custom domain & SEO', text: 'Connect a domain, get clean markup, a sitemap and instant loads.' },
      { title: 'Members & cabinets', text: 'Sign-up, roles, materials and notifications for your site’s customers.' },
    ],
  },
  testimonials: {
    title: 'They were already impressed',
    subtitle: 'Designers and founders on building with the platform',
    items: [
      { quote: 'Built a landing in one evening — looks like a studio worked on it for a month.', name: 'Arthur M.', role: 'startup founder' },
      { quote: 'The animations and themes are out of this world. Clients love the result.', name: 'Lia K.', role: 'web designer' },
      { quote: 'Finally a builder where you don’t fight the UI. Everything is intuitive.', name: 'David A.', role: 'marketer' },
      { quote: 'The AI hero video noticeably lifted conversion over our old site.', name: 'Nina S.', role: 'brand owner' },
      { quote: 'Moved the whole business to my own domain in an hour. Theme support is top-tier.', name: 'George V.', role: 'photographer' },
      { quote: 'Feels like using a tool on par with the best international services.', name: 'Maria T.', role: 'product designer' },
    ],
  },
  faq: {
    title: 'Frequently asked',
    subtitle: 'The essentials, briefly',
    items: [
      { q: 'Do I need to code?', a: 'No. The whole site is built visually — dragging blocks and tweaking a clear panel. Code is available but optional.' },
      { q: 'Can I connect my own domain?', a: 'Yes, on Pro and Studio. It takes a couple of minutes, then your site runs on your address.' },
      { q: 'Is there a free trial?', a: 'Yes — the Starter plan gives you 3 days free to try everything risk-free.' },
      { q: 'Do I get animations and effects?', a: 'Yes. The animation engine, hover states, one-click effects and custom CSS come with Studio.' },
      { q: 'Will my site be fast?', a: 'Yes. Optimized media, clean markup and instant loads — all out of the box.' },
    ],
  },
  cta: { microcopy: 'No code · Cancel anytime · 3 days free' },
};

const hy: LandingExtra = {
  marquee: ['Կոնստրուկտոր', 'AI գեներացիա', 'Սեփական դոմեն', 'Մուգ թեմա', 'Անիմացիաներ', 'SEO', 'Անալիտիկա', 'Ձևեր', 'Բազմալեզու', 'Արագություն'],
  trustedBy: 'Ամեն ինչ գործարկման համար՝ տուփից',
  heroPreviewLabels: { url: 'ձեր-կայքը.am', publish: 'Հրապարակված' },
  stats: {
    title: 'Թվեր, որ խոսում են իրենք իրենց փոխարեն',
    subtitle: 'Հարթակն աճում է ձեր նախագծերի հետ',
    items: [
      { value: '6', label: 'պատրաստի թեմա' },
      { value: '40+', label: 'բլոկ և բաժին' },
      { value: '19', label: 'էֆեկտ մեկ սեղմումով' },
      { value: '100%', label: 'հարմարվող ցանկացած էկրանի' },
    ],
  },
  bento: {
    title: 'Հնարավորություններ, որ շունչը կտրում են',
    subtitle: 'Պրոֆեսիոնալ գործիքներ՝ առաջին րոպեից հասկանալի ինտերֆեյսում',
    items: [
      { title: 'Վիզուալ կոնստրուկտոր', text: 'Հավաքեք էջերը բլոկներից քաշելով։ Ամեն ինչ խմբագրվում է հենց նախադիտման վրա՝ առանց կոդի։' },
      { title: 'Կինեմատոգրաֆիկ վիդեո', text: 'AI ֆոնային տեսանյութեր և պաստառներ՝ hero-բաններներ, որոնք անհնար է անտեսել։' },
      { title: 'Անիմացիայի շարժիչ', text: 'Հայտնվելներ, hover վիճակներ, անվերջ ցիկլեր և կամայական CSS՝ սահուն և ստուդիական։' },
      { title: 'Թեմաներ և բրենդինգ', text: 'Վեց մշակված թեմա, բաց և մուգ սխեմաներ, ձեր տառատեսակներն ու գույները մեկ սեղմումով։' },
      { title: 'Սեփական դոմեն և SEO', text: 'Միացրեք դոմեն, ստացեք մաքուր markup, sitemap և ակնթարթային բեռնում։' },
      { title: 'Կաբինետներ և անդամներ', text: 'Գրանցում, դերեր, նյութեր և ծանուցումներ ձեր կայքի հաճախորդների համար։' },
    ],
  },
  testimonials: {
    title: 'Նրանք արդեն տպավորվել են',
    subtitle: 'Դիզայներներ և ձեռնարկատերեր հարթակի մասին',
    items: [
      { quote: 'Մեկ երեկոյում հավաքեցի լենդինգ՝ կարծես ստուդիան մեկ ամիս աշխատել է դրա վրա։', name: 'Արթուր Մ.', role: 'ստարտափի հիմնադիր' },
      { quote: 'Անիմացիաներն ու թեմաները պարզապես տիեզերք են։ Հաճախորդները հիացած են։', name: 'Լիա Կ.', role: 'վեբ դիզայներ' },
      { quote: 'Վերջապես կոնստրուկտոր, որտեղ պետք չէ պայքարել ինտերֆեյսի հետ։', name: 'Դավիթ Ա.', role: 'մարքեթոլոգ' },
      { quote: 'Hero-բաժնի AI վիդեոն նկատելիորեն բարձրացրեց փոխարկումը։', name: 'Նինա Ս.', role: 'բրենդի սեփականատեր' },
      { quote: 'Մեկ ժամում բիզնեսը տեղափոխեցի սեփական դոմեն։ Թեմաների աջակցությունը՝ գերազանց։', name: 'Գևորգ Վ.', role: 'լուսանկարիչ' },
      { quote: 'Զգացողություն, թե օգտվում ես լավագույն միջազգային ծառայությունների մակարդակի գործիքից։', name: 'Մարիա Տ.', role: 'պրոդակտ դիզայներ' },
    ],
  },
  faq: {
    title: 'Հաճախ տրվող հարցեր',
    subtitle: 'Կարևորը՝ հակիրճ',
    items: [
      { q: 'Պե՞տք է ծրագրավորել կարողանալ։', a: 'Ոչ։ Ամբողջ կայքը հավաքվում է վիզուալ՝ բլոկներ քաշելով և հասկանալի վահանակում կարգավորելով։ Կոդը հասանելի է, բայց ոչ պարտադիր։' },
      { q: 'Կարո՞ղ եմ միացնել սեփական դոմեն։', a: 'Այո՝ Pro և Studio պլաններում։ Տևում է մի քանի րոպե, ապա կայքը աշխատում է ձեր հասցեով։' },
      { q: 'Կա՞ անվճար շրջան։', a: 'Այո՝ Starter պլանը տալիս է 3 օր անվճար՝ ամեն ինչ փորձելու համար։' },
      { q: 'Կլինե՞ն անիմացիաներ և էֆեկտներ։', a: 'Այո։ Անիմացիայի շարժիչը, hover վիճակները, էֆեկտներն ու կամայական CSS-ը հասանելի են Studio-ում։' },
      { q: 'Իմ կայքը արա՞գ կլինի։', a: 'Այո։ Օպտիմիզացված մեդիա, մաքուր markup և ակնթարթային բեռնում՝ ամեն ինչ տուփից։' },
    ],
  },
  cta: { microcopy: 'Առանց կոդի · Չեղարկում ցանկացած պահի · 3 օր անվճար' },
};

export const LANDING_EXTRA: Record<Locale, LandingExtra> = { ru, en, hy };

export function landingExtra(locale: Locale): LandingExtra {
  return LANDING_EXTRA[locale] ?? ru;
}
