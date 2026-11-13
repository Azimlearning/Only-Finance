// Number guard (A0). Pure functions, no React.
// Every number in AI text is checked against engine-known values.

export type Segment =
  | { kind: 'text'; text: string }
  | {
      kind: 'number';
      raw: string;
      /** Value as written, in full units (percent numbers stay in percent units, `k`/`million` suffixes expanded). */
      value: number;
      status: 'verified' | 'corrected' | 'unverified';
      /** For `corrected`: the engine value in the same units as `value` (percent units for percentages). */
      correct?: number;
    };

export interface GuardResult {
  segments: Segment[];
  verified: number;
  total: number;
}

/** Deep-walk objects/arrays and collect every finite number. */
export function collectNumbers(obj: unknown): number[] {
  const out: number[] = [];
  const seen = new Set<object>();
  const walk = (v: unknown): void => {
    if (typeof v === 'number') {
      if (Number.isFinite(v)) out.push(v);
    } else if (Array.isArray(v)) {
      for (const x of v) walk(x);
    } else if (v !== null && typeof v === 'object') {
      if (seen.has(v)) return;
      seen.add(v);
      for (const x of Object.values(v as Record<string, unknown>)) walk(x);
    }
  };
  walk(obj);
  return out;
}

interface Token {
  start: number;
  end: number;
  raw: string;
  /** Value as written (signed, multiplier applied, percent NOT divided). */
  value: number;
  dp: number;
  pct: boolean;
  cur: boolean;
  mult: number;
  explicitSign: boolean;
  ignored: boolean;
}

const NUM_RE =
  /(?<![\w.,])([−–+-])?(?:(RM|MYR|USD|US\$|\$)\s?([−–-])?)?(\d{1,3}(?:[,\u00a0\u202f\u2009 ](?=\d{3}(?!\d))\d{3})+|\d+)(\.\d+)?(\s?(?:million|thousand|[kKmM])(?![A-Za-z]))?(%|\s?pp\b|\s?percent(?:age points?)?\b)?/g;

const UNIT_AFTER = /^(?:-|\s)?(?:days?|months?|years?|yrs?|weeks?|steps?)\b/i;

function scan(text: string): Token[] {
  const tokens: Token[] = [];
  NUM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NUM_RE.exec(text)) !== null) {
    const [raw, sign1, curStr, sign2, intPart, decPart, multStr, pctStr] = m;
    const start = m.index;
    const end = start + raw.length;
    const dp = decPart ? decPart.length - 1 : 0;
    const neg = [sign1, sign2].some((s) => s === '−' || s === '–' || s === '-');
    const explicitSign = Boolean(sign1 || sign2);
    let mult = 1;
    if (multStr) {
      const t = multStr.trim().toLowerCase();
      mult = t === 'k' || t === 'thousand' ? 1e3 : 1e6;
    }
    const base = Number(intPart.replace(/[,\u00a0\u202f\u2009 ]/g, '') + (decPart ?? ''));
    const value = (neg ? -1 : 1) * base * mult;
    const pct = Boolean(pctStr);
    const cur = Boolean(curStr);

    // Ignore rules ------------------------------------------------------
    let ignored = false;
    const after = text.slice(end);
    const plainInt = dp === 0 && !cur && !pct && !multStr && !/[,\u00a0\u202f\u2009 ]/.test(intPart);
    if (plainInt && base <= 12) ignored = true;
    if (plainInt && base >= 1900 && base <= 2100) ignored = true; // years
    if (!cur && !pct && UNIT_AFTER.test(after)) ignored = true; // "90 days", "3 years", "step 2"
    if (plainInt && !explicitSign) {
      // list markers: "1." / "2)" at the start of a line (optionally after a bullet)
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const before = text.slice(lineStart, start);
      if (/^\s*(?:[-*•]\s*)?$/.test(before) && /^[.)]\s/.test(after)) ignored = true;
    }
    // "Step 3" / "step 3:" prefix
    if (plainInt && /(?:^|\s)step\s*$/i.test(text.slice(Math.max(0, start - 8), start))) ignored = true;

    tokens.push({ start, end, raw, value, dp, pct, cur, mult, explicitSign, ignored });
  }
  return tokens;
}

