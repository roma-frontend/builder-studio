'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, RotateCcw, Save } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { Button } from '@/components/ui/button';
import { billingDict } from '@/lib/billing-dict';
import { ALL_FEATURES, type FeatureKey, type PlanDTO, type PlanId } from '@/lib/billing/plans';

interface Draft {
  name: string;
  tagline: string;
  priceMonth: number;
  priceYear: number;
  trialDays: number;
  sitesUnlimited: boolean;
  sitesLimit: number;
  popular: boolean;
  features: FeatureKey[];
}

function toDraft(p: PlanDTO): Draft {
  return {
    name: p.name ?? '',
    tagline: p.tagline ?? '',
    priceMonth: p.priceMonth / 100,
    priceYear: p.priceYear / 100,
    trialDays: p.trialDays,
    sitesUnlimited: p.sites === null,
    sitesLimit: p.sites ?? 1,
    popular: p.popular,
    features: [...p.features],
  };
}

export function PlanEditor({ plans }: { plans: PlanDTO[] }) {
  const { locale } = useLocale();
  const t = billingDict(locale);
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    () => Object.fromEntries(plans.map((p) => [p.id, toDraft(p)])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const set = (id: PlanId, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const toggleFeature = (id: PlanId, f: FeatureKey) =>
    setDrafts((d) => {
      const has = d[id].features.includes(f);
      return { ...d, [id]: { ...d[id], features: has ? d[id].features.filter((x) => x !== f) : [...d[id].features, f] } };
    });

  const save = async (id: PlanId) => {
    const dr = drafts[id];
    setBusy(id);
    try {
      const res = await fetch('/api/admin/billing/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: dr.name,
          tagline: dr.tagline,
          priceMonth: Math.round(dr.priceMonth * 100),
          priceYear: Math.round(dr.priceYear * 100),
          trialDays: dr.trialDays,
          sitesLimit: dr.sitesUnlimited ? null : dr.sitesLimit,
          popular: dr.popular,
          features: dr.features,
        }),
      });
      if (res.ok) {
        setSaved(id);
        setTimeout(() => setSaved(null), 2000);
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  };

  const reset = async (id: PlanId) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/billing/plans?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        const fresh = (data.plans as PlanDTO[]).find((p) => p.id === id);
        if (fresh) set(id, toDraft(fresh));
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  };

  const num = (v: string) => Math.max(0, Math.round(Number(v) || 0));
  const money = (v: string) => Math.max(0, Math.round((Number(v) || 0) * 100) / 100);

  return (
    <div className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur">
      <h2 className="font-semibold">{t.admin.plansTitle}</h2>
      <p className="mb-4 mt-1 text-xs text-muted-foreground">{t.admin.plansHint}</p>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const dr = drafts[p.id];
          if (!dr) return null;
          return (
            <div key={p.id} className="rounded-lg border border-border/70 p-4" style={{ borderTopColor: p.accent, borderTopWidth: 3 }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wide" style={{ color: p.accent }}>{p.id}</span>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={dr.popular} onChange={(e) => set(p.id, { popular: e.target.checked })} />
                  {t.admin.fPopular}
                </label>
              </div>

              <div className="space-y-2 text-sm">
                <Field label={t.admin.fName}>
                  <input value={dr.name} onChange={(e) => set(p.id, { name: e.target.value })} placeholder={t.planName[p.id]} className={inputCls} />
                </Field>
                <Field label={t.admin.fTagline}>
                  <input value={dr.tagline} onChange={(e) => set(p.id, { tagline: e.target.value })} placeholder={t.planTagline[p.id]} className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t.admin.fPriceMonth}>
                    <input type="number" step="0.01" min="0" value={dr.priceMonth} onChange={(e) => set(p.id, { priceMonth: money(e.target.value) })} className={inputCls} />
                  </Field>
                  <Field label={t.admin.fPriceYear}>
                    <input type="number" step="0.01" min="0" value={dr.priceYear} onChange={(e) => set(p.id, { priceYear: money(e.target.value) })} className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t.admin.fTrialDays}>
                    <input type="number" value={dr.trialDays} onChange={(e) => set(p.id, { trialDays: num(e.target.value) })} className={inputCls} />
                  </Field>
                  <Field label={t.admin.fSites}>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={dr.sitesLimit}
                        disabled={dr.sitesUnlimited}
                        onChange={(e) => set(p.id, { sitesLimit: num(e.target.value) })}
                        className={`${inputCls} disabled:opacity-40`}
                      />
                    </div>
                  </Field>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={dr.sitesUnlimited} onChange={(e) => set(p.id, { sitesUnlimited: e.target.checked })} />
                  {t.admin.fUnlimited}
                </label>

                <div className="pt-1">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{t.admin.fFeatures}</p>
                  <div className="space-y-1">
                    {ALL_FEATURES.map((f) => (
                      <label key={f} className="flex items-start gap-1.5 text-xs">
                        <input type="checkbox" checked={dr.features.includes(f)} onChange={() => toggleFeature(p.id, f)} className="mt-0.5" />
                        <span>{t.feature[f]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" onClick={() => save(p.id)} disabled={busy !== null}>
                  {busy === p.id ? <Loader2 className="size-4 animate-spin" /> : saved === p.id ? <Check className="size-4" /> : <Save className="size-4" />}
                  {saved === p.id ? t.admin.saved : t.admin.save}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => reset(p.id)} disabled={busy !== null} title={t.admin.reset}>
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputCls = 'h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
