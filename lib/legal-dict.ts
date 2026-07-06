// Platform legal document dictionaries (ru source + en/hy). Dependency-free so
// it can be imported from server pages and metadata alike. Text uses two
// placeholders resolved at render time: {SITE} (platform name) and {EMAIL}
// (contact address) — see components/legal-page.tsx.

import type { Locale } from '@/lib/seo';

export interface LegalSection {
  heading: string;
  body: string[];
}
export interface LegalDoc {
  title: string;
  tagline: string;
  sections: LegalSection[];
}
export interface LegalDict {
  updatedLabel: string;
  disclaimer: string;
  tocLabel: string;
  privacy: LegalDoc;
  terms: LegalDoc;
  cookies: LegalDoc;
  acceptableUse: LegalDoc;
}

const ru: LegalDict = {
  updatedLabel: 'Обновлено',
  tocLabel: 'Содержание',
  disclaimer:
    'Эти документы представляют собой настраиваемые шаблоны и не являются юридической консультацией. ' +
    'Перед публикацией оператор платформы должен адаптировать их под свою деятельность и передать на ' +
    'проверку квалифицированному юристу.',
  privacy: {
    title: 'Политика конфиденциальности',
    tagline: 'Как {SITE} собирает, использует и защищает ваши персональные данные.',
    sections: [
      {
        heading: 'Какие данные мы собираем',
        body: [
          'При создании аккаунта мы собираем ваш адрес электронной почты и имя. Мы также храним контент, ' +
            'который вы создаёте на платформе: тексты, изображения, видео и настройки сайтов.',
          'Автоматически мы получаем технические данные: IP-адрес, тип браузера и устройства, а также ' +
            'обезличенную статистику использования через файлы cookie и аналитику.',
        ],
      },
      {
        heading: 'Как мы используем данные',
        body: [
          'Данные используются для предоставления и улучшения сервиса, аутентификации, публикации ваших ' +
            'сайтов, связи с вами по важным вопросам и обеспечения безопасности платформы.',
        ],
      },
      {
        heading: 'Правовые основания (GDPR)',
        body: [
          'Мы обрабатываем данные на основании исполнения договора (предоставление сервиса), нашего ' +
            'законного интереса (безопасность и улучшение продукта), вашего согласия (аналитика и cookie) ' +
            'и соблюдения правовых обязательств.',
        ],
      },
      {
        heading: 'Файлы cookie',
        body: [
          'Мы используем необходимые файлы cookie для работы сервиса и обезличенную аналитику. Подробности ' +
            'изложены в отдельной Политике использования файлов cookie.',
        ],
      },
      {
        heading: 'Третьи стороны и субподрядчики',
        body: [
          'Для работы платформы мы привлекаем поставщиков услуг (хостинг, аналитика, генерация видео). ' +
            'Они обрабатывают данные только по нашим инструкциям и обязаны обеспечивать их защиту.',
        ],
      },
      {
        heading: 'Хранение данных',
        body: [
          'Мы храним данные столько, сколько необходимо для предоставления сервиса и соблюдения правовых ' +
            'обязательств. После удаления аккаунта данные удаляются или обезличиваются в разумные сроки.',
        ],
      },
      {
        heading: 'Ваши права',
        body: [
          'В соответствии с GDPR и CCPA вы имеете право на доступ, исправление, удаление и перенос ваших ' +
            'данных, а также на ограничение обработки и отзыв согласия. Для реализации прав напишите на {EMAIL}.',
        ],
      },
      {
        heading: 'Международная передача',
        body: [
          'Ваши данные могут обрабатываться в других странах. В таких случаях мы применяем надлежащие меры ' +
            'защиты, включая стандартные договорные положения.',
        ],
      },
      {
        heading: 'Дети, безопасность и изменения',
        body: [
          'Сервис не предназначен для детей младше 16 лет. Мы применяем технические и организационные меры ' +
            'для защиты данных, но не можем гарантировать абсолютную безопасность.',
          'Мы можем обновлять эту политику; существенные изменения будут опубликованы на этой странице. ' +
            'По вопросам конфиденциальности обращайтесь: {EMAIL}.',
        ],
      },
    ],
  },
  terms: {
    title: 'Условия использования',
    tagline: 'Правила использования платформы {SITE}.',
    sections: [
      {
        heading: 'Принятие условий',
        body: [
          'Используя {SITE}, вы соглашаетесь с настоящими Условиями. Если вы не согласны, пожалуйста, не ' +
            'используйте сервис.',
        ],
      },
      {
        heading: 'Описание сервиса',
        body: [
          '{SITE} — это конструктор сайтов на основе ИИ, который позволяет генерировать видео-секции, темы ' +
            'и публиковать сайты на поддомене или собственном домене.',
        ],
      },
      {
        heading: 'Аккаунты и право использования',
        body: [
          'Вы обязаны предоставлять достоверные данные и нести ответственность за сохранность учётных ' +
            'данных. Использование сервиса разрешено лицам старше 16 лет.',
        ],
      },
      {
        heading: 'Допустимое использование',
        body: [
          'Использование сервиса регулируется Политикой допустимого использования. Запрещённый контент и ' +
            'действия могут привести к приостановке аккаунта.',
        ],
      },
      {
        heading: 'Пользовательский контент и лицензия',
        body: [
          'Вы сохраняете права на созданный вами контент. Вы предоставляете {SITE} ограниченную лицензию ' +
            'на хостинг, обработку и отображение контента исключительно для работы сервиса.',
        ],
      },
      {
        heading: 'Интеллектуальная собственность',
        body: [
          'Платформа, её код, дизайн и торговые марки принадлежат оператору {SITE}. Никакие права на них ' +
            'не передаются, кроме прямо предоставленных.',
        ],
      },
      {
        heading: 'Подписки, оплата и отмена',
        body: [
          'Если применяются платные тарифы, условия оплаты и отмены указываются при оформлении. Вы можете ' +
            'отменить подписку в любой момент; оплаченные периоды, как правило, не возвращаются.',
        ],
      },
      {
        heading: 'Отказ от гарантий и ограничение ответственности',
        body: [
          'Сервис предоставляется «как есть» без каких-либо гарантий. В максимально допустимой законом ' +
            'степени {SITE} не несёт ответственности за косвенные или случайные убытки.',
          'Вы обязуетесь возместить убытки, возникшие в результате нарушения вами настоящих Условий или ' +
            'прав третьих лиц.',
        ],
      },
      {
        heading: 'Прекращение, право и изменения',
        body: [
          'Мы можем приостановить или прекратить доступ при нарушении Условий. Настоящие Условия регулируются ' +
            'применимым правом оператора платформы.',
          'Мы можем обновлять Условия; продолжение использования означает согласие с изменениями. Контакт: {EMAIL}.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Политика использования файлов cookie',
    tagline: 'Как {SITE} использует файлы cookie и аналогичные технологии.',
    sections: [
      {
        heading: 'Что такое файлы cookie',
        body: [
          'Файлы cookie — это небольшие текстовые файлы, сохраняемые на вашем устройстве, которые помогают ' +
            'сайту запоминать ваши предпочтения и работать корректно.',
        ],
      },
      {
        heading: 'Необходимые cookie',
        body: [
          'Мы используем строго необходимые файлы cookie, например NEXT_LOCALE (сохранение выбранного языка) ' +
            'и сессионные cookie для аутентификации. Без них сервис не может работать.',
        ],
      },
      {
        heading: 'Аналитика',
        body: [
          'Для статистики мы используем Cloudflare Web Analytics — решение без использования cookie, ' +
            'которое не отслеживает пользователей между сайтами и не собирает персональные данные.',
        ],
      },
      {
        heading: 'Как управлять и отказаться',
        body: [
          'Вы можете управлять файлами cookie в настройках браузера и удалять их в любое время. Отключение ' +
            'необходимых cookie может нарушить работу сервиса.',
        ],
      },
      {
        heading: 'Изменения и контакт',
        body: [
          'Мы можем обновлять эту политику по мере изменения используемых технологий. По вопросам ' +
            'обращайтесь: {EMAIL}.',
        ],
      },
    ],
  },
  acceptableUse: {
    title: 'Политика допустимого использования',
    tagline: 'Что разрешено и запрещено при использовании {SITE}.',
    sections: [
      {
        heading: 'Запрещённый контент',
        body: [
          'Запрещено размещать незаконный контент, вредоносное ПО, фишинг, материалы, нарушающие права ' +
            'интеллектуальной собственности, разжигающие ненависть или содержащие травлю.',
          'Материалы сексуального характера с участием несовершеннолетних (CSAM) строго запрещены и будут ' +
            'переданы в компетентные органы. Спам и вводящий в заблуждение контент также запрещены.',
        ],
      },
      {
        heading: 'Запрещённые действия',
        body: [
          'Запрещены скрейпинг, чрезмерная нагрузка на инфраструктуру, обход технических ограничений и ' +
            'квот, а также попытки несанкционированного доступа к системам платформы.',
        ],
      },
      {
        heading: 'Ответственность за сайты арендаторов',
        body: [
          'Вы несёте полную ответственность за контент и деятельность сайтов, которые вы создаёте и ' +
            'публикуете на платформе, включая соблюдение применимого законодательства.',
        ],
      },
      {
        heading: 'Контроль и приостановка',
        body: [
          'Мы вправе проверять, удалять контент и приостанавливать или блокировать аккаунты, нарушающие ' +
            'настоящую политику, без предварительного уведомления при серьёзных нарушениях.',
        ],
      },
      {
        heading: 'Сообщение о нарушениях',
        body: [
          'Если вы обнаружили контент, нарушающий эту политику, сообщите нам по адресу {EMAIL}. Мы ' +
            'рассмотрим обращение в разумные сроки.',
        ],
      },
      {
        heading: 'Изменения',
        body: [
          'Мы можем обновлять эту политику. Актуальная версия всегда доступна на этой странице. Контакт: {EMAIL}.',
        ],
      },
    ],
  },
};


const en: LegalDict = {
  updatedLabel: 'Updated',
  tocLabel: 'Contents',
  disclaimer:
    'These documents are customizable templates and do not constitute legal advice. Before publishing, ' +
    'the platform operator should adapt them to their operations and have them reviewed by qualified ' +
    'legal counsel.',
  privacy: {
    title: 'Privacy Policy',
    tagline: 'How {SITE} collects, uses and protects your personal data.',
    sections: [
      {
        heading: 'Data we collect',
        body: [
          'When you create an account we collect your email address and name. We also store the content you ' +
            'create on the platform: text, images, video and site settings.',
          'We automatically receive technical data: IP address, browser and device type, and anonymized ' +
            'usage statistics via cookies and analytics.',
        ],
      },
      {
        heading: 'How we use data',
        body: [
          'Data is used to provide and improve the service, authenticate you, publish your sites, contact ' +
            'you about important matters and keep the platform secure.',
        ],
      },
      {
        heading: 'Legal bases (GDPR)',
        body: [
          'We process data on the basis of contract performance (providing the service), our legitimate ' +
            'interest (security and product improvement), your consent (analytics and cookies) and ' +
            'compliance with legal obligations.',
        ],
      },
      {
        heading: 'Cookies',
        body: [
          'We use essential cookies to operate the service and anonymized analytics. Details are set out in ' +
            'our separate Cookie Policy.',
        ],
      },
      {
        heading: 'Third parties and subprocessors',
        body: [
          'To operate the platform we rely on service providers (hosting, analytics, video generation). They ' +
            'process data only on our instructions and are required to protect it.',
        ],
      },
      {
        heading: 'Data retention',
        body: [
          'We retain data for as long as needed to provide the service and meet legal obligations. After you ' +
            'delete your account, data is deleted or anonymized within a reasonable period.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Under GDPR and CCPA you have the right to access, rectify, erase and port your data, as well as to ' +
            'restrict processing and withdraw consent. To exercise your rights, write to {EMAIL}.',
        ],
      },
      {
        heading: 'International transfers',
        body: [
          'Your data may be processed in other countries. In such cases we apply appropriate safeguards, ' +
            'including standard contractual clauses.',
        ],
      },
      {
        heading: 'Children, security and changes',
        body: [
          'The service is not intended for children under 16. We apply technical and organizational measures ' +
            'to protect data but cannot guarantee absolute security.',
          'We may update this policy; material changes will be posted on this page. For privacy questions, ' +
            'contact {EMAIL}.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    tagline: 'The rules for using the {SITE} platform.',
    sections: [
      {
        heading: 'Acceptance',
        body: [
          'By using {SITE} you agree to these Terms. If you do not agree, please do not use the service.',
        ],
      },
      {
        heading: 'Description of the service',
        body: [
          '{SITE} is an AI-powered website builder that lets you generate video sections and themes and ' +
            'publish sites on a subdomain or custom domain.',
        ],
      },
      {
        heading: 'Accounts and eligibility',
        body: [
          'You must provide accurate information and are responsible for safeguarding your credentials. Use ' +
            'of the service is permitted for users aged 16 and over.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          'Your use is governed by the Acceptable Use Policy. Prohibited content and conduct may result in ' +
            'suspension of your account.',
        ],
      },
      {
        heading: 'User content and license',
        body: [
          'You retain rights to content you create. You grant {SITE} a limited license to host, process and ' +
            'display your content solely to operate the service.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          'The platform, its code, design and trademarks belong to the operator of {SITE}. No rights are ' +
            'transferred except those expressly granted.',
        ],
      },
      {
        heading: 'Subscriptions, fees and cancellation',
        body: [
          'Where paid plans apply, payment and cancellation terms are presented at checkout. You may cancel ' +
            'at any time; paid periods are generally non-refundable.',
        ],
      },
      {
        heading: 'Disclaimers and limitation of liability',
        body: [
          'The service is provided “as is” without warranties of any kind. To the maximum extent permitted ' +
            'by law, {SITE} is not liable for indirect or incidental damages.',
          'You agree to indemnify us for losses arising from your breach of these Terms or the rights of ' +
            'third parties.',
        ],
      },
      {
        heading: 'Termination, governing law and changes',
        body: [
          'We may suspend or terminate access for breach of these Terms. These Terms are governed by the ' +
            'applicable law of the platform operator.',
          'We may update these Terms; continued use means acceptance of the changes. Contact: {EMAIL}.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    tagline: 'How {SITE} uses cookies and similar technologies.',
    sections: [
      {
        heading: 'What cookies are',
        body: [
          'Cookies are small text files stored on your device that help a site remember your preferences and ' +
            'function correctly.',
        ],
      },
      {
        heading: 'Essential cookies',
        body: [
          'We use strictly necessary cookies such as NEXT_LOCALE (to remember your chosen language) and ' +
            'session cookies for authentication. The service cannot work without them.',
        ],
      },
      {
        heading: 'Analytics',
        body: [
          'For statistics we use Cloudflare Web Analytics — a cookieless solution that does not track users ' +
            'across sites and does not collect personal data.',
        ],
      },
      {
        heading: 'How to control and opt out',
        body: [
          'You can manage cookies in your browser settings and delete them at any time. Disabling essential ' +
            'cookies may break the service.',
        ],
      },
      {
        heading: 'Changes and contact',
        body: [
          'We may update this policy as the technologies we use change. For questions, contact {EMAIL}.',
        ],
      },
    ],
  },
  acceptableUse: {
    title: 'Acceptable Use Policy',
    tagline: 'What is allowed and prohibited when using {SITE}.',
    sections: [
      {
        heading: 'Prohibited content',
        body: [
          'You may not post illegal content, malware, phishing, material that infringes intellectual property ' +
            'rights, or content that promotes hate or harassment.',
          'Child sexual abuse material (CSAM) is strictly forbidden and will be reported to the authorities. ' +
            'Spam and deceptive content are also prohibited.',
        ],
      },
      {
        heading: 'Prohibited conduct',
        body: [
          'Scraping, overloading our infrastructure, circumventing technical limits and quotas, and ' +
            'attempting unauthorized access to platform systems are prohibited.',
        ],
      },
      {
        heading: 'Tenant site responsibility',
        body: [
          'You are fully responsible for the content and activity of the sites you create and publish on the ' +
            'platform, including compliance with applicable law.',
        ],
      },
      {
        heading: 'Enforcement and suspension',
        body: [
          'We may review and remove content and suspend or block accounts that violate this policy, without ' +
            'prior notice in cases of serious violations.',
        ],
      },
      {
        heading: 'Reporting abuse',
        body: [
          'If you find content that violates this policy, report it to {EMAIL}. We will review your report ' +
            'within a reasonable time.',
        ],
      },
      {
        heading: 'Changes',
        body: [
          'We may update this policy. The current version is always available on this page. Contact: {EMAIL}.',
        ],
      },
    ],
  },
};


const hy: LegalDict = {
  updatedLabel: 'Թարմացվել է',
  tocLabel: 'Բովանդակություն',
  disclaimer:
    'Այս փաստաթղթերը հարմարեցվող կաղապարներ են և իրավաբանական խորհրդատվություն չեն։ Հրապարակելուց առաջ ' +
    'հարթակի օպերատորը պետք է դրանք հարմարեցնի իր գործունեությանը և ստուգել տա որակավորված իրավաբանի կողմից։',
  privacy: {
    title: 'Գաղտնիության քաղաքականություն',
    tagline: 'Ինչպես է {SITE}-ը հավաքում, օգտագործում և պաշտպանում ձեր անձնական տվյալները։',
    sections: [
      {
        heading: 'Ինչ տվյալներ ենք հավաքում',
        body: [
          'Հաշիվ ստեղծելիս մենք հավաքում ենք ձեր էլ. փոստի հասցեն և անունը։ Մենք նաև պահում ենք ձեր ստեղծած ' +
            'բովանդակությունը՝ տեքստեր, պատկերներ, վիդեո և կայքի կարգավորումներ։',
          'Ավտոմատ կերպով մենք ստանում ենք տեխնիկական տվյալներ՝ IP-հասցե, դիտարկիչի և սարքի տեսակ, ինչպես նաև ' +
            'անանուն օգտագործման վիճակագրություն՝ cookie-ների և վերլուծության միջոցով։',
        ],
      },
      {
        heading: 'Ինչպես ենք օգտագործում տվյալները',
        body: [
          'Տվյալներն օգտագործվում են ծառայությունը մատուցելու և բարելավելու, նույնականացման, ձեր կայքերը ' +
            'հրապարակելու, ձեզ հետ կապ հաստատելու և հարթակի անվտանգությունն ապահովելու համար։',
        ],
      },
      {
        heading: 'Իրավական հիմքեր (GDPR)',
        body: [
          'Մենք մշակում ենք տվյալները պայմանագրի կատարման (ծառայության մատուցում), մեր օրինական շահի ' +
            '(անվտանգություն և բարելավում), ձեր համաձայնության (վերլուծություն և cookie) և իրավական ' +
            'պարտավորությունների կատարման հիմքով։',
        ],
      },
      {
        heading: 'Cookie ֆայլեր',
        body: [
          'Մենք օգտագործում ենք անհրաժեշտ cookie-ներ ծառայության աշխատանքի և անանուն վերլուծության համար։ ' +
            'Մանրամասները ներկայացված են առանձին Cookie քաղաքականությունում։',
        ],
      },
      {
        heading: 'Երրորդ կողմեր և ենթամշակողներ',
        body: [
          'Հարթակի աշխատանքի համար մենք ներգրավում ենք ծառայություններ մատուցողներ (հոսթինգ, վերլուծություն, ' +
            'վիդեոյի գեներացիա)։ Նրանք մշակում են տվյալները միայն մեր հրահանգներով և պարտավոր են պաշտպանել դրանք։',
        ],
      },
      {
        heading: 'Տվյալների պահպանում',
        body: [
          'Մենք պահում ենք տվյալներն այնքան, որքան անհրաժեշտ է ծառայությունը մատուցելու և իրավական ' +
            'պարտավորությունները կատարելու համար։ Հաշիվը ջնջելուց հետո տվյալները ջնջվում կամ անանունացվում են ' +
            'ողջամիտ ժամկետում։',
        ],
      },
      {
        heading: 'Ձեր իրավունքները',
        body: [
          'GDPR-ի և CCPA-ի համաձայն դուք ունեք ձեր տվյալներին հասանելիության, ուղղման, ջնջման և փոխանցման ' +
            'իրավունք, ինչպես նաև մշակումը սահմանափակելու և համաձայնությունը հետ կանչելու իրավունք։ ' +
            'Իրավունքներն իրացնելու համար գրեք {EMAIL}։',
        ],
      },
      {
        heading: 'Միջազգային փոխանցում',
        body: [
          'Ձեր տվյալները կարող են մշակվել այլ երկրներում։ Նման դեպքերում մենք կիրառում ենք համապատասխան ' +
            'պաշտպանական միջոցներ, ներառյալ ստանդարտ պայմանագրային դրույթներ։',
        ],
      },
      {
        heading: 'Երեխաներ, անվտանգություն և փոփոխություններ',
        body: [
          'Ծառայությունը նախատեսված չէ 16 տարեկանից փոքր երեխաների համար։ Մենք կիրառում ենք տեխնիկական և ' +
            'կազմակերպչական միջոցներ տվյալները պաշտպանելու համար, սակայն չենք կարող երաշխավորել բացարձակ ' +
            'անվտանգություն։',
          'Մենք կարող ենք թարմացնել այս քաղաքականությունը; էական փոփոխությունները կհրապարակվեն այս էջում։ ' +
            'Գաղտնիության հարցերով դիմեք՝ {EMAIL}։',
        ],
      },
    ],
  },
  terms: {
    title: 'Օգտագործման պայմաններ',
    tagline: '{SITE} հարթակի օգտագործման կանոնները։',
    sections: [
      {
        heading: 'Ընդունում',
        body: [
          '{SITE}-ն օգտագործելով՝ դուք համաձայնում եք սույն Պայմաններին։ Եթե համաձայն չեք, խնդրում ենք չօգտվել ' +
            'ծառայությունից։',
        ],
      },
      {
        heading: 'Ծառայության նկարագրություն',
        body: [
          '{SITE}-ը ИИ-ի վրա հիմնված կայքերի կառուցիչ է, որը թույլ է տալիս գեներացնել վիդեո-բաժիններ և ' +
            'թեմաներ ու հրապարակել կայքեր ենթատիրույթում կամ սեփական տիրույթում։',
        ],
      },
      {
        heading: 'Հաշիվներ և իրավասություն',
        body: [
          'Դուք պարտավոր եք տրամադրել ճշգրիտ տվյալներ և պատասխանատու եք ձեր մուտքի տվյալների պահպանման համար։ ' +
            'Ծառայության օգտագործումը թույլատրվում է 16 տարեկանից բարձր անձանց։',
        ],
      },
      {
        heading: 'Ընդունելի օգտագործում',
        body: [
          'Ձեր օգտագործումը կարգավորվում է Ընդունելի օգտագործման քաղաքականությամբ։ Արգելված բովանդակությունն ' +
            'ու գործողությունները կարող են հանգեցնել հաշվի կասեցման։',
        ],
      },
      {
        heading: 'Օգտատիրոջ բովանդակություն և լիցենզիա',
        body: [
          'Դուք պահպանում եք ձեր ստեղծած բովանդակության իրավունքները։ Դուք {SITE}-ին տրամադրում եք սահմանափակ ' +
            'լիցենզիա՝ բովանդակությունը հոսթինգ անելու, մշակելու և ցուցադրելու համար՝ բացառապես ծառայության ' +
            'աշխատանքի նպատակով։',
        ],
      },
      {
        heading: 'Մտավոր սեփականություն',
        body: [
          'Հարթակը, նրա կոդը, ձևավորումը և ապրանքանիշները պատկանում են {SITE}-ի օպերատորին։ Ոչ մի իրավունք ' +
            'չի փոխանցվում, բացի ուղղակիորեն տրամադրվածներից։',
        ],
      },
      {
        heading: 'Բաժանորդագրություններ, վճարներ և չեղարկում',
        body: [
          'Վճարովի սակագների դեպքում վճարման և չեղարկման պայմանները ներկայացվում են գնման պահին։ Դուք կարող ' +
            'եք չեղարկել ցանկացած պահի; վճարված ժամանակահատվածները, որպես կանոն, չեն վերադարձվում։',
        ],
      },
      {
        heading: 'Հրաժարում և պատասխանատվության սահմանափակում',
        body: [
          'Ծառայությունը տրամադրվում է «ինչպես կա»՝ առանց որևէ երաշխիքի։ Օրենքով թույլատրելի առավելագույն ' +
            'չափով {SITE}-ը պատասխանատվություն չի կրում անուղղակի կամ պատահական վնասների համար։',
          'Դուք պարտավորվում եք հատուցել վնասները, որոնք առաջացել են սույն Պայմանների կամ երրորդ կողմերի ' +
            'իրավունքների ձեր խախտման հետևանքով։',
        ],
      },
      {
        heading: 'Դադարեցում, կիրառելի իրավունք և փոփոխություններ',
        body: [
          'Մենք կարող ենք կասեցնել կամ դադարեցնել հասանելիությունը Պայմանների խախտման դեպքում։ Սույն ' +
            'Պայմանները կարգավորվում են հարթակի օպերատորի կիրառելի իրավունքով։',
          'Մենք կարող ենք թարմացնել Պայմանները; օգտագործումը շարունակելը նշանակում է համաձայնություն ' +
            'փոփոխությունների հետ։ Կապ՝ {EMAIL}։',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie քաղաքականություն',
    tagline: 'Ինչպես է {SITE}-ն օգտագործում cookie-ներ և նմանատիպ տեխնոլոգիաներ։',
    sections: [
      {
        heading: 'Ինչ են cookie-ները',
        body: [
          'Cookie-ները ձեր սարքում պահվող փոքր տեքստային ֆայլեր են, որոնք օգնում են կայքին հիշել ձեր ' +
            'նախապատվությունները և ճիշտ աշխատել։',
        ],
      },
      {
        heading: 'Անհրաժեշտ cookie-ներ',
        body: [
          'Մենք օգտագործում ենք խիստ անհրաժեշտ cookie-ներ, ինչպիսիք են NEXT_LOCALE-ը (ընտրված լեզուն հիշելու ' +
            'համար) և սեսիայի cookie-ները՝ նույնականացման համար։ Առանց դրանց ծառայությունը չի կարող աշխատել։',
        ],
      },
      {
        heading: 'Վերլուծություն',
        body: [
          'Վիճակագրության համար մենք օգտագործում ենք Cloudflare Web Analytics — cookie-ներ չօգտագործող ' +
            'լուծում, որը չի հետևում օգտատերերին կայքերի միջև և չի հավաքում անձնական տվյալներ։',
        ],
      },
      {
        heading: 'Ինչպես կառավարել և հրաժարվել',
        body: [
          'Դուք կարող եք կառավարել cookie-ները ձեր դիտարկիչի կարգավորումներում և ջնջել դրանք ցանկացած պահի։ ' +
            'Անհրաժեշտ cookie-ների անջատումը կարող է խաթարել ծառայության աշխատանքը։',
        ],
      },
      {
        heading: 'Փոփոխություններ և կապ',
        body: [
          'Մենք կարող ենք թարմացնել այս քաղաքականությունը՝ օգտագործվող տեխնոլոգիաների փոփոխմանը զուգընթաց։ ' +
            'Հարցերի դեպքում դիմեք՝ {EMAIL}։',
        ],
      },
    ],
  },
  acceptableUse: {
    title: 'Ընդունելի օգտագործման քաղաքականություն',
    tagline: 'Ինչ է թույլատրված և արգելված {SITE}-ն օգտագործելիս։',
    sections: [
      {
        heading: 'Արգելված բովանդակություն',
        body: [
          'Արգելվում է տեղադրել անօրինական բովանդակություն, վնասակար ծրագրեր, ֆիշինգ, մտավոր սեփականության ' +
            'իրավունքները խախտող նյութեր կամ ատելություն ու հետապնդում խրախուսող բովանդակություն։',
          'Անչափահասների մասնակցությամբ սեռական բնույթի նյութերը (CSAM) խստիվ արգելված են և կփոխանցվեն ' +
            'իրավասու մարմիններին։ Սպամը և ապակողմնորոշող բովանդակությունը նույնպես արգելված են։',
        ],
      },
      {
        heading: 'Արգելված գործողություններ',
        body: [
          'Արգելվում են սկրեյփինգը, ենթակառուցվածքի ավելորդ ծանրաբեռնումը, տեխնիկական սահմանափակումների և ' +
            'քվոտաների շրջանցումը, ինչպես նաև հարթակի համակարգերին չարտոնված մուտքի փորձերը։',
        ],
      },
      {
        heading: 'Պատասխանատվություն վարձակալ կայքերի համար',
        body: [
          'Դուք լիովին պատասխանատու եք հարթակում ձեր ստեղծած և հրապարակած կայքերի բովանդակության և ' +
            'գործունեության համար, ներառյալ կիրառելի օրենսդրության պահպանումը։',
        ],
      },
      {
        heading: 'Վերահսկում և կասեցում',
        body: [
          'Մենք իրավունք ունենք ստուգել, հեռացնել բովանդակությունը և կասեցնել կամ արգելափակել այս ' +
            'քաղաքականությունը խախտող հաշիվները՝ առանց նախնական ծանուցման լուրջ խախտումների դեպքում։',
        ],
      },
      {
        heading: 'Խախտումների մասին հաղորդում',
        body: [
          'Եթե հայտնաբերել եք այս քաղաքականությունը խախտող բովանդակություն, հայտնեք մեզ {EMAIL} հասցեով։ ' +
            'Մենք կքննարկենք դիմումը ողջամիտ ժամկետում։',
        ],
      },
      {
        heading: 'Փոփոխություններ',
        body: [
          'Մենք կարող ենք թարմացնել այս քաղաքականությունը։ Ընթացիկ տարբերակը միշտ հասանելի է այս էջում։ ' +
            'Կապ՝ {EMAIL}։',
        ],
      },
    ],
  },
};

export const LEGAL: Record<Locale, LegalDict> = { ru, en, hy };

/** Legal dictionary for a locale. */
export function legalDict(locale: Locale): LegalDict {
  return LEGAL[locale];
}
