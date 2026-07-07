'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Download, Loader2, XCircle, RotateCcw, ExternalLink } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { Button } from '@/components/ui/button';
import { billingDict } from '@/lib/billing-dict';
import { formatPrice, isPlanId, type PlanId } from '@/lib/billing/plans';

export interface MySubDTO {
  planId: string;
  status: string;
  interval: string;
  amount: number;
  currency: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: string;
}
export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

const STATUS_CLS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  trialing: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  past_due: 'bg-red-500/15 text-red-600 dark:text-red-400',
  canceled: 'bg-muted text-muted-foreground',
  paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

export function BillingClient({
  sub,
  invoices,
  stripeMode,
}: {
  sub: MySubDTO | null;
  invoices: InvoiceDTO[];
  stripeMode: boolean;
}) {
  const { locale } = useLocale();
  const t = billingDict(locale);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (action: string) => {
    setBusy(action);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (action === 'portal' && data.url) {
        window.location.href = data.url;
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : '—');
  const planLabel = (p: string) => (isPlanId(p) ? t.planName[p as PlanId] : p);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.mine.title}</h1>
        <p className="text-sm text-muted-foreground">{t.mine.subtitle}</p>
      </div>

      {!sub ? (
        <div className="rounded-2xl border border-border bg-card/60 p-8 text-center backdrop-blur">
          <CreditCard className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t.mine.noSub}</p>
          <Button asChild className="mt-4">
            <Link href="/pricing">{t.mine.seePlans}</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{planLabel(sub.planId)}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[sub.status] ?? 'bg-muted text-muted-foreground'}`}>
                  {t.status[sub.status] ?? sub.status}
                </span>
              </div>
              <p className="mt-1 text-2xl font-extrabold">
                {formatPrice(sub.amount, sub.currency)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {sub.interval === 'year' ? t.pricing.perYear : t.pricing.perMonth}
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {sub.cancelAtPeriodEnd
                  ? `${t.mine.endsOn}: ${fmtDate(sub.currentPeriodEnd)}`
                  : `${t.mine.renews}: ${fmtDate(sub.currentPeriodEnd)}`}
              </p>
              {sub.cancelAtPeriodEnd && (
                <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">{t.mine.cancelAtEnd}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {stripeMode && (
                <Button variant="outline" onClick={() => act('portal')} disabled={busy !== null}>
                  {busy === 'portal' ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
                  {t.mine.manage}
                </Button>
              )}
              {sub.cancelAtPeriodEnd ? (
                <Button variant="secondary" onClick={() => act('resume')} disabled={busy !== null}>
                  {busy === 'resume' ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                  {t.mine.resume}
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => act('cancel')} disabled={busy !== null}>
                  {busy === 'cancel' ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                  {t.mine.cancel}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold">{t.mine.invoices}</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">{t.mine.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-6 py-3 font-medium">{t.mine.invoiceNo}</th>
                  <th className="px-6 py-3 font-medium">{t.mine.date}</th>
                  <th className="px-6 py-3 font-medium">{t.mine.amount}</th>
                  <th className="px-6 py-3 font-medium">{t.mine.status}</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-3 font-mono text-xs">{inv.invoiceNumber || '—'}</td>
                    <td className="px-6 py-3 text-muted-foreground">{inv.createdAt.slice(0, 10)}</td>
                    <td className="px-6 py-3 font-medium">{formatPrice(inv.amount, inv.currency)}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[inv.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {t.status[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {inv.status === 'paid' && (
                        <a
                          href={`/api/billing/invoice/${inv.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Download className="size-3.5" />
                          {t.mine.download}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
