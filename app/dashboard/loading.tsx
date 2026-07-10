import { DashboardSkeleton } from '@/components/ui/skeletons';

// Segment-level loading UI for dashboard navigations. Renders INSIDE the
// persistent DashboardShell (the layout doesn't remount), so instead of a
// blank flash or a full-page spinner the user sees a stable skeleton of the
// header + KPI tiles + content grid — no layout shift, feels instant.
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
