import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Composed, reusable skeletons for the common layouts in this app. Drop them in
 * as Suspense fallbacks or while client data loads, so the shell stays stable
 * and there's no layout shift.
 */

/** A single card placeholder (title + a few lines + footer). */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card p-5', className)}>
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/** A responsive grid of cards (e.g. sites / materials listing). */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** A table placeholder with a header row and N body rows. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="flex gap-4 border-b border-border/60 bg-muted/40 p-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 p-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4 flex-1', c === 0 && 'max-w-[40%]')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** List of stacked rows (e.g. notifications, members, requests). */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4">
          <Skeleton className="h-10 w-10 flex-none rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-24 flex-none" />
        </div>
      ))}
    </div>
  );
}

/** Stat tiles row (dashboard KPIs). */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Whole dashboard page skeleton: header + stats + content grid. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <StatsSkeleton />
      <CardGridSkeleton />
    </div>
  );
}
