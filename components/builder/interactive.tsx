'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Interactive builder elements. Items are pre-parsed [title, body] pairs.

export function Accordion({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {items.map(([q, a], i) => (
        <div key={i}>
          <button
            className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium"
            onClick={() => setOpen((o) => (o === i ? null : i))}
            aria-expanded={open === i}
          >
            {q}
            <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open === i && 'rotate-180')} />
          </button>
          {open === i && <div className="px-4 pb-4 text-sm text-muted-foreground">{a}</div>}
        </div>
      ))}
    </div>
  );
}

export function Tabs({ items }: { items: [string, string][] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-border">
        {items.map(([t], i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              active === i ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-4 text-sm text-muted-foreground">{items[active]?.[1]}</div>
    </div>
  );
}
