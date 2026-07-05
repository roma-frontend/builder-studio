import { FullPageLoader } from '@/components/ui/loader';

// Root-level loading UI — shown during route transitions / server data fetches.
export default function Loading() {
  return <FullPageLoader message="Загрузка…" />;
}
