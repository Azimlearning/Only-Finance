import type { DayBasis, Mode, Result, Scenario, Step } from './types';
import { fixed, fx, g, myr, rate, step, tStr } from './format';
import { irpForward } from './parity';
import { tenorFraction } from './tenor';

/** Forward hedge: lock the forward rate now, compare with the spot that actually arrives. */
export function forwardHedge(p: {
  usd: number; forward: number; spotAtMaturity: number;
}): Result<{ hedged: number; unhedged: number; saving: number; effectiveRate: number }> {
  const hedged = p.usd * p.forward;
  const unhedged = p.usd * p.spotAtMaturity;
  const saving = unhedged - hedged;
  const effectiveRate = hedged / p.usd;
  return {
    value: { hedged, unhedged, saving, effectiveRate },
    workings: [
      step('Hedged cost at the forward', 'USD × F', `${fixed(p.usd, 0)} × ${fx(p.forward)}`, myr(hedged)),
      step(
        'Unhedged cost at the spot that arrives',
        'USD × S_T',
        `${fixed(p.usd, 0)} × ${fx(p.spotAtMaturity)}`,
        myr(unhedged),
      ),
      step('Saving from hedging', 'unhedged − hedged', `${myr(unhedged)} − ${myr(hedged)}`, myr(saving)),
      step('Effective rate', 'hedged / USD', `${myr(hedged)} / ${fixed(p.usd, 0)}`, `${rate(effectiveRate)} MYR/USD`),
    ],
  };
}

/**
 * Currency option hedge. Importer buys a call (cap on cost), exporter buys a put (floor on proceeds).
 * call: effective = (min(S, K) + premium) × USD; put: effective = (max(S, K) − premium) × USD.
 */
export function optionHedge(p: {
  usd: number; strike: number; premium: number; spotAtMaturity: number; type: 'call' | 'put';
}): Result<{
  intrinsic: number;
  netPerUnit: number;
  gross: number;
  totalPremium: number;
  netBenefit: number;
  effectiveMYR: number;
  unhedgedMYR: number;
  exercised: boolean;
}> {
  const isCall = p.type === 'call';
  const intrinsic = isCall
    ? Math.max(p.spotAtMaturity - p.strike, 0)
    : Math.max(p.strike - p.spotAtMaturity, 0);
  const netPerUnit = intrinsic - p.premium;
  const gross = intrinsic * p.usd;
  const totalPremium = p.premium * p.usd;
  const netBenefit = gross - totalPremium;
  const effectiveMYR = isCall
    ? (Math.min(p.spotAtMaturity, p.strike) + p.premium) * p.usd
    : (Math.max(p.spotAtMaturity, p.strike) - p.premium) * p.usd;
  const unhedgedMYR = p.spotAtMaturity * p.usd;
  const exercised = intrinsic > 0;
  const kind = isCall ? 'call' : 'put';
  const workings: Step[] = [
    step(
      `Intrinsic value of the ${kind}`,
      isCall ? 'max(S_T − K, 0)' : 'max(K − S_T, 0)',
      isCall
        ? `max(${fx(p.spotAtMaturity)} − ${fx(p.strike)}, 0)`
        : `max(${fx(p.strike)} − ${fx(p.spotAtMaturity)}, 0)`,
      `${rate(intrinsic)} MYR/USD`,
    ),
    step(
      'Net per USD after premium',
      'intrinsic − premium',
      `${rate(intrinsic)} − ${fx(p.premium)}`,
      `${rate(netPerUnit)} MYR/USD`,
    ),
    step('Gross option payoff', 'intrinsic × USD', `${rate(intrinsic)} × ${fixed(p.usd, 0)}`, myr(gross)),
    step('Total premium paid', 'premium × USD', `${fx(p.premium)} × ${fixed(p.usd, 0)}`, myr(totalPremium)),
    step('Net benefit', 'gross − total premium', `${myr(gross)} − ${myr(totalPremium)}`, myr(netBenefit)),
    step(
      'Effective MYR with the option',
      isCall ? '(min(S_T, K) + premium) × USD' : '(max(S_T, K) − premium) × USD',
      isCall
        ? `(min(${fx(p.spotAtMaturity)}, ${fx(p.strike)}) + ${fx(p.premium)}) × ${fixed(p.usd, 0)}`
        : `(max(${fx(p.spotAtMaturity)}, ${fx(p.strike)}) − ${fx(p.premium)}) × ${fixed(p.usd, 0)}`,
      myr(effectiveMYR),
    ),
    step('Unhedged MYR', 'S_T × USD', `${fx(p.spotAtMaturity)} × ${fixed(p.usd, 0)}`, myr(unhedgedMYR)),
    step(
      'Exercised?',
      'intrinsic > 0',
      `${rate(intrinsic)} > 0`,
      exercised ? 'yes, exercised' : 'no, expires worthless',
    ),
  ];
  return {
    value: { intrinsic, netPerUnit, gross, totalPremium, netBenefit, effectiveMYR, unhedgedMYR, exercised },
    workings,
  };
}

