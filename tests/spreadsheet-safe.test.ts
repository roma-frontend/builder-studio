import { describe, expect, it } from 'vitest';
import { spreadsheetSafeCell, spreadsheetSafeRows } from '@/lib/spreadsheet-safe';

describe('spreadsheetSafeCell', () => {
  it.each(['=1+1', '+cmd', '-2+3', '@SUM(A1:A2)', '\t=1', '\r=1'])(
    'neutralizes formula-like value %j',
    (value) => expect(spreadsheetSafeCell(value)).toBe(`'${value}`),
  );

  it('preserves ordinary strings and non-string values', () => {
    expect(spreadsheetSafeCell('user@example.com')).toBe('user@example.com');
    expect(spreadsheetSafeCell(42)).toBe(42);
    expect(spreadsheetSafeCell(null)).toBe('');
  });

  it('sanitizes every cell in rows', () => {
    expect(spreadsheetSafeRows([['=bad', 'safe'], ['@bad', 1]])).toEqual([
      ["'=bad", 'safe'],
      ["'@bad", 1],
    ]);
  });
});
