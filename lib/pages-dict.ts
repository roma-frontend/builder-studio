// Dictionary for the marketing/utility pages: presets index, themes gallery,
// web-vitals. Server-safe, domain-scoped (ru/en/hy).

import type { Locale } from '@/lib/seo';

export type PagesDict = {
  presets: {
    metaTitle: string;
    metaDesc: string;
    title: string;
    intro: string;
    previewOf: string; // {title}
    customTitle: string;
    items: { product: { title: string; desc: string }; portfolio: { title: string; desc: string }; story: { title: string; desc: string } };
  };
  themes: {
    metaTitle: string;
    metaDesc: string;
    title: string;
    intro: string; // {label}
    activeOnSite: string;
    headings: string; // {font} {radius} {motion}
    sampleCard: string;
    button: string;
    triggersOn: string;
    defaultWhenNoMatch: string;
  };
  vitals: {
    metaTitle: string;
    metaDesc: string;
    title: string;
    intro: string;
    lcpTitle: string; lcpDesc: string;
    scoresTitle: string; good: string; medium: string; bad: string; scoresDesc: string; // uses good/medium/bad
    prodDevTitle: string; prodDevDesc: string;
  };
  presetPages: {
    noClips: string;
    product: {
      metaTitle: string; metaDesc: string;
      splitSubtitle: string; splitPrompt: string; splitCta: string;
      beforeAfterTitle: string; beforeAfterDesc: string;
      storyEyebrow: string; detailTitle: string; detailText: string; assembleTitle: string; assembleText: string;
      galleryTitle: string; catalogTitle: string;
    };
    portfolio: {
      metaTitle: string; metaDesc: string;
      introSubtitle: string; introPrompt: string; introCta: string;
      worksTitle: string; worksDesc: string;
      processSubtitle: string; processTitle: string; processPrompt: string; processCta: string;
      allProjectsTitle: string;
    };
    story: {
      metaTitle: string; metaDesc: string;
      ch1Eyebrow: string; ch1Title: string; ch1Text: string;
      ch2Eyebrow: string; ch2Title: string; ch2Text: string;
      ch3Eyebrow: string; ch3Title: string; ch3Text: string;
      manifestSubtitle: string; manifestTitle: string;
      milestonesTitle: string; milestonesDesc: string;
    };
  };
};

