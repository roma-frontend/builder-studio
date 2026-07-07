import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getLocale } from '@/lib/i18n';
import { billingDict } from '@/lib/billing-dict';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function BillingSuccessPage() {
  const t = billingDict(await getLocale());
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/70 p-8 text-center shadow-xl backdrop-blur">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="size-9 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold">{t.result.successTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.result.successBody}</p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard/billing">{t.result.goBilling}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">{t.result.goDashboard}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
