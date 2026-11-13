// Formatting only. No finance maths lives in the UI.

const nf = (dp: number) => ({ minimumFractionDigits: dp, maximumFractionDigits: dp })
const MINUS = '−'
const DASH = '–'

export function fmtNum(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return DASH
  return n.toLocaleString('en-MY', nf(dp))
}

/** FX rate, MYR per 1 USD, 4 dp. */
export function fmtRate(n: number): string {
  if (!Number.isFinite(n)) return DASH
  return n.toFixed(4)
}

export function fmtSignedRate(n: number): string {
  if (!Number.isFinite(n)) return DASH
  const s = Math.abs(n).toFixed(4)
  return n > 0 ? `+${s}` : n < 0 ? `${MINUS}${s}` : s
}

export function fmtMYR(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return DASH
  const s = `RM ${Math.abs(n).toLocaleString('en-MY', nf(dp))}`
  return n < 0 ? `${MINUS}${s}` : s
}

export function fmtSignedMYR(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return DASH
  const s = `RM ${Math.abs(n).toLocaleString('en-MY', nf(dp))}`
  return n > 0 ? `+${s}` : n < 0 ? `${MINUS}${s}` : s
}

export function fmtUSD(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return DASH
  return `USD ${n.toLocaleString('en-MY', nf(dp))}`
}

/** Decimal to percent string, e.g. 0.035 gives "3.50%". */
export function fmtPct(x: number, dp = 2): string {
  if (!Number.isFinite(x)) return DASH
  return `${(x * 100).toFixed(dp)}%`
}

export function fmtSignedPct(x: number, dp = 2): string {
  if (!Number.isFinite(x)) return DASH
  const s = `${Math.abs(x * 100).toFixed(dp)}%`
  return x > 0 ? `+${s}` : x < 0 ? `${MINUS}${s}` : s
}

/** Percentage points, e.g. 0.01 gives "+1.00 pp". */
export function fmtSignedPP(x: number, dp = 2): string {
  if (!Number.isFinite(x)) return DASH
  const s = `${Math.abs(x * 100).toFixed(dp)} pp`
  return x > 0 ? `+${s}` : x < 0 ? `${MINUS}${s}` : s
}

/** Unknown-unit engine number: large gets thousands separators, small gets 4 dp. */
export function fmtSmart(n: number): string {
  if (!Number.isFinite(n)) return DASH
  return Math.abs(n) >= 1000 ? fmtNum(n, 2) : n.toFixed(4)
}

/** Heuristic formatter for comparison outputs (key/label hints). */
export function fmtByHint(hint: string, n: unknown, signed = false): string {
  if (typeof n !== 'number') return String(n)
  if (/MYR\/USD/i.test(hint)) return signed ? fmtSignedRate(n) : fmtRate(n)
  if (/real/i.test(hint) && /rate/i.test(hint)) return signed ? fmtSignedPct(n) : fmtPct(n)
  if (/pct|premium|change|%|percent/i.test(hint)) return signed ? fmtSignedPct(n) : fmtPct(n)
  if (/myr|cost|rm|gap|receive|pay|saving/i.test(hint) && !/rate/i.test(hint)) return signed ? fmtSignedMYR(n) : fmtMYR(n)
  return signed ? fmtSignedRate(n) : fmtSmart(n)
}

export function fmtRatio(n: number): string {
  return Number.isFinite(n) ? n.toFixed(5) : DASH
}
