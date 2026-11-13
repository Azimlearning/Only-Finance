// Deterministic "facts": plain-English sentences generated IN CODE from engine values and the deal mode
// (importer vs exporter). Every direction word (above/below, higher/lower, weaker/stronger, cheaper/dearer)
// the tutor may say comes from here, never from the model. Used by tool results (online) and by the
// offline templates, so both always agree.

import * as E from '../engine';
import type { Mode, Scenario } from '../engine';
import { fixed, myr as fmtMyr, rate as fmtRate } from '../engine/format';

export interface FactCtx {
  mode: Mode;
  scenario?: Scenario;
}

// ---------- formatting ----------

const EPS = 1e-9;
const R = (x: number): string => fmtRate(x); // 4 dp, MYR per 1 USD
const M = (x: number): string => fmtMyr(Math.abs(x)); // RM 443,541 (always positive; direction is in words)
const P = (x: number, dp = 2): string => `${fixed(Math.abs(x) * 100, dp)}%`; // from a decimal, magnitude only
const PI = (x: number): string => `${+(x * 100).toFixed(3)}%`; // input-style percentage (3%, 4.5%)
const num = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : NaN);

const isImp = (c: FactCtx): boolean => c.mode === 'importer';
const noun = (c: FactCtx): string => (isImp(c) ? 'ringgit cost' : 'ringgit income');
/** What a higher MYR-per-USD rate (weaker ringgit) means for this user. */
const higherRateMeans = (c: FactCtx): string =>
  isImp(c)
    ? 'a higher rate means a weaker ringgit, so you pay more ringgit for the same dollars (worse for you)'
    : 'a higher rate means a weaker ringgit, so you receive more ringgit for the same dollars (better for you)';
/** Is a higher ringgit amount good for this user? */
const upIsGood = (c: FactCtx): boolean => !isImp(c);
const goodBad = (c: FactCtx, delta: number): string =>
  Math.abs(delta) < EPS ? 'no change for you' : (delta > 0) === upIsGood(c) ? 'better for you' : 'worse for you';
const risesFalls = (d: number): string => (Math.abs(d) < EPS ? 'stays the same' : d > 0 ? 'rises' : 'falls');
const weakStrong = (fromRate: number, toRate: number): string =>
  Math.abs(toRate - fromRate) < EPS ? 'unchanged' : toRate > fromRate ? 'weaker' : 'stronger';

/** What a lower/higher ringgit amount means in one clause for this user. */
function amountDelta(c: FactCtx, delta: number): string {
  if (Math.abs(delta) < EPS) return `your ${noun(c)} does not change`;
  return `your ${noun(c)} ${delta > 0 ? 'rises' : 'falls'} by ${M(delta)} (${goodBad(c, delta)})`;
}

const INPUT_LABEL: Record<string, string> = {
  iMY: 'Malaysian interest rate',
  iUS: 'US interest rate',
  piMY: 'Malaysian inflation',
  piUS: 'US inflation',
  spot: 'spot rate',
};
const isRateInput = (k: string): boolean => k !== 'spot';
const fmtInput = (k: string, x: number): string => (isRateInput(k) ? PI(x) : `${R(x)} MYR per 1 USD`);

// ---------- per-tool generators ----------

type A = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type V = any;

function irpFacts(a: A, v: V, c: FactCtx): string[] {
  const spot = num(a.spot);
  const iMY = num(a.iMY);
  const iUS = num(a.iUS);
  const f = v.forward as number;
  const out: string[] = [];
  const gap = f - spot;
  if (Math.abs(gap) < EPS) {
    out.push(`The interest-rate forward (${R(f)}) equals today's spot (${R(spot)}) because ringgit and dollar interest rates are the same.`);
  } else if (gap < 0) {
    out.push(
      `The interest-rate forward (${R(f)}) is BELOW today's spot (${R(spot)}) by ${R(-gap)} MYR per USD (${P(v.premium)}), because Malaysian interest (${PI(iMY)}) is lower than US interest (${PI(iUS)}). In market language the ringgit is at a forward premium and the dollar at a forward discount.`,
    );
    out.push(
      isImp(c)
        ? `Locking this forward means you would pay fewer ringgit per dollar than today's spot (a lower ringgit cost than spot).`
        : `Locking this forward means you would receive fewer ringgit per dollar than today's spot (a lower ringgit income than spot).`,
    );
  } else {
    out.push(
      `The interest-rate forward (${R(f)}) is ABOVE today's spot (${R(spot)}) by ${R(gap)} MYR per USD (${P(v.premium)}), because Malaysian interest (${PI(iMY)}) is higher than US interest (${PI(iUS)}). In market language the ringgit is at a forward discount and the dollar at a forward premium.`,
    );
    out.push(
      isImp(c)
        ? `Locking this forward means you would pay more ringgit per dollar than today's spot (a higher ringgit cost than spot).`
        : `Locking this forward means you would receive more ringgit per dollar than today's spot (a higher ringgit income than spot).`,
    );
  }
  out.push(
    `The forward only prices in the interest-rate gap so that nobody earns a free profit; it is not a forecast of where spot will end up.`,
  );
  return out;
}

