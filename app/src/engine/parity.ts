import type { DayBasis, Assumptions, Deal, Result, Step } from './types';
import { fx, g, myr, pct, rate, step, tStr } from './format';
import { tenorFraction } from './tenor';

/** Interest rate parity forward: F = S (1 + iMY·t) / (1 + iUS·t). */
export function irpForward(p: {
  spot: number; iMY: number; iUS: number; days?: number; basis?: DayBasis;
}): Result<{ forward: number; premium: number; forwardMinusSpot: number }> {
  const t = tenorFraction(p.days, p.basis);
  const forward = (p.spot * (1 + p.iMY * t)) / (1 + p.iUS * t);
  const premium = forward / p.spot - 1;
  const forwardMinusSpot = forward - p.spot;
  const ts = tStr(p.days, p.basis);
  const workings: Step[] = [];
  if (p.days !== undefined) {
    workings.push(step('Tenor', 't = days / basis', `t = ${p.days} / ${p.basis ?? 365}`, rate(t, 6)));
  }
  workings.push(
    step(
      'IRP forward',
      'F = S × (1 + i_MY·t) / (1 + i_US·t)',
      `F = ${fx(p.spot)} × (1 + ${g(p.iMY)}×${ts}) / (1 + ${g(p.iUS)}×${ts})`,
      `${rate(forward)} MYR/USD`,
    ),
    step(
      'Forward premium / discount',
      'premium = F / S − 1',
      `premium = ${rate(forward)} / ${fx(p.spot)} − 1`,
      pct(premium, 4),
    ),
    step(
      'Forward minus spot',
      'F − S',
      `${rate(forward)} − ${fx(p.spot)}`,
      `${rate(forwardMinusSpot)} MYR/USD`,
    ),
  );
  return { value: { forward, premium, forwardMinusSpot }, workings };
}

/** Purchasing power parity expected spot: S × ((1 + πMY)/(1 + πUS))^years. */
export function pppExpected(p: {
  spot: number; piMY: number; piUS: number; years?: number;
}): Result<{ expected: number; change: number; approx: number; approxChange: number }> {
  const years = p.years ?? 1;
  const expected = p.spot * Math.pow((1 + p.piMY) / (1 + p.piUS), years);
  const change = expected / p.spot - 1;
  const approxChange = (p.piMY - p.piUS) * years;
  const approx = p.spot * (1 + approxChange);
  const yrs = g(years);
  return {
    value: { expected, change, approx, approxChange },
    workings: [
      step(
        'PPP expected spot (exact)',
        'E = S × ((1 + π_MY) / (1 + π_US))^years',
        `E = ${fx(p.spot)} × ((1 + ${g(p.piMY)}) / (1 + ${g(p.piUS)}))^${yrs}`,
        `${rate(expected)} MYR/USD`,
      ),
      step('Exact change', 'E / S − 1', `${rate(expected)} / ${fx(p.spot)} − 1`, pct(change, 4)),
      step(
        'PPP expected spot (approximation)',
        'E ≈ S × (1 + (π_MY − π_US) × years)',
        `E ≈ ${fx(p.spot)} × (1 + (${g(p.piMY)} − ${g(p.piUS)}) × ${yrs})`,
        `${rate(approx)} MYR/USD`,
      ),
      step(
        'Approximate change',
        '(π_MY − π_US) × years',
        `(${g(p.piMY)} − ${g(p.piUS)}) × ${yrs}`,
        pct(approxChange, 4),
      ),
    ],
  };
}

/** Real rate by the Fisher equation: (1 + i)/(1 + π) − 1, approx i − π. */
export function fisherReal(p: { i: number; pi: number }): Result<{ real: number; approx: number }> {
  const real = (1 + p.i) / (1 + p.pi) - 1;
  const approx = p.i - p.pi;
  return {
    value: { real, approx },
    workings: [
      step(
        'Real rate (exact)',
        'r = (1 + i) / (1 + π) − 1',
        `r = (1 + ${g(p.i)}) / (1 + ${g(p.pi)}) − 1`,
        pct(real, 4),
      ),
      step('Real rate (approximation)', 'r ≈ i − π', `r ≈ ${g(p.i)} − ${g(p.pi)}`, pct(approx, 4)),
    ],
  };
}

/** Nominal rate by the Fisher equation: (1 + r)(1 + π) − 1, approx r + π. */
export function fisherNominal(p: { real: number; pi: number }): Result<{ nominal: number; approx: number; diff: number }> {
  const nominal = (1 + p.real) * (1 + p.pi) - 1;
  const approx = p.real + p.pi;
  const diff = nominal - approx;
  return {
    value: { nominal, approx, diff },
    workings: [
      step(
        'Nominal rate (exact)',
        'i = (1 + r)(1 + π) − 1',
        `i = (1 + ${g(p.real)})(1 + ${g(p.pi)}) − 1`,
        pct(nominal, 4),
      ),
      step('Nominal rate (approximation)', 'i ≈ r + π', `i ≈ ${g(p.real)} + ${g(p.pi)}`, pct(approx, 4)),
      step('Approximation gap', 'exact − approx (the cross term r·π)', `${pct(nominal, 4)} − ${pct(approx, 4)}`, pct(diff, 4)),
    ],
  };
}

