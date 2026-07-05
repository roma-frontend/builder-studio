import { cn } from '@/lib/utils';

/**
 * Base skeleton primitive — a shimmering placeholder block.
 * Compose it into page-specific skeletons (see skeletons.tsx).
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted/60', className)}
      {...props}
    />
  );
}