function pppFacts(a: A, v: V, c: FactCtx): string[] {
  const spot = num(a.spot);
  const piMY = num(a.piMY);
  const piUS = num(a.piUS);
  const e = v.expected as number;
  const out: string[] = [];
  const dir = weakStrong(spot, e);
  if (dir === 'unchanged') {
    out.push(`Purchasing power parity (PPP) expects no change in the rate (${R(e)}) because Malaysian and US inflation are the same (${PI(piMY)}).`);
  } else if (dir === 'weaker') {
    out.push(
      `PPP expects the ringgit to get WEAKER: the expected rate is ${R(e)} MYR per USD against spot ${R(spot)} (up ${P(v.change)}), because Malaysian inflation (${PI(piMY)}) is higher than US inflation (${PI(piUS)}).`,
    );
  } else {
    out.push(
      `PPP expects the ringgit to get STRONGER: the expected rate is ${R(e)} MYR per USD against spot ${R(spot)} (down ${P(v.change)}), because Malaysian inflation (${PI(piMY)}) is lower than US inflation (${PI(piUS)}).`,
    );
  }
  if (dir !== 'unchanged') {
    out.push(
      isImp(c)
        ? dir === 'weaker'
          ? 'For an importer a weaker ringgit means more ringgit per dollar, so your ringgit cost goes up (worse for you).'
          : 'For an importer a stronger ringgit means fewer ringgit per dollar, so your ringgit cost goes down (better for you).'
        : dir === 'weaker'
          ? 'For an exporter a weaker ringgit means more ringgit per dollar, so your ringgit income goes up (better for you).'
          : 'For an exporter a stronger ringgit means fewer ringgit per dollar, so your ringgit income goes down (worse for you).',
    );
  }
  out.push('Inflation does not change the interest-rate forward (it depends only on interest rates); only the PPP view moves with inflation. PPP is a long-run tendency, not a forecast for one invoice.');
  return out;
}

function fisherRealFacts(a: A, v: V, c: FactCtx): string[] {
  const i = num(a.i);
  const pi = num(a.pi);
  const real = v.real as number;
  const out: string[] = [];
  out.push(
    real < -EPS
      ? `The real rate is negative (${P(real, 3)}): prices rise faster (${PI(pi)}) than the interest earns (${PI(i)}), so money loses buying power.`
      : real > EPS
        ? `The real rate is positive (${P(real, 3)}): the interest (${PI(i)}) is higher than inflation (${PI(pi)}), so money gains buying power.`
        : `The real rate is zero: interest (${PI(i)}) just matches inflation (${PI(pi)}).`,
  );
  const s = c.scenario;
  if (s) {
    const my = E.fisherReal({ i: s.a.iMY, pi: s.a.piMY }).value.real;
    const us = E.fisherReal({ i: s.a.iUS, pi: s.a.piUS }).value.real;
    const matches =
      (Math.abs(i - s.a.iMY) < EPS && Math.abs(pi - s.a.piMY) < EPS) ||
      (Math.abs(i - s.a.iUS) < EPS && Math.abs(pi - s.a.piUS) < EPS);
    if (matches) out.push(...realGapFacts(my, us));
  }
  return out;
}

/** Which country has the higher real rate, and what that tends to do to the ringgit. */
function realGapFacts(realMY: number, realUS: number): string[] {
  const d = realMY - realUS;
  if (Math.abs(d) < EPS) return [`Real rates are the same in Malaysia (${P(realMY, 3)}) and the US (${P(realUS, 3)}), so there is no pull on the ringgit either way.`];
  return d < 0
    ? [
        `The US real rate (${P(realUS, 3)}${realUS < 0 ? ' negative' : ''}) is HIGHER than the Malaysian real rate (${P(realMY, 3)}${realMY < 0 ? ' negative' : ''}), so Malaysian savers earn less real return than US savers, which tends to put pressure on the ringgit (toward weaker).`,
      ]
    : [
        `The Malaysian real rate (${P(realMY, 3)}${realMY < 0 ? ' negative' : ''}) is HIGHER than the US real rate (${P(realUS, 3)}${realUS < 0 ? ' negative' : ''}), so Malaysian savers earn more real return than US savers, which tends to support the ringgit (toward stronger).`,
      ];
}

