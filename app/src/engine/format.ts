// Internal helpers for building workings strings. Display only: never feed
// these strings back into calculations.
import type { Step } from './types';

function clean(n: number): number {
  return Object.is(n, -0) || Math.abs(n) < 1e-15 ? 0 : n;
}

/** Fixed decimals with thousands separators. */
export function fixed(n: number, dp: number): string {
  if (!Number.isFinite(n)) return String(n);
  return clean(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

/** Rate (MYR per USD etc.), 4 dp by default. */
export function rate(n: number, dp = 4): string {
  return fixed(n, dp);
}

/** Spot-like input shown with at least 2 dp and at most 4 dp (4.50, 4.4354). */
export function fx(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return clean(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/** Plain number as typed by the user: 0.03, 100000 (no grouping, trimmed). */
export function g(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return String(Number(clean(n).toPrecision(12)));
}

/** MYR amount, e.g. RM 443,541 (0 dp) or RM 95,693.78 (2 dp). */
export function myr(n: number, dp = 0): string {
  if (!Number.isFinite(n)) return String(n);
  const v = clean(n);
  return `${v < 0 ? '-' : ''}RM ${fixed(Math.abs(v), dp)}`;
}

/** USD amount, e.g. USD 100,000. */
export function usd(n: number, dp = 0): string {
  if (!Number.isFinite(n)) return String(n);
  const v = clean(n);
  return `${v < 0 ? '-' : ''}USD ${fixed(Math.abs(v), dp)}`;
}

/** Decimal as percentage, 2 dp by default: 0.0098039 -> 0.98%. */
export function pct(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return String(n);
  return `${fixed(n * 100, dp)}%`;
}

/** Tenor fraction as shown in a substitution: 1, or 90/365. */
export function tStr(days: number | undefined, basis: number | undefined): string {
  return days === undefined ? '1' : `${days}/${basis ?? 365}`;
}

export function step(label: string, formula: string, substituted: string, result: string): Step {
  return { label, formula, substituted, result };
}
