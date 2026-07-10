import { Skeleton } from '@/components/ui/skeleton';

// Route-transition skeleton for the visual builder — mirrors the editor chrome
// (top toolbar, left palette/tree panel, center live preview) so navigating in
// shows a stable, on-brand placeholder instead of a blank screen or spinner.
export default function BuilderLoading() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 px-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-40" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Left panel */}
        <div className="hidden w-72 shrink-0 space-y-3 border-r border-border/60 p-4 lg:block">
          <Skeleton className="h-9 w-full" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
          <Skeleton className="mt-4 h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        {/* Preview */}
        <div className="min-w-0 flex-1 p-4">
          <div className="mx-auto h-full max-w-4xl overflow-hidden rounded-xl border border-border/60">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