function fisherNominalFacts(a: A, v: V): string[] {
  const real = num(a.real);
  const pi = num(a.pi);
  return [
    `A real rate of ${P(real, 3)}${real < 0 ? ' (negative)' : ''} with inflation of ${PI(pi)} needs a nominal interest rate of ${P(v.nominal, 3)}; the rough rule (real + inflation) gives ${P(v.approx, 3)}.`,
  ];
}

function ifeFacts(a: A, v: V): string[] {
  const spot = num(a.spot);
  const iMY = num(a.iMY);
  const iUS = num(a.iUS);
  const e = v.expected as number;
  const dir = weakStrong(spot, e);
  if (dir === 'unchanged') return [`The International Fisher Effect expects no change in the rate (${R(e)}) because ringgit and dollar interest are the same.`];
  return [
    dir === 'weaker'
      ? `The International Fisher Effect expects the ringgit to get WEAKER (${R(spot)} to ${R(e)} MYR per USD, up ${P(v.change)}) because Malaysian interest (${PI(iMY)}) is higher than US interest (${PI(iUS)}): the higher-interest currency is expected to lose value.`
      : `The International Fisher Effect expects the ringgit to get STRONGER (${R(spot)} to ${R(e)} MYR per USD, down ${P(v.change)}) because Malaysian interest (${PI(iMY)}) is lower than US interest (${PI(iUS)}): the lower-interest currency is expected to gain value.`,
    'This is an expectation from theory, not a forecast.',
  ];
}

function parityFacts(a: A, v: V, c: FactCtx): string[] {
  const out: string[] = [];
  const spot = num(a.spot);
  out.push(
    ...irpFacts({ spot, iMY: a.iMY, iUS: a.iUS }, { forward: v.forward, premium: v.forward / spot - 1 }, c).slice(0, 1),
  );
  out.push(...pppFacts({ spot, piMY: a.piMY, piUS: a.piUS }, { expected: v.pppExpected, change: v.pppExpected / spot - 1 }, c).slice(0, 1));
  if (v.verdict === 'aligned') {
    out.push(`The interest-rate forward (${R(v.forward)}) and the PPP expected rate (${R(v.pppExpected)}) are almost the same, so interest rates and inflation tell the same story.`);
  } else if (v.verdict === 'forwardCheaper') {
    out.push(
      `The forward (${R(v.forward)}) is BELOW the PPP expected rate (${R(v.pppExpected)}), so the forward is the cheaper way to buy dollars: ${M(v.myrAtForward)} at the forward against ${M(v.myrAtPPP)} at the PPP rate, a gap of ${M(v.gapMYR)}.`,
    );
    out.push(
      isImp(c)
        ? `For an importer that gap is in your favour (a lower ringgit cost at the forward).`
        : `For an exporter that gap is against you (fewer ringgit received at the forward than at the PPP rate).`,
    );
  } else {
    out.push(
      `The forward (${R(v.forward)}) is ABOVE the PPP expected rate (${R(v.pppExpected)}), so the forward is the dearer way to buy dollars: ${M(v.myrAtForward)} at the forward against ${M(v.myrAtPPP)} at the PPP rate, a gap of ${M(v.gapMYR)}.`,
    );
    out.push(
      isImp(c)
        ? `For an importer that gap is against you (a higher ringgit cost at the forward).`
        : `For an exporter that gap is in your favour (more ringgit received at the forward than at the PPP rate).`,
    );
  }
  out.push(...realGapFacts(v.realMY, v.realUS));
  out.push('The forward comes from the interest gap and PPP from the inflation gap; they only agree when real rates match.');
  return out;
}

function ciaFacts(a: A, v: V): string[] {
  const q = num(a.quotedForward);
  const irp = v.irpForward as number;
  const rel = Math.abs(q - irp) < EPS ? 'equal to' : q < irp ? 'BELOW' : 'ABOVE';
  const head = `The quoted forward (${R(q)}) is ${rel} the fair interest-rate forward (${R(irp)}).`;
  if (v.direction === 'borrowUSD_investMYR') {
    return [
      head,
      `Dollars are cheap to buy forward, so the profitable route is: borrow dollars, convert them to ringgit, invest the ringgit, and buy dollars forward to repay. Gain: ${R(v.profitPerUnit)} ${v.unit} per 1 ${v.unit} borrowed after the spread (${R(v.profitPerUnitNoSpread)} before it), about ${M(v.profitTotal)} on the amount.`,
    ];
  }
  if (v.direction === 'borrowMYR_investUSD') {
    return [
      head,
      `Dollars are dear to buy forward, so the profitable route is: borrow ringgit, convert them to dollars, invest the dollars, and sell dollars forward to repay. Gain: ${R(v.profitPerUnit)} ${v.unit} per 1 ${v.unit} borrowed after the spread (${R(v.profitPerUnitNoSpread)} before it), about ${M(v.profitTotal)} on the amount.`,
    ];
  }
  return [head, `After the bank spread there is no risk-free profit in either direction (gain per unit before the spread would be ${R(v.profitPerUnitNoSpread)}).`];
}

