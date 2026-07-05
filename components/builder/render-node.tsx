import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { BuilderForm } from './builder-form';
import type { BuilderNode } from '@/lib/builder/types';

// Recursively renders a BuilderNode tree into responsive Tailwind markup.
// Server component — the only client island is <BuilderForm>.

const PAD = { none: 'py-0', sm: 'py-8', md: 'py-14', lg: 'py-24' } as const;
const BG = {
  none: '',
  muted: 'bg-muted/40',
  card: 'bg-card',
  primary: 'bg-primary text-primary-foreground',
} as const;
const WIDTH = { narrow: 'max-w-2xl', normal: 'max-w-4xl', wide: 'max-w-6xl' } as const;
const GAP = { none: 'gap-0', sm: 'gap-3', md: 'gap-6', lg: 'gap-10' } as const;
const ALIGN = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' } as const;
const JUSTIFY = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' } as const;
const COLS = { '1': 'sm:grid-cols-1', '2': 'sm:grid-cols-2', '3': 'sm:grid-cols-2 lg:grid-cols-3', '4': 'sm:grid-cols-2 lg:grid-cols-4' } as const;
const TEXT_ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;
const HEADING_SIZE = { '1': 'text-4xl sm:text-6xl', '2': 'text-3xl sm:text-4xl', '3': 'text-xl sm:text-2xl', '4': 'text-lg sm:text-xl' } as const;
const TEXT_SIZE = { sm: 'text-sm', base: 'text-base', lg: 'text-lg sm:text-xl' } as const;
const SPACE = { sm: 'h-6', md: 'h-12', lg: 'h-20' } as const;

const pick = <T extends Record<string, string>>(map: T, key: string | undefined, fallback: keyof T): string =>
  map[(key ?? '') as keyof T] ?? map[fallback];

function Field({ node }: { node: BuilderNode }) {
  const p = node.props;
  const control =
    node.type === 'textarea' ? (
      <textarea
        name={p.name || 'field'}
        placeholder={p.placeholder}
        rows={4}
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />
    ) : (
      <input
        name={p.name || 'field'}
        type={p.type || 'text'}
        placeholder={p.placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />
    );
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm font-medium">
      {p.label ? <span>{p.label}</span> : null}
      {control}
    </label>
  );
}

export function RenderNode({ node }: { node: BuilderNode }) {
  const p = node.props ?? {};
  const kids = node.children ?? [];

  switch (node.type) {
    case 'section':
      return (
        <section className={cn(pick(PAD, p.padding, 'lg'), pick(BG, p.bg, 'none'))}>
          <div className={cn('mx-auto w-full px-6', pick(WIDTH, p.width, 'wide'))}>
            {kids.map((c) => (
              <RenderNode key={c.id} node={c} />
            ))}
          </div>
        </section>
      );

    case 'stack':
      return (
        <div className={cn('flex flex-col', pick(GAP, p.gap, 'md'), pick(ALIGN, p.align, 'stretch'))}>
          {kids.map((c) => (
            <RenderNode key={c.id} node={c} />
          ))}
        </div>
      );

    case 'row':
      return (
        <div
          className={cn(
            'flex',
            p.wrap === 'nowrap' ? 'flex-nowrap' : 'flex-wrap',
            pick(GAP, p.gap, 'md'),
            pick(ALIGN, p.align, 'center'),
            pick(JUSTIFY, p.justify, 'start'),
          )}
        >
          {kids.map((c) => (
            <RenderNode key={c.id} node={c} />
          ))}
        </div>
      );

    case 'grid':
      return (
        <div className={cn('grid grid-cols-1', pick(COLS, p.columns, '3'), pick(GAP, p.gap, 'md'))}>
          {kids.map((c) => (
            <RenderNode key={c.id} node={c} />
          ))}
        </div>
      );

    case 'heading': {
      const Tag = (`h${p.level && ['1', '2', '3', '4'].includes(p.level) ? p.level : '2'}`) as 'h1' | 'h2' | 'h3' | 'h4';
      return (
        <Tag className={cn('font-display font-bold tracking-tight text-balance', pick(HEADING_SIZE, p.level, '2'), pick(TEXT_ALIGN, p.align, 'left'))}>
          {p.text}
        </Tag>
      );
    }

    case 'text':
      return (
        <p className={cn('leading-relaxed', pick(TEXT_SIZE, p.size, 'base'), pick(TEXT_ALIGN, p.align, 'left'), p.muted === 'true' ? 'text-muted-foreground' : '')}>
          {p.text}
        </p>
      );

    case 'button': {
      const cls = cn(buttonVariants({ variant: (p.variant as 'default' | 'outline' | 'ghost') || 'default', size: (p.size as 'default' | 'sm' | 'lg') || 'default' }));
      const wrap = pick(TEXT_ALIGN, p.align, 'left');
      return (
        <div className={wrap}>
          <Link href={p.href || '#'} className={cls}>
            {p.text}
          </Link>
        </div>
      );
    }

    case 'image':
      return p.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.src}
          alt={p.alt || ''}
          className={cn('w-full object-cover', p.rounded === 'full' ? 'rounded-full' : p.rounded === 'none' ? '' : 'rounded-xl')}
          style={p.ratio ? { aspectRatio: p.ratio.replace('/', ' / ') } : undefined}
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          Изображение
        </div>
      );

    case 'input':
    case 'textarea':
      return <Field node={node} />;

    case 'form':
      return (
        <BuilderForm formId={p.formId || 'form'} submitText={p.submitText || 'Отправить'} successMsg={p.successMsg || 'Спасибо!'}>
          {kids.map((c) => (
            <RenderNode key={c.id} node={c} />
          ))}
        </BuilderForm>
      );

    case 'divider':
      return <hr className="my-6 border-border" />;

    case 'spacer':
      return <div className={pick(SPACE, p.height, 'md')} aria-hidden />;

    default:
      return null;
  }
}