/** International Fisher effect: same maths as IRP, read as an expected future spot. */
export function ifeExpected(p: {
  spot: number; iMY: number; iUS: number; days?: number; basis?: DayBasis;
}): Result<{ expected: number; change: number }> {
  const t = tenorFraction(p.days, p.basis);
  const expected = (p.spot * (1 + p.iMY * t)) / (1 + p.iUS * t);
  const change = expected / p.spot - 1;
  const ts = tStr(p.days, p.basis);
  return {
    value: { expected, change },
    workings: [
      step(
        'International Fisher expected spot',
        'E(S_t) = S × (1 + i_MY·t) / (1 + i_US·t)',
        `E(S_t) = ${fx(p.spot)} × (1 + ${g(p.iMY)}×${ts}) / (1 + ${g(p.iUS)}×${ts})`,
        `${rate(expected)} MYR/USD`,
      ),
      step('Expected change in spot', 'E(S_t) / S − 1', `${rate(expected)} / ${fx(p.spot)} − 1`, pct(change, 4)),
    ],
  };
}

export type ParityVerdict = 'forwardCheaper' | 'forwardDearer' | 'aligned';

/** Parity triangle for a one-year view: IRP forward vs PPP expected spot vs Fisher real rates. */
export function parityCheck(p: {
  spot: number; iMY: number; iUS: number; piMY: number; piUS: number; usdAmount: number;
}): Result<{
  forward: number; pppExpected: number; realMY: number; realUS: number; ratio: number; realRatio: number;
  myrAtForward: number; myrAtPPP: number; gapMYR: number; verdict: ParityVerdict;
}> {
  const f = irpForward({ spot: p.spot, iMY: p.iMY, iUS: p.iUS });
  const e = pppExpected({ spot: p.spot, piMY: p.piMY, piUS: p.piUS });
  const rMY = fisherReal({ i: p.iMY, pi: p.piMY });
  const rUS = fisherReal({ i: p.iUS, pi: p.piUS });
  const forward = f.value.forward;
  const ppp = e.value.expected;
  const realMY = rMY.value.real;
  const realUS = rUS.value.real;
  const ratio = forward / ppp;
  const realRatio = (1 + realMY) / (1 + realUS);
  const myrAtForward = p.usdAmount * forward;
  const myrAtPPP = p.usdAmount * ppp;
  const gapMYR = myrAtPPP - myrAtForward;
  const verdict: ParityVerdict =
    Math.abs(ratio - 1) < 0.0005 ? 'aligned' : ratio < 1 ? 'forwardCheaper' : 'forwardDearer';
  const verdictText =
    verdict === 'aligned'
      ? 'aligned: the forward and the PPP expected spot agree within 0.05%'
      : verdict === 'forwardCheaper'
        ? 'forward cheaper: the IRP forward is below the PPP expected spot'
        : 'forward dearer: the IRP forward is above the PPP expected spot';
  const workings: Step[] = [
    ...f.workings,
    ...e.workings,
    ...rMY.workings.map((w) => ({ ...w, label: `Malaysia: ${w.label}` })),
    ...rUS.workings.map((w) => ({ ...w, label: `US: ${w.label}` })),
    step(
      'Forward / PPP ratio',
      'F / E_PPP',
      `${rate(forward)} / ${rate(ppp)}`,
      rate(ratio, 6),
    ),
    step(
      'Real-rate ratio (identity check)',
      '(1 + r_MY) / (1 + r_US)',
      `(1 + ${rate(realMY, 6)}) / (1 + ${rate(realUS, 6)})`,
      rate(realRatio, 6),
    ),
    step(
      'MYR at forward',
      'USD amount × F',
      `${g(p.usdAmount)} × ${rate(forward)}`,
      myr(myrAtForward),
    ),
    step('MYR at PPP expected spot', 'USD amount × E_PPP', `${g(p.usdAmount)} × ${rate(ppp)}`, myr(myrAtPPP)),
    step('Gap (PPP minus forward)', 'MYR at PPP − MYR at forward', `${myr(myrAtPPP)} − ${myr(myrAtForward)}`, myr(gapMYR)),
    step('Verdict', '|ratio − 1| < 0.0005 → aligned', `|${rate(ratio, 6)} − 1| = ${rate(Math.abs(ratio - 1), 6)}`, verdictText),
  ];
  return {
    value: { forward, pppExpected: ppp, realMY, realUS, ratio, realRatio, myrAtForward, myrAtPPP, gapMYR, verdict },
    workings,
  };
}

// ---- internal helpers (not part of the public contract, not re-exported by index.ts) ----

/** IRP forward for a deal's own tenor (days/basis). */
export function dealForward(deal: Deal, a: Assumptions): number {
  return irpForward({ spot: deal.spot, iMY: a.iMY, iUS: a.iUS, days: deal.days, basis: deal.basis }).value.forward;
}

/** PPP expected spot for a deal's own tenor (years = days/basis). */
export function dealPPP(deal: Deal, a: Assumptions): number {
  return pppExpected({ spot: deal.spot, piMY: a.piMY, piUS: a.piUS, years: deal.days / deal.basis }).value.expected;
}