function ciaCompareFacts(_a: A, v: V): string[] {
  const d = v.extra as number;
  const home = fixed(v.homeMaturity, 2);
  const hedged = fixed(v.hedgedHome, 2);
  if (Math.abs(d) < EPS) return [`The hedged foreign route (${hedged}) and the home deposit (${home}) end at the same amount.`];
  return [
    d > 0
      ? `The hedged foreign route ends with ${hedged} against ${home} for the home deposit: it earns ${fixed(d, 2)} MORE (${P(v.extraPct)} of the amount), so the foreign route wins.`
      : `The hedged foreign route ends with ${hedged} against ${home} for the home deposit: it earns ${fixed(-d, 2)} LESS (${P(v.extraPct)} of the amount), so the home deposit wins.`,
  ];
}

function importBudgetFacts(a: A, v: V, c: FactCtx): string[] {
  const o = num(a.rateOld);
  const n = num(a.rateNew);
  const w = weakStrong(o, n);
  const diff = v.diff as number;
  if (w === 'unchanged') return [`The rate does not change (${R(o)}), so your ringgit amount stays at ${M(v.oldMYR)}.`];
  return [
    `The rate moves from ${R(o)} to ${R(n)} MYR per USD: the ringgit gets ${w.toUpperCase()} (${n > o ? 'more' : 'fewer'} ringgit per dollar).`,
    `The ringgit amount goes from ${M(v.oldMYR)} to ${M(v.newMYR)}, a change of ${P(v.diffPct)}: ${amountDelta(c, diff)}.`,
  ];
}

function withSpreadFacts(a: A, v: V): string[] {
  const rate = num(a.rate);
  const buying = a.side === 'buyUSD';
  return [
    buying
      ? `When you buy dollars the bank charges more than the mid rate: ${R(v.effectiveRate)} against ${R(rate)} MYR per USD (higher, so you pay more).`
      : `When you sell dollars the bank pays less than the mid rate: ${R(v.effectiveRate)} against ${R(rate)} MYR per USD (lower, so you receive less).`,
    buying ? `The extra cost from the spread is ${M(v.extraMYR)}.` : `The proceeds given up to the spread are ${M(v.extraMYR)}.`,
  ];
}

function periodRateFacts(a: A, v: V): string[] {
  return [`An annual rate of ${PI(num(a.annual))} over ${num(a.days)} days is ${P(v.rate, 4)} for the period.`];
}

function forecastFacts(_a: A, v: V, c: FactCtx): string[] {
  const rows = v.rows as { key: string; label: string; rate: number; myr: number; vsSpot: number }[];
  const out: string[] = [];
  const spotRow = rows.find((r) => r.key === 'spot');
  for (const r of rows) {
    if (r.key === 'spot') {
      out.push(`At today's spot (${R(r.rate)} MYR per USD) the deal is ${M(r.myr)}.`);
    } else {
      out.push(
        `Under "${r.label}" the rate is ${R(r.rate)} MYR per USD${spotRow ? ` (${weakStrong(spotRow.rate, r.rate)} ringgit than spot)` : ''}, so the deal is ${M(r.myr)}; versus spot, ${amountDelta(c, r.vsSpot)}.`,
      );
    }
  }
  if (rows.length > 1) {
    const low = rows.reduce((x, y) => (y.myr < x.myr ? y : x), rows[0]);
    const high = rows.reduce((x, y) => (y.myr > x.myr ? y : x), rows[0]);
    out.push(
      isImp(c)
        ? `The lowest ringgit cost is under "${low.label}" (${M(low.myr)}, best for you) and the highest under "${high.label}" (${M(high.myr)}, worst for you).`
        : `The lowest ringgit income is under "${low.label}" (${M(low.myr)}, worst for you) and the highest under "${high.label}" (${M(high.myr)}, best for you).`,
    );
  }
  out.push(`For you, ${higherRateMeans(c)}.`);
  return out;
}

