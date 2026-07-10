// Multi-currency pricing. The platform can display and charge in USD, RUB or
// AMD. Prices are an EXPLICIT per-plan, per-currency table (minor units) rather
// than runtime FX conversion, so amounts are deterministic and the owner edits
// them in one place — no exchange-rate drift on the pricing page or invoices.
//
// NOTE: the RUB/AMD amounts below are sensible editable DEFAULTS (round local
// price points). Adjust them to the exact numbers you want to charge. USD is
// canonical and must mirror lib/billing/plans.ts (asserted in tests).
//
// All three currencies use 2 decimal places in Stripe (minor unit = 1/100), so
// amounts here are ×100 just like USD cents.

import type { PlanId, BillingInterval } from '@/lib/billing/plans';
import type { Locale } from '@/lib/seo';

export type Currency = 'usd' | 'rub' | 'amd';
export const CURRENCIES: Currency[] = ['usd', 'rub', 'amd'];

export function isCurrency(v: unknown): v is Currency {
  return typeof v === 'string' && (CURRENCIES as string[]).includes(v);
}

/** Symbol / short label for compact UI. */
export const CURRENCY_LABEL: Record<Currency, string> = { usd: '$ USD', rub: '₽ RUB', amd: '֏ AMD' };

/** Default currency for a UI locale (ru→RUB, hy→AMD, else USD). */
export function currencyForLocale(locale: Locale): Currency {
  if (locale === 'ru') return 'rub';
  if (locale === 'hy') return 'amd';
  return 'usd';
}

/** Intl locale used to format each currency nicely. */
const FORMAT_LOCALE: Record<Currency, string> = { usd: 'en-US', rub: 'ru-RU', amd: 'hy-AM' };

interface Price { month: number; year: number }

// Per-plan prices in MINOR units (×100). Yearly = ~10 months (2 months free).
export const PLAN_PRICES: Record<PlanId, Record<Currency, Price>> = {
  starter: {
    usd: { month: 900, year: 9000 },
    rub: { month: 89000, year: 890000 },   // ₽890 / ₽8 900
    amd: { month: 349000, year: 3490000 }, // ֏3 490 / ֏34 900
  },
  pro: {
    usd: { month: 2900, year: 29000 },
    rub: { month: 279000, year: 2790000 },   // ₽2 790 / ₽27 900
    amd: { month: 1090000, year: 10900000 }, // ֏10 900 / ֏109 000
  },
  studio: {
    usd: { month: 7900, year: 79000 },
    rub: { month: 749000, year: 7490000 },   // ₽7 490 / ₽74 900
    amd: { month: 2990000, year: 29900000 }, // ֏29 900 / ֏299 000
  },
};

/** Amount (minor units) for a plan + interval in a given currency. */
export function planAmount(planId: PlanId, interval: BillingInterval, currency: Currency): number {
  return PLAN_PRICES[planId][currency][interval];
}

/** Format a minor-unit amount in the given currency (no fraction for round). */
export function formatMoney(minor: number, currency: Currency): string {
  const amount = minor / 100;
  const hasFraction = amount % 1 !== 0;
  return new Intl.NumberFormat(FORMAT_LOCALE[currency], {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