const ru: PagesDict = {
  presets: {
    metaTitle: 'Пресеты страниц — Кинематографический кит',
    metaDesc: 'Готовые шаблоны страниц, собранные из кинематографических блоков.',
    title: 'Пресеты страниц',
    intro: 'Готовые композиции из наших кинематографических блоков — ниже каждый пресет показан вживую, на текущих клипах из data/media.json. Открой любой, чтобы посмотреть в полный экран.',
    previewOf: 'Превью: {title}',
    customTitle: 'Хочешь свой пресет? Скомпонуй блоки из components/media/ в новом файле app/presets/…/page.tsx — все блоки принимают MediaEntry.',
    items: {
      product: { title: 'Продукт', desc: 'Лендинг продукта: hero, split-hero, до/после, sticky-история, мозаика и каталог.' },
      portfolio: { title: 'Портфолио', desc: 'Витрина работ на мозаике с крупными акцентными плитками и блоком о процессе.' },
      story: { title: 'История бренда', desc: 'Полноэкранный сторителлинг: sticky-главы поверх клипа и видеополоса-манифест.' },
    },
  },
  themes: {
    metaTitle: 'Темы / шаблоны — Кинематографический кит',
    metaDesc: 'Галерея дизайн-тем, которые движок подбирает под тему сайта.',
    title: 'Темы / шаблоны',
    intro: 'Движок автоматически подбирает тему под содержание сайта (палитра, шрифт заголовков, радиусы, характер анимаций). Ниже — превью в тёмной схеме и ключевые слова, по которым тема выбирается. Сейчас на сайте активна тема «{label}» — она отмечена ниже.',
    activeOnSite: 'Активна на сайте',
    headings: 'Заголовки: {font} · радиус {radius} · движение {motion}',
    sampleCard: 'Пример карточки',
    button: 'Кнопка',
    triggersOn: 'Срабатывает на',
    defaultWhenNoMatch: 'по умолчанию (если ничего не совпало)',
  },
  vitals: {
    metaTitle: 'Web Vitals — Кинематографический кит',
    metaDesc: 'Живой дашборд Core Web Vitals (LCP, INP, CLS) этой страницы.',
    title: 'Web Vitals — вживую',
    intro: 'Те же метрики производительности, что собирает Cloudflare Web Analytics, — измеряются прямо в твоём браузере через next/web-vitals. Значения появляются по мере взаимодействия со страницей (INP — после первого клика/скролла). Пороги совпадают с Core Web Vitals.',
    lcpTitle: 'LCP · INP · CLS',
    lcpDesc: 'Три ключевые метрики Google/Cloudflare. Остальные (FCP, TTFB) — вспомогательные.',
    scoresTitle: 'Оценки',
    good: 'Хорошо',
    medium: 'Средне',
    bad: 'Плохо',
    scoresDesc: '{good} ≤ порога, {medium} — между, {bad} — выше верхнего порога.',
    prodDevTitle: 'Прод vs дев',
    prodDevDesc: 'В dev-режиме числа хуже из-за несжатых бандлов — сверяйся на проде.',
  },
  presetPages: {
    noClips: 'Нет клипов в data/media.json. Сгенерируй хотя бы один в Студии, чтобы увидеть пресет.',
    product: {
      metaTitle: 'Пресет: продукт — Кинематографический кит',
      metaDesc: 'Готовый лендинг продукта, собранный из кинематографических блоков.',
      splitSubtitle: 'Особенность',
      splitPrompt: 'Опишите ключевую фишку продукта одним ёмким абзацем — здесь он выглядит кинематографично.',
      splitCta: 'Узнать больше',
      beforeAfterTitle: 'До и после',
      beforeAfterDesc: 'Перетащите ползунок — сравнение двух версий.',
      storyEyebrow: 'История',
      detailTitle: 'Каждая деталь — в кадре',
      detailText: 'Кинематографические ролики удерживают внимание там, где статичные баннеры проигрывают.',
      assembleTitle: 'Соберите за минуты',
      assembleText: 'Опишите бриф — и вся страница рождается в едином стиле.',
      galleryTitle: 'Галерея',
      catalogTitle: 'Каталог',
    },
    portfolio: {
      metaTitle: 'Пресет: портфолио — Кинематографический кит',
      metaDesc: 'Витрина работ на видеомозаике с крупными акцентными плитками.',
      introSubtitle: 'Портфолио',
      introPrompt: 'Избранные работы студии — каждая в движении. Листайте вниз и смотрите проекты вживую.',
      introCta: 'Смотреть работы',
      worksTitle: 'Работы',
      worksDesc: 'Мозаика с акцентными плитками — живая, а не статичная.',
      processSubtitle: 'Процесс',
      processTitle: 'От брифа до кадра',
      processPrompt: 'Описываете задачу — получаете страницу с фирменным видео. Стиль, свет и ритм выдержаны по всему сайту.',
      processCta: 'Обсудить проект',
      allProjectsTitle: 'Все проекты',
    },
    story: {
      metaTitle: 'Пресет: история бренда — Кинематографический кит',
      metaDesc: 'Полноэкранный сторителлинг на sticky-переходах и видеополосах.',
      ch1Eyebrow: 'Глава 1', ch1Title: 'Как всё началось', ch1Text: 'Одна идея и одна камера. Остальное — упорство.',
      ch2Eyebrow: 'Глава 2', ch2Title: 'Первый продукт', ch2Text: 'То, что казалось невозможным, стало ежедневной работой.',
      ch3Eyebrow: 'Глава 3', ch3Title: 'Сегодня', ch3Text: 'Команда, стиль и собственный киноязык бренда.',
      manifestSubtitle: 'Манифест',
      manifestTitle: 'Мы верим в силу движущегося кадра',
      milestonesTitle: 'Вехи',
      milestonesDesc: 'Моменты, которые сформировали бренд.',
    },
  },
};

