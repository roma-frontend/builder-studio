// Visual site-builder schema. A BuilderDoc is a whole website: brand, theme,
// shared header nav + footer, and a list of pages. Each page is a tree of
// BuilderNodes (sections → containers → elements). The renderer in
// components/builder/render-node.tsx turns this into responsive markup and the
// editor in app/studio/builder edits it.

export type NodeType =
  | 'section'
  | 'stack'
  | 'row'
  | 'grid'
  | 'heading'
  | 'text'
  | 'button'
  | 'image'
  | 'input'
  | 'textarea'
  | 'form'
  | 'divider'
  | 'spacer';

export interface BuilderNode {
  id: string;
  type: NodeType;
  props: Record<string, string>;
  children?: BuilderNode[];
}

export interface NavLink {
  label: string;
  href: string;
}

export interface BuilderPage {
  id: string;
  path: string; // '' = home (/site), 'about' = /site/about
  title: string;
  blocks: BuilderNode[];
}

export interface BuilderDoc {
  brand: string;
  themeId: string;
  nav: NavLink[];
  footer: { text: string; links: NavLink[] };
  pages: BuilderPage[];
}

/** Which node types accept children in the editor + renderer. */
export const CONTAINER_TYPES: NodeType[] = ['section', 'stack', 'row', 'grid', 'form'];
export const isContainer = (t: NodeType) => CONTAINER_TYPES.includes(t);

/** Human labels for the palette / tree. */
export const NODE_LABELS: Record<NodeType, string> = {
  section: 'Секция',
  stack: 'Колонка (stack)',
  row: 'Ряд (row)',
  grid: 'Сетка (grid)',
  heading: 'Заголовок',
  text: 'Текст',
  button: 'Кнопка',
  image: 'Картинка',
  input: 'Поле ввода',
  textarea: 'Многострочное поле',
  form: 'Форма',
  divider: 'Разделитель',
  spacer: 'Отступ',
};

let counter = 0;
export function newId(type: string): string {
  counter += 1;
  return `${type}-${Date.now().toString(36)}-${counter}`;
}

/** Default props for a freshly created node of a given type. */
export function defaultProps(type: NodeType): Record<string, string> {
  switch (type) {
    case 'section':
      return { padding: 'lg', bg: 'none', width: 'wide' };
    case 'stack':
      return { gap: 'md', align: 'stretch' };
    case 'row':
      return { gap: 'md', align: 'center', justify: 'start', wrap: 'wrap' };
    case 'grid':
      return { gap: 'md', columns: '3' };
    case 'heading':
      return { text: 'Заголовок', level: '2', align: 'left' };
    case 'text':
      return { text: 'Немного описательного текста для вашего сайта.', align: 'left', muted: 'true' };
    case 'button':
      return { text: 'Кнопка', href: '/site', variant: 'default', size: 'default', align: 'left' };
    case 'image':
      return { src: '', alt: '', rounded: 'lg', ratio: '16/9' };
    case 'input':
      return { name: 'field', label: 'Метка', placeholder: 'Введите…', type: 'text' };
    case 'textarea':
      return { name: 'message', label: 'Сообщение', placeholder: 'Ваше сообщение…' };
    case 'form':
      return { formId: 'contact', submitText: 'Отправить', successMsg: 'Спасибо! Мы свяжемся с вами.' };
    case 'divider':
      return {};
    case 'spacer':
      return { height: 'md' };
    default:
      return {};
  }
}

export function makeNode(type: NodeType): BuilderNode {
  const node: BuilderNode = { id: newId(type), type, props: defaultProps(type) };
  if (isContainer(type)) node.children = [];
  return node;
}

export const DEFAULT_DOC: BuilderDoc = {
  brand: 'Мой сайт',
  themeId: 'auto',
  nav: [
    { label: 'Главная', href: '/site' },
    { label: 'О нас', href: '/site/about' },
    { label: 'Контакты', href: '/site/contact' },
  ],
  footer: {
    text: '© 2025 Мой сайт. Все права защищены.',
    links: [
      { label: 'Политика', href: '/site/about' },
      { label: 'Контакты', href: '/site/contact' },
    ],
  },
  pages: [],
};
