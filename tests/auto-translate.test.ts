import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { translateAuto, translateDocChrome, translateNodeAuto, translatePageAuto } from '@/lib/auto-translate';
import type { BuilderDoc, BuilderNode, BuilderPage } from '@/lib/builder/types';

// Mock Google's gtx endpoint. Returns the documented shape:
//   [ [ [translatedChunk, originalChunk, ...], ... ], ... ]
function mockFetchOk(translated = 'TRANSLATED') {
  return vi.fn(async () => ({
    ok: true,
    json: async () => [[[translated, 'src']]],
  })) as unknown as typeof fetch;
}

describe('auto-translate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the source unchanged for the ru locale (no MT call)', async () => {
    const fetchSpy = mockFetchOk();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await translateAuto('Привет', 'ru')).toBe('Привет');
    expect(await translateAuto('', 'en')).toBe('');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('leaves non-Russian / numeric-only atoms as-is', async () => {
    const fetchSpy = mockFetchOk();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await translateAuto('Hello world', 'en')).toBe('Hello world');
    expect(await translateAuto('24/7', 'en')).toBe('24/7');
    expect(await translateAuto('https://example.com', 'en')).toBe('https://example.com');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('machine-translates a Russian atom', async () => {
    vi.stubGlobal('fetch', mockFetchOk('Hi there'));
    const out = await translateAuto('Необычная фраза для перевода', 'en');
    expect(out).toBe('Hi there');
  });

  it('translates newline lists, "::" pairs and "Label|url" socials', async () => {
    vi.stubGlobal('fetch', mockFetchOk('X'));
    expect(await translateAuto('Раз\nДва', 'en')).toBe('X\nX');
    expect(await translateAuto('Вопрос::Ответ', 'en')).toBe('X::X');
    // The url part after "|" is preserved verbatim.
    expect(await translateAuto('Ссылка|https://a.b', 'en')).toBe('X|https://a.b');
  });

  it('falls back to the original when MT is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch);
    expect(await translateAuto('Совсем другая строка', 'en')).toBe('Совсем другая строка');
  });

  it('falls back to the original when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network'); }) as unknown as typeof fetch);
    expect(await translateAuto('Ещё одна строка перевода', 'en')).toBe('Ещё одна строка перевода');
  });

  it('translates a node tree, skipping non-text and numeric props', async () => {
    vi.stubGlobal('fetch', mockFetchOk('T'));
    const node: BuilderNode = {
      id: 'n1',
      type: 'heading',
      props: { text: 'Заголовок раздела', value: '42', align: 'center' },
      children: [
        { id: 'n2', type: 'text', props: { text: 'Дочерний текст блока' } },
      ],
    } as unknown as BuilderNode;

    const out = await translateNodeAuto(node, 'en');
    expect(out.props.text).toBe('T');           // text prop translated
    expect(out.props.value).toBe('42');          // numeric value untouched
    expect(out.props.align).toBe('center');      // non-text prop untouched
    expect(out.children?.[0].props.text).toBe('T');

    // ru locale returns the node reference unchanged
    expect(await translateNodeAuto(node, 'ru')).toBe(node);
  });

  it('translates a page (title, description, blocks)', async () => {
    vi.stubGlobal('fetch', mockFetchOk('P'));
    const page: BuilderPage = {
      id: 'p1',
      path: '',
      title: 'Главная страница сайта',
      description: 'Описание страницы для теста',
      blocks: [
        { id: 'b1', type: 'text', props: { text: 'Текст блока страницы' } } as unknown as BuilderNode,
      ],
    };
    const out = await translatePageAuto(page, 'en');
    expect(out.title).toBe('P');
    expect(out.description).toBe('P');
    expect(out.blocks[0].props.text).toBe('P');

    expect(await translatePageAuto(page, 'ru')).toBe(page);
  });

  it('translates the site chrome (nav, footer, CTA, page titles) but keeps brand & hrefs', async () => {
    vi.stubGlobal('fetch', mockFetchOk('C'));
    const doc = {
      brand: 'BBH',
      themeId: 'auto',
      headerCtaText: 'Необычный призыв связаться',
      nav: [{ label: 'Уникальный пункт меню', href: '/about' }, { label: 'Второй особый пункт', href: '/contact' }],
      footer: { text: 'Произвольный текст подвала', links: [{ label: 'Своеобразная ссылка', href: '/legal/privacy' }] },
      pages: [{ id: 'p1', path: '', title: 'Нестандартный заголовок', blocks: [] }],
    } as unknown as BuilderDoc;

    const out = await translateDocChrome(doc, 'en');
    expect(out.brand).toBe('BBH');                       // brand untouched
    expect(out.nav[0].label).toBe('C');                  // nav label translated
    expect(out.nav[0].href).toBe('/about');              // href preserved
    expect(out.footer.text).toBe('C');                   // footer text translated
    expect(out.footer.links[0].label).toBe('C');         // footer link label translated
    expect(out.footer.links[0].href).toBe('/legal/privacy');
    expect(out.headerCtaText).toBe('C');                 // CTA translated
    expect(out.pages[0].title).toBe('C');                // page title (footer auto-links)

    // ru locale returns the doc reference unchanged (no MT call)
    expect(await translateDocChrome(doc, 'ru')).toBe(doc);
  });
});
