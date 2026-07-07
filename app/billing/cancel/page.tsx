import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { getLocale } from '@/lib/i18n';
import { billingDict } from '@/lib/billing-dict';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function BillingCancelPage() {
  const t = billingDict(await getLocale());
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/70 p-8 text-center shadow-xl backdrop-blur">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-amber-500/15">
          <XCircle className="size-9 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold">{t.result.cancelTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.result.cancelBody}</p>
        <div className="mt-7 flex justify-center">
          <Button asChild>
            <Link href="/pricing">{t.result.retry}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