function forwardHedgeFacts(a: A, v: V, c: FactCtx): string[] {
  const F = num(a.forward);
  const S = num(a.spotAtMaturity);
  const d = Math.abs(v.saving as number);
  const out: string[] = [];
  if (Math.abs(S - F) < EPS) {
    out.push(`Spot at maturity (${R(S)}) equals the forward (${R(F)}), so the forward and doing nothing give the same ringgit amount (${M(v.hedged)}).`);
  } else if (isImp(c)) {
    out.push(
      S > F
        ? `If spot ends at ${R(S)}, ABOVE the forward (${R(F)}), the ringgit is weaker than the forward priced in: the forward costs ${M(v.hedged)} against ${M(v.unhedged)} unhedged, so the forward is CHEAPER by ${M(d)}.`
        : `If spot ends at ${R(S)}, BELOW the forward (${R(F)}), the ringgit is stronger than the forward priced in: the forward costs ${M(v.hedged)} against ${M(v.unhedged)} unhedged, so the forward is DEARER by ${M(d)} (you gave up the chance to pay less).`,
    );
  } else {
    out.push(
      S < F
        ? `If spot ends at ${R(S)}, BELOW the forward (${R(F)}), the ringgit is stronger than the forward priced in: the forward gives you ${M(v.hedged)} against ${M(v.unhedged)} unhedged, so the forward gives you MORE by ${M(d)}.`
        : `If spot ends at ${R(S)}, ABOVE the forward (${R(F)}), the ringgit is weaker than the forward priced in: the forward gives you ${M(v.hedged)} against ${M(v.unhedged)} unhedged, so the forward gives you LESS by ${M(d)} (you gave up the extra).`,
    );
  }
  out.push(
    isImp(c)
      ? `Rule for an importer: if spot ends ABOVE the forward (ringgit weaker) the forward saved you money; if spot ends BELOW the forward (ringgit stronger) paying spot would have cost less, so the forward gives up the gain when the ringgit gets stronger.`
      : `Rule for an exporter: if spot ends BELOW the forward (ringgit stronger) the forward gave you more ringgit; if spot ends ABOVE the forward (ringgit weaker) selling at spot would have given more, so the forward gives up the extra when the ringgit gets weaker.`,
  );
  out.push(`The forward fixes your ${noun(c)} at ${M(v.hedged)} (effective rate ${R(v.effectiveRate)}) whatever spot does.`);
  return out;
}

/** The forward the scenario would use, if a scenario is available. */
function scenarioForward(s?: Scenario): number | undefined {
  if (!s) return undefined;
  return s.a.quotedForward ?? E.irpForward({ spot: s.deal.spot, iMY: s.a.iMY, iUS: s.a.iUS, days: s.deal.days, basis: s.deal.basis }).value.forward;
}

function optionHedgeFacts(a: A, v: V, c0: FactCtx): string[] {
  const isCall = a.type === 'call';
  const K = num(a.strike);
  const p = num(a.premium);
  const S = num(a.spotAtMaturity);
  const be = isCall ? K + p : K - p;
  const eff = v.effectiveMYR as number;
  const unh = v.unhedgedMYR as number;
  const out: string[] = [];
  if (isCall) {
    out.push(
      v.exercised
        ? `Spot ends at ${R(S)}, ABOVE the strike (${R(K)}), so the call is used: you pay the strike plus the premium (${R(be)} per dollar). Total ${M(eff)} against ${M(unh)} unhedged, so the option is ${eff < unh ? 'CHEAPER' : 'DEARER'} than unhedged by ${M(unh - eff)}.`
        : `Spot ends at ${R(S)}, BELOW the strike (${R(K)}), so the call expires unused: you buy dollars at spot and have also paid the premium. Total ${M(eff)} against ${M(unh)} unhedged, so the option is DEARER than unhedged by the premium, ${M(v.totalPremium)}.`,
    );
    out.push(`The most you can pay per dollar with the call is the strike plus the premium, ${R(be)} (a cap on your cost, ${M(be * num(a.usd))} in total).`);
    out.push(`The call beats simply paying spot only when spot ends ABOVE ${R(be)} (strike plus premium); below that, paying spot is cheaper by up to the premium.`);
  } else {
    out.push(
      v.exercised
        ? `Spot ends at ${R(S)}, BELOW the strike (${R(K)}), so the put is used: you sell at the strike minus the premium (${R(be)} per dollar). Total ${M(eff)} against ${M(unh)} unhedged, so the option gives you ${eff > unh ? 'MORE' : 'LESS'} than unhedged by ${M(eff - unh)}.`
        : `Spot ends at ${R(S)}, ABOVE the strike (${R(K)}), so the put expires unused: you sell at spot and have also paid the premium. Total ${M(eff)} against ${M(unh)} unhedged, so the option gives you LESS than unhedged by the premium, ${M(v.totalPremium)}.`,
    );
    out.push(`The least you can receive per dollar with the put is the strike minus the premium, ${R(be)} (a floor under your income, ${M(be * num(a.usd))} in total).`);
    out.push(`The put beats simply selling at spot only when spot ends BELOW ${R(be)} (strike minus premium); above that, selling at spot gives you more by up to the premium.`);
  }
  const F = scenarioForward(c0.scenario);
  if (F !== undefined) {
    const bf = isCall ? F - p : F + p;
    out.push(
      isCall
        ? `Against the forward (${R(F)}), the call is cheaper only when spot ends BELOW ${R(bf)} (forward minus premium); above that the forward is cheaper.`
        : `Against the forward (${R(F)}), the put gives you more only when spot ends ABOVE ${R(bf)} (forward plus premium); below that the forward gives you more.`,
    );
  }
  out.push(`The premium (${M(v.totalPremium)}) is paid whether or not you use the option.`);
  return out;
}