/** Workbook W6 option payoff sheet for one strike, spot and premium. */
export function optionPayoffs(p: {
  strike: number; spot: number; premium: number;
}): Result<{ callIntrinsic: number; putIntrinsic: number; callNet: number; putNet: number }> {
  const callIntrinsic = Math.max(p.spot - p.strike, 0);
  const putIntrinsic = Math.max(p.strike - p.spot, 0);
  const callNet = callIntrinsic - p.premium;
  const putNet = putIntrinsic - p.premium;
  return {
    value: { callIntrinsic, putIntrinsic, callNet, putNet },
    workings: [
      step('Call intrinsic', 'max(S − K, 0)', `max(${fx(p.spot)} − ${fx(p.strike)}, 0)`, rate(callIntrinsic)),
      step('Put intrinsic', 'max(K − S, 0)', `max(${fx(p.strike)} − ${fx(p.spot)}, 0)`, rate(putIntrinsic)),
      step('Call net of premium', 'call intrinsic − premium', `${rate(callIntrinsic)} − ${fx(p.premium)}`, rate(callNet)),
      step('Put net of premium', 'put intrinsic − premium', `${rate(putIntrinsic)} − ${fx(p.premium)}`, rate(putNet)),
    ],
  };
}

/**
 * Money-market hedge.
 * Importer: deposit USD now (PV of the USD payable), funded by borrowing MYR; repay the MYR loan at maturity.
 * Exporter: borrow the PV of the USD receivable, convert to MYR and deposit; the USD receipt repays the USD loan.
 */
export function moneyMarketHedge(p: {
  usd: number; spot: number; iMY: number; iUS: number; days?: number; basis?: DayBasis; mode: Mode;
}): Result<{ usdLeg: number; myrLeg: number; myrAtMaturity: number; impliedRate: number }> {
  const t = tenorFraction(p.days, p.basis);
  const ts = tStr(p.days, p.basis);
  const usdLeg = p.usd / (1 + p.iUS * t);
  const myrLeg = usdLeg * p.spot;
  const myrAtMaturity = myrLeg * (1 + p.iMY * t);
  const impliedRate = myrAtMaturity / p.usd;
  const importer = p.mode === 'importer';
  const workings: Step[] = [
    step(
      importer ? 'USD to deposit today (PV of the USD payable)' : 'USD to borrow today (PV of the USD receivable)',
      'USD_now = USD / (1 + i_US·t)',
      `USD_now = ${fixed(p.usd, 0)} / (1 + ${g(p.iUS)}×${ts})`,
      usd2(usdLeg),
    ),
    step(
      importer ? 'MYR to borrow today' : 'MYR deposited today',
      'MYR_now = USD_now × S',
      `MYR_now = ${usd2(usdLeg)} × ${fx(p.spot)}`,
      myr(myrLeg, 2),
    ),
    step(
      importer ? 'MYR loan repaid at maturity' : 'MYR deposit at maturity',
      'MYR_T = MYR_now × (1 + i_MY·t)',
      `MYR_T = ${myr(myrLeg, 2)} × (1 + ${g(p.iMY)}×${ts})`,
      myr(myrAtMaturity, 2),
    ),
    step(
      'Implied rate',
      'MYR_T / USD',
      `${myr(myrAtMaturity, 2)} / ${fixed(p.usd, 0)}`,
      `${rate(impliedRate)} MYR/USD`,
    ),
  ];
  return { value: { usdLeg, myrLeg, myrAtMaturity, impliedRate }, workings };
}

function usd2(n: number): string {
  return `USD ${fixed(n, 2)}`;
}

