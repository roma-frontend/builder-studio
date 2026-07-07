'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Users, DollarSign, Wallet, XOctagon, AlertTriangle, FileSpreadsheet, FileText, Gift, Loader2 } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { Button } from '@/components/ui/button';
import { billingDict } from '@/lib/billing-dict';
import { formatPrice, isPlanId, PLAN_IDS, type PlanId, type BillingInterval, type PlanDTO } from '@/lib/billing/plans';
import type { BillingMetrics, SubscriptionRow, PaymentRow } from '@/lib/billing/subscriptions';
import { PlanEditor } from '@/components/billing/plan-editor';

const STATUS_CLS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  trialing: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  past_due: 'bg-red-500/15 text-red-600 dark:text-red-400',
  canceled: 'bg-muted text-muted-foreground',
  paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

export function BillingAdminClient({
  metrics,
  subscriptions,
  payments,
  plans,
}: {
  metrics: BillingMetrics;
  subscriptions: SubscriptionRow[];
  payments: PaymentRow[];
  plans: PlanDTO[];
}) {
  const { locale } = useLocale();
  const t = billingDict(locale);
  const router = useRouter();
  const [tab, setTab] = useState<'subscriptions' | 'payments'>('subscriptions');
  const [granting, setGranting] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlan, setGrantPlan] = useState<PlanId>('studio');
  const [grantInterval, setGrantInterval] = useState<BillingInterval>('month');

  const cur = metrics.currency;
  const planLabel = (p: string) => (isPlanId(p) ? t.planName[p as PlanId] : p);

  const grant = async () => {
    if (!grantEmail) return;
    setGranting(true);
    try {
      const res = await fetch('/api/admin/billing/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: grantEmail, planId: grantPlan, interval: grantInterval }),
      });
      if (res.ok) {
        setGrantEmail('');
        router.refresh();
      }
    } finally {
      setGranting(false);
    }
  };

  const kpis = [
    { label: t.admin.mrr, value: formatPrice(metrics.mrr, cur), icon: TrendingUp, accent: 'text-indigo-500' },
    { label: t.admin.arr, value: formatPrice(metrics.arr, cur), icon: DollarSign, accent: 'text-violet-500' },
    { label: t.admin.active, value: String(metrics.activeCount), icon: Users, accent: 'text-emerald-500' },
    { label: t.admin.revenue30, value: formatPrice(metrics.revenue30d, cur), icon: Wallet, accent: 'text-sky-500' },
    { label: t.admin.totalRevenue, value: formatPrice(metrics.totalRevenue, cur), icon: DollarSign, accent: 'text-teal-500' },
    { label: t.admin.canceled, value: String(metrics.canceledCount), icon: XOctagon, accent: 'text-muted-foreground' },
    { label: t.admin.pastDue, value: String(metrics.pastDueCount), icon: AlertTriangle, accent: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.title}</h1>
          <p className="text-sm text-muted-foreground">{t.admin.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/admin/billing/export?type=${tab}&format=xlsx`}>
              <FileSpreadsheet className="size-4" /> XLSX
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/admin/billing/export?type=${tab}&format=csv`}>
              <FileText className="size-4" /> CSV
            </a>
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
              <k.icon className={`size-4 ${k.accent}`} />
            </div>
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{k.value}</p>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.admin.byPlan}</span>
          <div className="mt-2 space-y-1 text-sm">
            {PLAN_IDS.map((p) => (
              <div key={p} className="flex justify-between">
                <span className="text-muted-foreground">{planLabel(p)}</span>
                <span className="font-semibold">{metrics.byPlan[p] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual grant */}
      <div className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="size-4 text-primary" />
          <h2 className="font-semibold">{t.admin.grant}</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{t.admin.grantHint}</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="user@email.com"
            className="h-9 min-w-56 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <select value={grantPlan} onChange={(e) => setGrantPlan(e.target.value as PlanId)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
            {PLAN_IDS.map((p) => (
              <option key={p} value={p}>{planLabel(p)}</option>
            ))}
          </select>
          <select value={grantInterval} onChange={(e) => setGrantInterval(e.target.value as BillingInterval)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
            <option value="month">{t.interval.month}</option>
            <option value="year">{t.interval.year}</option>
          </select>
          <Button onClick={grant} disabled={granting || !grantEmail} size="sm">
            {granting ? <Loader2 className="size-4 animate-spin" /> : t.admin.grant}
          </Button>
        </div>
      </div>

      {/* Plan cards editor */}
      <PlanEditor plans={plans} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 text-sm">
        {(['subscriptions', 'payments'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${tab === tb ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tb === 'subscriptions' ? t.admin.subscriptions : t.admin.payments}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card/60 backdrop-blur">
        {tab === 'subscriptions' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t.admin.user}</th>
                <th className="px-4 py-3 font-medium">{t.mine.plan}</th>
                <th className="px-4 py-3 font-medium">{t.checkout.interval}</th>
                <th className="px-4 py-3 font-medium">{t.mine.status}</th>
                <th className="px-4 py-3 font-medium">{t.admin.provider}</th>
                <th className="px-4 py-3 font-medium">{t.mine.amount}</th>
                <th className="px-4 py-3 font-medium">{t.mine.endsOn}</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.userName}</div>
                    <div className="text-xs text-muted-foreground">{s.userEmail}</div>
                  </td>
                  <td className="px-4 py-3">{planLabel(s.planId)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.interval[s.interval as 'month' | 'year'] ?? s.interval}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[s.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {t.status[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.provider}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(s.amount, s.currency)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.currentPeriodEnd ? s.currentPeriodEnd.slice(0, 10) : '—'}</td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">—</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t.mine.invoiceNo}</th>
                <th className="px-4 py-3 font-medium">{t.admin.user}</th>
                <th className="px-4 py-3 font-medium">{t.mine.plan}</th>
                <th className="px-4 py-3 font-medium">{t.mine.amount}</th>
                <th className="px-4 py-3 font-medium">{t.mine.status}</th>
                <th className="px-4 py-3 font-medium">{t.mine.date}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{p.invoiceNumber || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.userName}</div>
                    <div className="text-xs text-muted-foreground">{p.userEmail}</div>
                  </td>
                  <td className="px-4 py-3">{planLabel(p.planId)}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(p.amount, p.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[p.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {t.status[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.createdAt.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'paid' && (
                      <a href={`/api/billing/invoice/${p.id}`} className="text-primary hover:underline">PDF</a>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">—</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