/** Every number appearing in text (same tokenizer as the guard, ignored tokens included; percentages as written and as decimals). */
export function numbersInText(text: string): number[] {
  const out: number[] = [];
  for (const t of scan(text)) {
    out.push(t.value);
    if (t.pct) out.push(t.value / 100);
  }
  return out;
}

function roundTo(x: number, d: number): number {
  const f = 10 ** d;
  return Math.round(x * f) / f;
}

function matches(x: number, k: number, d: number, mult: number): boolean {
  const tol = 0.5 * 10 ** -d * mult + 1e-9;
  const kr = mult === 1 ? roundTo(k, d) : roundTo(k / mult, d) * mult;
  return Math.abs(x - kr) <= tol;
}

function classify(
  t: Token,
  known: number[],
): { status: 'verified' | 'corrected' | 'unverified'; correct?: number } {
  const x = t.value;
  // Candidate scales for a known value k: as-is, and ×100 when the number is a percentage.
  const scales = t.pct ? [100, 1] : [1];
  const signs = t.explicitSign ? [1] : [1, -1]; // unsigned text: |k| is allowed to match a negative k

  for (const k of known) {
    for (const sc of scales) {
      for (const sg of signs) {
        if (matches(x, k * sc * sg, t.dp, t.mult)) return { status: 'verified' };
      }
    }
  }

  let best: number | undefined;
  let bestDiff = Infinity;
  for (const k of known) {
    for (const sc of scales) {
      for (const sg of signs) {
        const c = k * sc * sg;
        if (c === 0) continue;
        const diff = Math.abs(x - c);
        if (diff / Math.abs(c) <= 0.05 && diff < bestDiff) {
          bestDiff = diff;
          best = c;
        }
      }
    }
  }
  if (best !== undefined) return { status: 'corrected', correct: best };
  return { status: 'unverified' };
}

export function verifyNumbers(text: string, known: number[]): GuardResult {
  const k = known.filter((v) => Number.isFinite(v));
  const segments: Segment[] = [];
  let cursor = 0;
  let verified = 0;
  let total = 0;
  const pushText = (s: string): void => {
    if (!s) return;
    const last = segments[segments.length - 1];
    if (last && last.kind === 'text') last.text += s;
    else segments.push({ kind: 'text', text: s });
  };

  for (const t of scan(text)) {
    if (t.ignored) continue;
    pushText(text.slice(cursor, t.start));
    cursor = t.end;
    const c = classify(t, k);
    total += 1;
    if (c.status === 'verified') verified += 1;
    segments.push({
      kind: 'number',
      raw: t.raw,
      value: t.value,
      status: c.status,
      ...(c.correct !== undefined ? { correct: c.correct } : {}),
    });
  }
  pushText(text.slice(cursor));
  return { segments, verified, total };
}

/** Format a corrected value in the style of the raw text it replaces (currency prefix, decimals, %, k/million). */
export function formatCorrected(raw: string, correct: number): string {
  const t = scan(raw)[0];
  if (!t) return String(correct);
  const cm = /^(?:[−–+-])?(RM|MYR|USD|US\$|\$)\s?/.exec(raw);
  const cur = cm ? `${cm[1]} ` : '';
  const shown = correct / t.mult;
  const body = Math.abs(shown).toLocaleString('en-US', {
    minimumFractionDigits: t.dp,
    maximumFractionDigits: t.dp,
  });
  const suffixM = /(million|thousand|[kKmM])(?![A-Za-z])/.exec(raw);
  const mult = t.mult !== 1 && suffixM ? suffixM[1] : '';
  const pct = t.pct ? '%' : '';
  const sign = shown < 0 ? '−' : '';
  return `${sign}${cur}${body}${mult}${pct}`;
}