const en: PagesDict = {
  presets: {
    metaTitle: 'Page presets — Cinematic Kit',
    metaDesc: 'Ready-made page templates assembled from cinematic blocks.',
    title: 'Page presets',
    intro: 'Ready-made compositions from our cinematic blocks — each preset below is shown live, on the current clips from data/media.json. Open any of them to view in full screen.',
    previewOf: 'Preview: {title}',
    customTitle: 'Want your own preset? Compose blocks from components/media/ in a new file app/presets/…/page.tsx — every block accepts a MediaEntry.',
    items: {
      product: { title: 'Product', desc: 'Product landing: hero, split-hero, before/after, sticky story, mosaic and catalog.' },
      portfolio: { title: 'Portfolio', desc: 'A works showcase on a mosaic with large accent tiles and a process block.' },
      story: { title: 'Brand story', desc: 'Full-screen storytelling: sticky chapters over a clip and a manifesto video strip.' },
    },
  },
  themes: {
    metaTitle: 'Themes / templates — Cinematic Kit',
    metaDesc: 'A gallery of design themes the engine matches to the site topic.',
    title: 'Themes / templates',
    intro: 'The engine automatically matches a theme to the site content (palette, heading font, radii, motion character). Below are previews in the dark scheme and the keywords each theme is selected by. The theme “{label}” is currently active on the site — it is marked below.',
    activeOnSite: 'Active on the site',
    headings: 'Headings: {font} · radius {radius} · motion {motion}',
    sampleCard: 'Sample card',
    button: 'Button',
    triggersOn: 'Triggers on',
    defaultWhenNoMatch: 'default (if nothing matched)',
  },
  vitals: {
    metaTitle: 'Web Vitals — Cinematic Kit',
    metaDesc: 'A live dashboard of Core Web Vitals (LCP, INP, CLS) for this page.',
    title: 'Web Vitals — live',
    intro: 'The same performance metrics Cloudflare Web Analytics collects — measured right in your browser via next/web-vitals. Values appear as you interact with the page (INP — after the first click/scroll). Thresholds match Core Web Vitals.',
    lcpTitle: 'LCP · INP · CLS',
    lcpDesc: 'The three key Google/Cloudflare metrics. The rest (FCP, TTFB) are auxiliary.',
    scoresTitle: 'Scores',
    good: 'Good',
    medium: 'Medium',
    bad: 'Poor',
    scoresDesc: '{good} ≤ threshold, {medium} — in between, {bad} — above the upper threshold.',
    prodDevTitle: 'Prod vs dev',
    prodDevDesc: 'In dev mode the numbers are worse due to uncompressed bundles — verify on production.',
  },
  presetPages: {
    noClips: 'No clips in data/media.json. Generate at least one in the Studio to see the preset.',
    product: {
      metaTitle: 'Preset: product — Cinematic Kit',
      metaDesc: 'A ready-made product landing assembled from cinematic blocks.',
      splitSubtitle: 'Feature',
      splitPrompt: 'Describe the key feature of your product in one punchy paragraph — here it looks cinematic.',
      splitCta: 'Learn more',
      beforeAfterTitle: 'Before and after',
      beforeAfterDesc: 'Drag the slider — a comparison of two versions.',
      storyEyebrow: 'Story',
      detailTitle: 'Every detail — on screen',
      detailText: 'Cinematic clips hold attention where static banners lose it.',
      assembleTitle: 'Assemble in minutes',
      assembleText: 'Describe a brief — and the whole page is born in a single style.',
      galleryTitle: 'Gallery',
      catalogTitle: 'Catalog',
    },
    portfolio: {
      metaTitle: 'Preset: portfolio — Cinematic Kit',
      metaDesc: 'A works showcase on a video mosaic with large accent tiles.',
      introSubtitle: 'Portfolio',
      introPrompt: 'Selected studio works — each one in motion. Scroll down and watch the projects live.',
      introCta: 'View works',
      worksTitle: 'Works',
      worksDesc: 'A mosaic with accent tiles — alive, not static.',
      processSubtitle: 'Process',
      processTitle: 'From brief to frame',
      processPrompt: 'You describe the task — you get a page with signature video. Style, light and rhythm are consistent across the site.',
      processCta: 'Discuss a project',
      allProjectsTitle: 'All projects',
    },
    story: {
      metaTitle: 'Preset: brand story — Cinematic Kit',
      metaDesc: 'Full-screen storytelling on sticky transitions and video bands.',
      ch1Eyebrow: 'Chapter 1', ch1Title: 'How it all began', ch1Text: 'One idea and one camera. The rest — persistence.',
      ch2Eyebrow: 'Chapter 2', ch2Title: 'The first product', ch2Text: 'What seemed impossible became everyday work.',
      ch3Eyebrow: 'Chapter 3', ch3Title: 'Today', ch3Text: 'A team, a style and the brand’s own cinematic language.',
      manifestSubtitle: 'Manifesto',
      manifestTitle: 'We believe in the power of the moving frame',
      milestonesTitle: 'Milestones',
      milestonesDesc: 'The moments that shaped the brand.',
    },
  },
};

