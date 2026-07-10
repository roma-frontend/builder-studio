import { describe, it, expect } from 'vitest';
import { PLANS, PLAN_IDS } from '@/lib/billing/plans';
import { CURRENCIES, PLAN_PRICES, planAmount, formatMoney, currencyForLocale, isCurrency } from '@/lib/billing/currency';

describe('currency', () => {
  it('USD table mirrors the canonical plan prices (no drift)', () => {
    for (const id of PLAN_IDS) {
      expect(PLAN_PRICES[id].usd.month).toBe(PLANS[id].price.month);
      expect(PLAN_PRICES[id].usd.year).toBe(PLANS[id].price.year);
    }
  });

  it('every plan has a price for every currency (month + year)', () => {
    for (const id of PLAN_IDS) {
      for (const cur of CURRENCIES) {
        expect(planAmount(id, 'month', cur)).toBeGreaterThan(0);
        expect(planAmount(id, 'year', cur)).toBeGreaterThan(0);
        // Yearly should be cheaper than 12 months (annual discount).
        expect(planAmount(id, 'year', cur)).toBeLessThan(planAmount(id, 'month', cur) * 12);
      }
    }
  });

  it('currencyForLocale maps ru->rub, hy->amd, en->usd', () => {
    expect(currencyForLocale('ru')).toBe('rub');
    expect(currencyForLocale('hy')).toBe('amd');
    expect(currencyForLocale('en')).toBe('usd');
  });

  it('isCurrency guards unknown values', () => {
    expect(isCurrency('rub')).toBe(true);
    expect(isCurrency('eur')).toBe(false);
    expect(isCurrency(null)).toBe(false);
  });

  it('formatMoney renders the right currency symbol', () => {
    expect(formatMoney(2900, 'usd')).toMatch(/\$|USD/);
    expect(formatMoney(279000, 'rub')).toMatch(/₽|RUB/);
    expect(formatMoney(1090000, 'amd')).toMatch(/֏|AMD|dram/i);
  });
});
