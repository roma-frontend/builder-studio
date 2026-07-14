// Prevent spreadsheet formula injection in exported user-controlled values.
// Excel-compatible programs can execute cells beginning with =, +, -, @, tab
// or carriage return as formulas. Prefixing an apostrophe forces plain text.

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function spreadsheetSafeCell(value: unknown): unknown {
  if (typeof value !== 'string') return value ?? '';
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
}

export function spreadsheetSafeRows(rows: unknown[][]): unknown[][] {
  return rows.map((row) => row.map(spreadsheetSafeCell));
}