function optionPayoffFacts(a: A, v: V): string[] {
  const K = num(a.strike);
  const S = num(a.spot);
  const p = num(a.premium);
  const out: string[] = [];
  if (S > K + EPS) {
    out.push(`Spot (${R(S)}) is ABOVE the strike (${R(K)}): the call is worth ${R(v.callIntrinsic)} per dollar and the put is worth nothing.`);
  } else if (S < K - EPS) {
    out.push(`Spot (${R(S)}) is BELOW the strike (${R(K)}): the put is worth ${R(v.putIntrinsic)} per dollar and the call is worth nothing.`);
  } else {
    out.push(`Spot equals the strike (${R(K)}): both the call and the put are worth nothing.`);
  }
  out.push(
    `After the premium of ${R(p)}, the call nets ${v.callNet < 0 ? 'a loss of ' : ''}${R(Math.abs(v.callNet))} and the put nets ${v.putNet < 0 ? 'a loss of ' : ''}${R(Math.abs(v.putNet))} per dollar.`,
  );
  out.push('A call pays when spot ends ABOVE the strike (it protects an importer); a put pays when spot ends BELOW the strike (it protects an exporter).');
  return out;
}

function moneyMarketFacts(a: A, v: V, c0: FactCtx): string[] {
  const mode: Mode = a.mode === 'exporter' ? 'exporter' : a.mode === 'importer' ? 'importer' : c0.mode;
  const c: FactCtx = { ...c0, mode };
  const spot = num(a.spot);
  const X = v.impliedRate as number;
  const out: string[] = [];
  out.push(
    isImp(c)
      ? `Borrowing ringgit and holding dollars locks your ringgit cost at ${M(v.myrAtMaturity)} (an implied rate of ${R(X)} MYR per USD) whatever spot does.`
      : `Borrowing dollars and holding ringgit locks your ringgit income at ${M(v.myrAtMaturity)} (an implied rate of ${R(X)} MYR per USD) whatever spot does.`,
  );
  if (Math.abs(X - spot) > EPS) {
    out.push(`The locked rate (${R(X)}) is ${X < spot ? 'BELOW' : 'ABOVE'} today's spot (${R(spot)}), because of the interest gap between the two currencies.`);
  }
  out.push(
    isImp(c)
      ? 'Like a forward, it protects you if spot ends ABOVE the locked rate (ringgit weaker) and gives up the gain if spot ends BELOW it (ringgit stronger).'
      : 'Like a forward, it protects you if spot ends BELOW the locked rate (ringgit stronger) and gives up the extra if spot ends ABOVE it (ringgit weaker).',
  );
  out.push('It should land close to the interest-rate forward because both use the same interest rates.');
  return out;
}

function breakEvenFacts(a: A, v: V, c0: FactCtx): string[] {
  const mode: Mode = a.mode === 'exporter' ? 'exporter' : a.mode === 'importer' ? 'importer' : c0.mode;
  const imp = mode === 'importer';
  const F = v.forwardVsUnhedged as number;
  const OU = v.optionVsUnhedged as number;
  const OF = v.optionVsForward as number;
  if (imp) {
    return [
      `Forward versus paying spot: the forward is cheaper only when spot at maturity ends ABOVE ${R(F)}; if spot ends BELOW ${R(F)}, paying spot would have been cheaper.`,
      `Call option versus paying spot: the call is cheaper only when spot ends ABOVE ${R(OU)} (strike plus premium); if spot ends BELOW ${R(OU)}, paying spot is cheaper, by at most the premium.`,
      `Call option versus the forward: the call is cheaper only when spot ends BELOW ${R(OF)} (forward minus premium); if spot ends ABOVE ${R(OF)}, the forward is cheaper.`,
    ];
  }
  return [
    `Forward versus selling at spot: the forward gives you more only when spot at maturity ends BELOW ${R(F)}; if spot ends ABOVE ${R(F)}, selling at spot would have given more.`,
    `Put option versus selling at spot: the put gives you more only when spot ends BELOW ${R(OU)} (strike minus premium); if spot ends ABOVE ${R(OU)}, selling at spot gives more, by at most the premium.`,
    `Put option versus the forward: the put gives you more only when spot ends ABOVE ${R(OF)} (forward plus premium); if spot ends BELOW ${R(OF)}, the forward gives you more.`,
  ];
}

