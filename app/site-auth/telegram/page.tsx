import { Suspense } from 'react';
import { SiteTelegramBridge } from '@/components/auth/site-telegram-bridge';

export const metadata = { title: 'Telegram — Builder Studio', robots: { index: false, follow: false } as const };
export const dynamic = 'force-dynamic';

// Platform-host page that renders the Telegram Login Widget on behalf of a
// tenant site (the widget only works on the BotFather-registered domain), then
// hands the session back to the tenant via a one-time token. See the bridge
// component for the full flow.
export default function SiteTelegramPage() {
  return (
    <Suspense fallback={null}>
      <SiteTelegramBridge />
    </Suspense>
  );
}