const hy: PagesDict = {
  presets: {
    metaTitle: 'Էջերի նախակարգեր — Cinematic Kit',
    metaDesc: 'Պատրաստի էջերի ձևանմուշներ՝ հավաքված կինեմատոգրաֆիկ բլոկներից։',
    title: 'Էջերի նախակարգեր',
    intro: 'Պատրաստի կոմպոզիցիաներ մեր կինեմատոգրաֆիկ բլոկներից — ստորև յուրաքանչյուր նախակարգ ցուցադրված է կենդանի, data/media.json-ի ընթացիկ կլիպերի վրա։ Բացեք ցանկացածը՝ ամբողջ էկրանով դիտելու համար։',
    previewOf: 'Նախադիտում՝ {title}',
    customTitle: 'Ուզո՞ւմ եք ձեր նախակարգը։ Հավաքեք բլոկները components/media/-ից նոր ֆայլում՝ app/presets/…/page.tsx — բոլոր բլոկներն ընդունում են MediaEntry։',
    items: {
      product: { title: 'Ապրանք', desc: 'Ապրանքի լենդինգ՝ hero, split-hero, առաջ/հետո, sticky-պատմություն, խճանկար և կատալոգ։' },
      portfolio: { title: 'Պորտֆոլիո', desc: 'Աշխատանքների ցուցափեղկ խճանկարի վրա՝ խոշոր շեշտադրող սալիկներով և գործընթացի բլոկով։' },
      story: { title: 'Բրենդի պատմություն', desc: 'Ամբողջ էկրանով պատմում՝ sticky-գլուխներ կլիպի վրա և վիդեո-մանիֆեստ շերտ։' },
    },
  },
  themes: {
    metaTitle: 'Թեմաներ / ձևանմուշներ — Cinematic Kit',
    metaDesc: 'Դիզայն-թեմաների պատկերասրահ, որ շարժիչն ընտրում է կայքի թեմայի համար։',
    title: 'Թեմաներ / ձևանմուշներ',
    intro: 'Շարժիչն ավտոմատ ընտրում է թեմա՝ ըստ կայքի բովանդակության (գունապնակ, վերնագրերի տառատեսակ, շառավիղներ, անիմացիաների բնույթ)։ Ստորև՝ նախադիտումներ մուգ սխեմայում և բանալի բառերը, որոնցով ընտրվում է թեման։ Այժմ կայքում ակտիվ է «{label}» թեման — այն նշված է ստորև։',
    activeOnSite: 'Ակտիվ է կայքում',
    headings: 'Վերնագրեր՝ {font} · շառավիղ {radius} · շարժում {motion}',
    sampleCard: 'Քարտի օրինակ',
    button: 'Կոճակ',
    triggersOn: 'Գործարկվում է',
    defaultWhenNoMatch: 'ըստ լռելյայնի (եթե ոչինչ չհամընկավ)',
  },
  vitals: {
    metaTitle: 'Web Vitals — Cinematic Kit',
    metaDesc: 'Այս էջի Core Web Vitals-ի (LCP, INP, CLS) կենդանի վահանակ։',
    title: 'Web Vitals — կենդանի',
    intro: 'Նույն արտադրողականության մետրիկները, որ հավաքում է Cloudflare Web Analytics-ը — չափվում են անմիջապես ձեր բրաուզերում next/web-vitals-ի միջոցով։ Արժեքները հայտնվում են էջի հետ փոխազդեցության ընթացքում (INP — առաջին սեղմումից/սքրոլից հետո)։ Շեմերը համընկնում են Core Web Vitals-ի հետ։',
    lcpTitle: 'LCP · INP · CLS',
    lcpDesc: 'Google/Cloudflare-ի երեք հիմնական մետրիկները։ Մնացածը (FCP, TTFB)՝ օժանդակ։',
    scoresTitle: 'Գնահատականներ',
    good: 'Լավ',
    medium: 'Միջին',
    bad: 'Վատ',
    scoresDesc: '{good} ≤ շեմի, {medium} — միջև, {bad} — վերին շեմից բարձր։',
    prodDevTitle: 'Պրոդ vs դեv',
    prodDevDesc: 'Dev-ռեժիմում թվերն ավելի վատ են չսեղմված բանդլների պատճառով — ստուգեք պրոդում։',
  },
  presetPages: {
    noClips: 'data/media.json-ում կլիպեր չկան։ Գեներացրեք գոնե մեկը Ստուդիայում՝ նախակարգը տեսնելու համար։',
    product: {
      metaTitle: 'Նախակարգ՝ ապրանք — Cinematic Kit',
      metaDesc: 'Պատրաստի ապրանքի լենդինգ՝ հավաքված կինեմատոգրաֆիկ բլոկներից։',
      splitSubtitle: 'Առանձնահատկություն',
      splitPrompt: 'Նկարագրեք ձեր ապրանքի հիմնական առանձնահատկությունը մեկ հակիրճ պարբերությամբ — այստեղ այն կինեմատոգրաֆիկ տեսք ունի։',
      splitCta: 'Իմանալ ավելին',
      beforeAfterTitle: 'Առաջ և հետո',
      beforeAfterDesc: 'Քաշեք սահիչը — երկու տարբերակների համեմատում։',
      storyEyebrow: 'Պատմություն',
      detailTitle: 'Յուրաքանչյուր դետալ՝ կադրում',
      detailText: 'Կինեմատոգրաֆիկ կլիպերը պահում են ուշադրությունն այնտեղ, որտեղ ստատիկ բաններները տանուլ են տալիս։',
      assembleTitle: 'Հավաքեք րոպեների ընթացքում',
      assembleText: 'Նկարագրեք բրիֆը — և ամբողջ էջը ծնվում է միասնական ոճով։',
      galleryTitle: 'Պատկերասրահ',
      catalogTitle: 'Կատալոգ',
    },
    portfolio: {
      metaTitle: 'Նախակարգ՝ պորտֆոլիո — Cinematic Kit',
      metaDesc: 'Աշխատանքների ցուցափեղկ վիդեո-խճանկարի վրա՝ խոշոր շեշտադրող սալիկներով։',
      introSubtitle: 'Պորտֆոլիո',
      introPrompt: 'Ստուդիայի ընտրված աշխատանքները — յուրաքանչյուրը շարժման մեջ։ Ոլորեք ներքև և դիտեք նախագծերը կենդանի։',
      introCta: 'Դիտել աշխատանքները',
      worksTitle: 'Աշխատանքներ',
      worksDesc: 'Խճանկար շեշտադրող սալիկներով — կենդանի, ոչ ստատիկ։',
      processSubtitle: 'Գործընթաց',
      processTitle: 'Բրիֆից մինչև կադր',
      processPrompt: 'Դուք նկարագրում եք խնդիրը — ստանում եք էջ ֆիրմային վիդեոյով։ Ոճը, լույսն ու ռիթմը պահպանված են ամբողջ կայքում։',
      processCta: 'Քննարկել նախագիծը',
      allProjectsTitle: 'Բոլոր նախագծերը',
    },
    story: {
      metaTitle: 'Նախակարգ՝ բրենդի պատմություն — Cinematic Kit',
      metaDesc: 'Ամբողջ էկրանով պատմում sticky-անցումների և վիդեո-շերտերի վրա։',
      ch1Eyebrow: 'Գլուխ 1', ch1Title: 'Ինչպես ամեն ինչ սկսվեց', ch1Text: 'Մեկ գաղափար և մեկ տեսախցիկ։ Մնացածը՝ համառություն։',
      ch2Eyebrow: 'Գլուխ 2', ch2Title: 'Առաջին ապրանքը', ch2Text: 'Այն, ինչ անհնար էր թվում, դարձավ ամենօրյա աշխատանք։',
      ch3Eyebrow: 'Գլուխ 3', ch3Title: 'Այսօր', ch3Text: 'Թիմ, ոճ և բրենդի սեփական կինոլեզու։',
      manifestSubtitle: 'Մանիֆեստ',
      manifestTitle: 'Մենք հավատում ենք շարժվող կադրի ուժին',
      milestonesTitle: 'Հանգրվաններ',
      milestonesDesc: 'Պահերը, որ ձևավորեցին բրենդը։',
    },
  },
};

export const PAGES: Record<Locale, PagesDict> = { ru, en, hy };

export function pagesDict(locale: Locale): PagesDict {
  return PAGES[locale];
}