function hedgeComparisonFacts(_a: A, v: V, c: FactCtx): string[] {
  const s = c.scenario;
  const pts = v.points as { spot: number; unhedged: number; forward: number; option: number; moneyMarket: number }[];
  const out: string[] = [];
  if (!pts.length) return out;
  const first = pts[0];
  const last = pts[pts.length - 1];
  const lo = first.spot <= last.spot ? first : last;
  const hi = first.spot <= last.spot ? last : first;
  out.push(
    `Unhedged: your ${noun(c)} moves with spot. ${isImp(c) ? `It is ${M(lo.unhedged)} at spot ${R(lo.spot)} and ${M(hi.unhedged)} at spot ${R(hi.spot)}: the higher the rate, the more ringgit you pay.` : `It is ${M(lo.unhedged)} at spot ${R(lo.spot)} and ${M(hi.unhedged)} at spot ${R(hi.spot)}: the higher the rate, the more ringgit you receive.`}`,
  );
  out.push(`Forward: your ${noun(c)} is flat at ${M(first.forward)} whatever spot does.`);
  if (s) {
    const K = s.a.optionStrike;
    const p = s.a.optionPremium;
    out.push(
      isImp(c)
        ? `Call option: your cost is capped at ${M((K + p) * s.deal.usdAmount)} (strike plus premium) however high spot goes; if spot ends below the strike your cost falls with spot, plus the premium.`
        : `Put option: your income is floored at ${M((K - p) * s.deal.usdAmount)} (strike minus premium) however low spot goes; if spot ends above the strike your income rises with spot, less the premium.`,
    );
  }
  out.push(`Money-market hedge: your ${noun(c)} is flat at ${M(first.moneyMarket)} whatever spot does.`);
  if (s) {
    const F = s.a.quotedForward ?? scenarioForward(s);
    if (F !== undefined) {
      out.push(...breakEvenFacts({ mode: s.deal.mode }, E.breakEvens({ forward: F, strike: s.a.optionStrike, premium: s.a.optionPremium, mode: s.deal.mode }).value, c));
    }
  }
  return out;
}

const OUT_MEANING: Record<string, string> = {
  forward: 'the interest-rate forward',
  pppExpected: 'the PPP expected rate',
  realMY: 'the Malaysian real rate',
  realUS: 'the US real rate',
  myrAtForward: 'the ringgit amount at the forward',
  myrAtPPP: 'the ringgit amount at the PPP expected rate',
  gapMYR: 'the gap between the PPP amount and the forward amount',
};

function compareFacts(_a: A, v: V, c: FactCtx): string[] {
  const out: string[] = [];
  const changed = v.changedInputs as { key: string; from: unknown; to: unknown }[];
  if (changed.length) {
    out.push(
      `Changed from scenario A to scenario B: ${changed
        .map((x) => {
          const f = typeof x.from === 'number' && ['iMY', 'iUS', 'piMY', 'piUS', 'spread'].includes(x.key) ? PI(x.from) : String(x.from);
          const t = typeof x.to === 'number' && ['iMY', 'iUS', 'piMY', 'piUS', 'spread'].includes(x.key) ? PI(x.to as number) : String(x.to);
          return `${x.key} from ${f} to ${t}`;
        })
        .join('; ')}.`,
    );
  } else {
    out.push('The two scenarios use the same inputs.');
  }
  const outs = v.outputs as { key: string; label: string; a: number; b: number; delta: number }[];
  for (const o of outs) {
    const what = OUT_MEANING[o.key] ?? o.label;
    if (Math.abs(o.delta) < 1e-9) {
      out.push(`In B ${what} is unchanged.`);
      continue;
    }
    const isRate = o.key === 'forward' || o.key === 'pppExpected';
    const isReal = o.key.startsWith('real');
    const isMyr = o.key.startsWith('myr');
    const fmt = (x: number): string => (isReal ? P(x, 3) : isMyr || o.key === 'gapMYR' ? M(x) : R(x));
    let line = `${what[0].toUpperCase()}${what.slice(1)} ${risesFalls(o.delta)} from ${fmt(o.a)} in A to ${fmt(o.b)} in B.`;
    if (isRate) line += ` That is a ${weakStrong(o.a, o.b)} ringgit.`;
    if (isMyr) line += ` For you: ${amountDelta(c, o.delta)}.`;
    out.push(line);
  }
  return out;
}

function sensitivityFacts(a: A, v: V, c: FactCtx): string[] {
  const input = String(a.input);
  const pts = v.points as { x: number; forwardMYR: number; pppMYR: number }[];
  if (pts.length < 2) return [];
  const first = pts[0];
  const last = pts[pts.length - 1];
  const label = INPUT_LABEL[input] ?? input;
  const dirIn = last.x > first.x ? 'Raising' : 'Lowering';
  const out: string[] = [];
  const line = (name: string, f: number, l: number): string =>
    Math.abs(l - f) < EPS
      ? `${dirIn} the ${label} from ${fmtInput(input, first.x)} to ${fmtInput(input, last.x)} leaves the ${noun(c)} at ${name} unchanged at ${M(f)}.`
      : `${dirIn} the ${label} from ${fmtInput(input, first.x)} to ${fmtInput(input, last.x)} ${l > f ? 'RAISES' : 'LOWERS'} the ${noun(c)} at ${name} by ${M(l - f)}, from ${M(f)} to ${M(l)} (${goodBad(c, l - f)}).`;
  out.push(line('the forward', first.forwardMYR, last.forwardMYR));
  out.push(line('the PPP expected rate', first.pppMYR, last.pppMYR));
  return out;
}