/** Outcome in MYR of every hedge across a range of spot rates at maturity. */
export function hedgeComparison(s: Scenario, spots?: number[]): Result<{
  points: { spot: number; unhedged: number; forward: number; option: number; moneyMarket: number }[];
}> {
  const { deal, a } = s;
  const pts =
    spots ??
    Array.from({ length: 25 }, (_, k) => deal.spot * (0.9 + (0.2 * k) / 24));
  const irp = irpForward({ spot: deal.spot, iMY: a.iMY, iUS: a.iUS, days: deal.days, basis: deal.basis });
  const fwd = a.quotedForward ?? irp.value.forward;
  const mm = moneyMarketHedge({
    usd: deal.usdAmount, spot: deal.spot, iMY: a.iMY, iUS: a.iUS, days: deal.days, basis: deal.basis, mode: deal.mode,
  });
  const type = deal.mode === 'importer' ? 'call' : 'put';
  const points = pts.map((spot) => ({
    spot,
    unhedged: deal.usdAmount * spot,
    forward: deal.usdAmount * fwd,
    option: optionHedge({
      usd: deal.usdAmount, strike: a.optionStrike, premium: a.optionPremium, spotAtMaturity: spot, type,
    }).value.effectiveMYR,
    moneyMarket: mm.value.myrAtMaturity,
  }));
  const workings: Step[] = [
    ...irp.workings,
    step(
      'Forward rate used',
      a.quotedForward !== undefined ? 'bank-quoted forward' : 'IRP forward (no quote given)',
      a.quotedForward !== undefined ? `quoted F = ${fx(a.quotedForward)}` : `IRP F = ${rate(irp.value.forward)}`,
      `${rate(fwd)} MYR/USD`,
    ),
    step(
      'Forward outcome (flat in spot)',
      'USD × F',
      `${fixed(deal.usdAmount, 0)} × ${rate(fwd)}`,
      myr(deal.usdAmount * fwd),
    ),
    step(
      deal.mode === 'importer' ? 'Option outcome (call)' : 'Option outcome (put)',
      deal.mode === 'importer' ? '(min(S_T, K) + premium) × USD' : '(max(S_T, K) − premium) × USD',
      `K = ${fx(a.optionStrike)}, premium = ${fx(a.optionPremium)}, USD = ${fixed(deal.usdAmount, 0)}`,
      deal.mode === 'importer'
        ? `capped at ${myr((a.optionStrike + a.optionPremium) * deal.usdAmount)}`
        : `floored at ${myr((a.optionStrike - a.optionPremium) * deal.usdAmount)}`,
    ),
    ...mm.workings,
    step(
      'Spot range',
      '25 points from 0.90·S to 1.10·S (unless supplied)',
      `${pts.length} points, ${rate(pts[0] ?? 0)} to ${rate(pts[pts.length - 1] ?? 0)}`,
      'unhedged = USD × S_T at each point',
    ),
  ];
  return { value: { points }, workings };
}

/** Break-even spot rates where each hedge stops beating the alternative. */
export function breakEvens(p: {
  forward: number; strike: number; premium: number; mode: Mode;
}): Result<{ forwardVsUnhedged: number; optionVsUnhedged: number; optionVsForward: number }> {
  const importer = p.mode === 'importer';
  const forwardVsUnhedged = p.forward;
  const optionVsUnhedged = importer ? p.strike + p.premium : p.strike - p.premium;
  const optionVsForward = importer ? p.forward - p.premium : p.forward + p.premium;
  return {
    value: { forwardVsUnhedged, optionVsUnhedged, optionVsForward },
    workings: [
      step(
        'Forward vs unhedged break-even',
        'S* = F',
        `S* = ${fx(p.forward)}`,
        `${rate(forwardVsUnhedged)} MYR/USD`,
      ),
      step(
        importer ? 'Call option vs unhedged break-even' : 'Put option vs unhedged break-even',
        importer ? 'S* = K + premium' : 'S* = K − premium',
        `S* = ${fx(p.strike)} ${importer ? '+' : '−'} ${fx(p.premium)}`,
        `${rate(optionVsUnhedged)} MYR/USD`,
      ),
      step(
        importer ? 'Call option vs forward break-even' : 'Put option vs forward break-even',
        importer ? 'S* = F − premium' : 'S* = F + premium',
        `S* = ${fx(p.forward)} ${importer ? '−' : '+'} ${fx(p.premium)}`,
        `${rate(optionVsForward)} MYR/USD`,
      ),
    ],
  };
}
