import type { Result, Scenario, Step } from './types';
import { fixed, fx, g, myr, pct, rate, step } from './format';
import { dealForward, dealPPP, ifeExpected } from './parity';

/** Workbook W6 import budget: cost of the same USD amount at an old vs a new rate. */
export function importBudget(p: {
  usd: number; rateOld: number; rateNew: number;
}): Result<{ oldMYR: number; newMYR: number; diff: number; diffPct: number }> {
  const oldMYR = p.usd * p.rateOld;
  const newMYR = p.usd * p.rateNew;
  const diff = newMYR - oldMYR;
  const diffPct = diff / oldMYR;
  return {
    value: { oldMYR, newMYR, diff, diffPct },
    workings: [
      step('Budget at old rate', 'USD × old rate', `${fixed(p.usd, 0)} × ${fx(p.rateOld)}`, myr(oldMYR)),
      step('Budget at new rate', 'USD × new rate', `${fixed(p.usd, 0)} × ${fx(p.rateNew)}`, myr(newMYR)),
      step('Difference', 'new − old', `${myr(newMYR)} − ${myr(oldMYR)}`, myr(diff)),
      step('Difference in percent', 'difference / old budget', `${myr(diff)} / ${myr(oldMYR)}`, pct(diffPct, 4)),
    ],
  };
}

/**
 * Dealer spread. Buying USD costs rate × (1 + spread); selling USD yields rate × (1 − spread).
 * extraMYR is the cost of the spread in MYR for `usd` USD (per 1 USD if usd is omitted):
 * always positive when spread > 0 (extra paid when buying, proceeds given up when selling).
 */
export function withSpread(p: {
  rate: number; spread: number; side: 'buyUSD' | 'sellUSD'; usd?: number;
}): Result<{ effectiveRate: number; extraMYR: number }> {
  const buying = p.side === 'buyUSD';
  const effectiveRate = buying ? p.rate * (1 + p.spread) : p.rate * (1 - p.spread);
  const units = p.usd ?? 1;
  const extraMYR = Math.abs(effectiveRate - p.rate) * units;
  const workings: Step[] = [
    step(
      buying ? 'Effective rate when buying USD' : 'Effective rate when selling USD',
      buying ? 'rate × (1 + spread)' : 'rate × (1 − spread)',
      `${fx(p.rate)} × (${buying ? '1 +' : '1 −'} ${g(p.spread)})`,
      `${rate(effectiveRate)} MYR/USD`,
    ),
    step(
      buying ? 'Extra MYR paid' : 'MYR proceeds given up',
      '|effective rate − rate| × USD',
      `|${rate(effectiveRate)} − ${fx(p.rate)}| × ${p.usd === undefined ? '1' : fixed(p.usd, 0)}`,
      myr(extraMYR, p.usd === undefined ? 4 : 0),
    ),
  ];
  return { value: { effectiveRate, extraMYR }, workings };
}

export type ForecastKey = 'spot' | 'forward' | 'ppp' | 'ife' | 'stress' | 'user';

/** The deal's MYR amount at each rate view. No spread is applied here. */
export function forecastViews(s: Scenario): Result<{
  rows: { key: ForecastKey; label: string; rate: number; myr: number; vsSpot: number }[];
}> {
  const { deal, a } = s;
  const usdAmt = deal.usdAmount;
  const spotMYR = usdAmt * deal.spot;
  const ife = ifeExpected({ spot: deal.spot, iMY: a.iMY, iUS: a.iUS, days: deal.days, basis: deal.basis });
  const raw: { key: ForecastKey; label: string; rate: number }[] = [
    { key: 'spot', label: 'Spot today', rate: deal.spot },
    { key: 'forward', label: 'IRP forward', rate: dealForward(deal, a) },
    { key: 'ppp', label: 'PPP expected spot', rate: dealPPP(deal, a) },
    { key: 'ife', label: 'International Fisher expected spot', rate: ife.value.expected },
    { key: 'stress', label: 'Stress spot', rate: a.stressSpot },
  ];
  if (a.userForecast !== undefined) {
    raw.push({ key: 'user', label: 'Your forecast', rate: a.userForecast });
  }
  const rows = raw.map((r) => ({
    key: r.key,
    label: r.label,
    rate: r.rate,
    myr: usdAmt * r.rate,
    vsSpot: usdAmt * r.rate - spotMYR,
  }));
  const verb = deal.mode === 'importer' ? 'cost of buying' : 'proceeds from selling';
  const workings: Step[] = [
    step(
      'Tenor',
      't = days / basis',
      `t = ${deal.days} / ${deal.basis}`,
      rate(deal.days / deal.basis, 6),
    ),
    ...rows.map((r) =>
      step(
        `${r.label}: MYR ${verb} USD`,
        'MYR = USD × rate',
        `MYR = ${fixed(usdAmt, 0)} × ${rate(r.rate)}`,
        `${myr(r.myr)} (vs spot ${r.vsSpot >= 0 ? '+' : ''}${myr(r.vsSpot)})`,
      ),
    ),
  ];
  return { value: { rows }, workings };
}