function tornadoFacts(_a: A, v: V, c: FactCtx): string[] {
  const bars = v.bars as { input: string; bump: number; forwardDelta: number; pppDelta: number }[];
  const out: string[] = [];
  const effect = (name: string, d: number): string =>
    Math.abs(d) < EPS ? `leaves the ${noun(c)} at ${name} unchanged` : `${d > 0 ? 'RAISES' : 'LOWERS'} the ${noun(c)} at ${name} by ${M(d)} (${goodBad(c, d)})`;
  if (bars[0]) out.push(`The input with the biggest effect on your ringgit amount is the ${INPUT_LABEL[bars[0].input] ?? bars[0].input}.`);
  for (const b of bars) {
    const bump = b.input === 'spot' ? `0.10 MYR per USD` : `1 percentage point`;
    out.push(`A ${bump} higher ${INPUT_LABEL[b.input] ?? b.input} ${effect('the forward', b.forwardDelta)} and ${effect('the PPP expected rate', b.pppDelta)}.`);
  }
  return out;
}

// ---------- entry point ----------

type Gen = (a: A, v: V, c: FactCtx) => string[];
const GENERATORS: Record<string, Gen> = {
  periodRate: periodRateFacts,
  irpForward: irpFacts,
  pppExpected: pppFacts,
  fisherReal: fisherRealFacts,
  fisherNominal: fisherNominalFacts,
  ifeExpected: ifeFacts,
  parityCheck: parityFacts,
  ciaCheck: ciaFacts,
  ciaCompare: ciaCompareFacts,
  importBudget: importBudgetFacts,
  withSpread: withSpreadFacts,
  forecastViews: forecastFacts,
  forwardHedge: forwardHedgeFacts,
  optionHedge: optionHedgeFacts,
  optionPayoffs: optionPayoffFacts,
  moneyMarketHedge: moneyMarketFacts,
  hedgeComparison: hedgeComparisonFacts,
  breakEvens: breakEvenFacts,
  compareScenarios: compareFacts,
  sensitivity: sensitivityFacts,
  tornado: tornadoFacts,
};

/**
 * Deterministic direction sentences for one engine result.
 * `args` = the arguments the engine function was called with (tool args, or the offline template's inputs).
 * `result` = the engine `Result<T>` ({ value, workings }). Never throws; returns [] if it cannot build facts.
 */
export function factsFor(name: string, args: unknown, result: unknown, ctx: FactCtx): string[] {
  try {
    const gen = GENERATORS[name];
    const value = (result as { value?: unknown } | null)?.value;
    if (!gen || value === undefined) return [];
    return gen((args ?? {}) as A, value, ctx);
  } catch {
    return [];
  }
}

/** Direction-rule sentences for a mode (also used as the cheat-sheet in the system prompt). */
export function directionRules(mode: Mode): string[] {
  return mode === 'importer'
    ? [
        'Importer: a HIGHER MYR-per-USD rate = weaker ringgit = you pay MORE ringgit (worse).',
        'Importer: a LOWER rate = stronger ringgit = you pay FEWER ringgit (better).',
        'Importer forward (rate F): spot ends ABOVE F = forward cheaper than unhedged; spot ends BELOW F = forward dearer (it gives up the gain from a stronger ringgit). Call option (strike K, premium p): beats paying spot only when spot is ABOVE K+p; beats the forward only when spot is BELOW F-p.',
        'Importer: higher Malaysian inflation pushes the PPP expected rate UP (weaker ringgit, higher cost); the interest-rate forward depends only on interest rates, not inflation.',
      ]
    : [
        'Exporter: a HIGHER MYR-per-USD rate = weaker ringgit = you receive MORE ringgit (better).',
        'Exporter: a LOWER rate = stronger ringgit = you receive FEWER ringgit (worse).',
        'Exporter forward (rate F): spot ends BELOW F = forward gives more than selling at spot; spot ends ABOVE F = forward gives less (it gives up the extra from a weaker ringgit). Put option (strike K, premium p): beats selling at spot only when spot is BELOW K-p; beats the forward only when spot is ABOVE F+p.',
        'Exporter: higher Malaysian inflation pushes the PPP expected rate UP (weaker ringgit, more ringgit income); the interest-rate forward depends only on interest rates, not inflation.',
      ];
}
