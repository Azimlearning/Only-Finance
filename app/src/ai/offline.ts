// Offline (no key / no network) deterministic template explanations.
// Every figure comes from the engine; the caller runs the result through the number guard.

import * as E from '../engine';
import type { Scenario } from '../engine';
import { factsFor } from './facts';
import { collectNumbers } from './guard';
import type { Tone } from './prompts';

export const OFFLINE_LABEL = 'Offline explanation (template)';

export interface OfflineOutput {
  text: string;
  /** Engine-known numbers behind the text (engine results + scenario inputs). */
  known: number[];
}

// ---------- formatting (decimals chosen so the guard can verify them) ----------

const MINUS = '−';
const signOf = (shown: string, x: number): string => (x < 0 && Number(shown.replace(/,/g, '')) !== 0 ? MINUS : '');

const rate = (x: number): string => `${signOf(Math.abs(x).toFixed(4), x)}${Math.abs(x).toFixed(4)}`;
const pct = (x: number, dp = 2): string => {
  const s = Math.abs(x * 100).toFixed(dp);
  return `${signOf(s, x)}${s}%`;
};
/** Input-style percentage without trailing zeros (3%, 4.5%). */
const pctIn = (x: number): string => `${+(x * 100).toFixed(3)}%`;
const myr = (x: number): string => {
  const s = Math.round(Math.abs(x)).toLocaleString('en-US');
  return `${signOf(s, x)}RM${s}`;
};
const usd = (x: number): string => `USD ${Math.round(x).toLocaleString('en-US')}`;

// ---------- helpers ----------

function scenarioNumbers(s: Scenario): number[] {
  return collectNumbers([s.deal, s.a]);
}

function withOverride(s: Scenario, key: 'piMY' | 'piUS' | 'iMY' | 'iUS', value: number): Scenario {
  return { ...s, a: { ...s.a, [key]: value } };
}

/** "What if inflation rises to 4%?" -> pick up the percentage and which rate it refers to. */
function whatIf(question: string, kind: 'inflation' | 'interest'): { key: 'piMY' | 'piUS' | 'iMY' | 'iUS'; value: number } | null {
  const m = /(\d+(?:\.\d+)?)\s*(?:%|per\s?cent|percent)/i.exec(question);
  if (!m) return null;
  const value = Number(m[1]) / 100;
  const us = /\b(us|u\.s\.|american|fed)\b/i.test(question);
  if (kind === 'inflation') return { key: us ? 'piUS' : 'piMY', value };
  return { key: us ? 'iUS' : 'iMY', value };
}

const isImporter = (s: Scenario): boolean => s.deal.mode === 'importer';
const noun = (s: Scenario): string => (isImporter(s) ? 'cost' : 'income');

function gloss(tone: Tone, text: string): string {
  return tone === 'sme' ? `\nIn plain words: ${text}` : '';
}

function wrap(body: string[], tone: Tone, glossText: string): string {
  return [OFFLINE_LABEL, '', ...body].join('\n') + gloss(tone, glossText);
}

const ctx = (s: Scenario): { mode: Scenario['deal']['mode']; scenario: Scenario } => ({ mode: s.deal.mode, scenario: s });
const bullets = (facts: string[]): string[] => facts.map((f) => `- ${f}`);

const DISCLAIMER = 'All rates are illustrative, not market data, and this is not financial advice.';

// ---------- templates ----------

function tplPPP(s: Scenario, tone: Tone, question: string): OfflineOutput {
  const wi = whatIf(question, 'inflation');
  const s2 = wi ? withOverride(s, wi.key, wi.value) : s;
  const { spot, usdAmount } = s2.deal;
  const ppp = E.pppExpected({ spot, piMY: s2.a.piMY, piUS: s2.a.piUS });
  const bud = E.importBudget({ usd: usdAmount, rateOld: spot, rateNew: ppp.value.expected });
  const whatIfLine = wi ? `What-if: ${wi.key === 'piUS' ? 'US' : 'Malaysian'} inflation set to ${pctIn(wi.value)}. ` : '';
  const facts = [
    ...factsFor('pppExpected', { spot, piMY: s2.a.piMY, piUS: s2.a.piUS }, ppp, ctx(s2)),
    ...factsFor('importBudget', { usd: usdAmount, rateOld: spot, rateNew: ppp.value.expected }, bud, ctx(s2)),
  ];
  const body = [
    `${whatIfLine}Direction: prices rise ${pctIn(s2.a.piMY)} a year in Malaysia against ${pctIn(s2.a.piUS)} in the US; for your ${usd(usdAmount)} deal the PPP rate moves from ${rate(spot)} to ${rate(ppp.value.expected)} MYR per 1 USD (${pct(ppp.value.change)}).`,
    ...bullets(facts),
    'Assumption: a one-year horizon with the inflation rates and spot rate in your scenario; PPP is the exact formula spot x (1 + MY inflation) / (1 + US inflation).',
    `Limitation: PPP is a long-run tendency, not a forecast for one invoice; exchange rates can stay away from PPP for years. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'if prices at home rise faster than abroad, the ringgit tends to buy less dollar over time.'),
    known: [...collectNumbers([ppp, bud]), ...scenarioNumbers(s2), ...(wi ? [wi.value] : [])],
  };
}

function tplIRP(s: Scenario, tone: Tone, question: string): OfflineOutput {
  const wi = whatIf(question, 'interest');
  const s2 = wi ? withOverride(s, wi.key, wi.value) : s;
  const { spot, usdAmount, days, basis } = s2.deal;
  const irp = E.irpForward({ spot, iMY: s2.a.iMY, iUS: s2.a.iUS, days, basis });
  const bud = E.importBudget({ usd: usdAmount, rateOld: spot, rateNew: irp.value.forward });
  const facts = [
    ...factsFor('irpForward', { spot, iMY: s2.a.iMY, iUS: s2.a.iUS, days, basis }, irp, ctx(s2)),
    ...factsFor('importBudget', { usd: usdAmount, rateOld: spot, rateNew: irp.value.forward }, bud, ctx(s2)),
  ];
  const body = [
    `${wi ? `What-if: ${wi.key.endsWith('US') ? 'US' : 'Malaysian'} interest set to ${pctIn(wi.value)}. ` : ''}Direction: interest rate parity (IRP) puts the forward at ${rate(irp.value.forward)} versus spot ${rate(spot)} MYR per 1 USD (${pct(irp.value.premium)}).`,
    ...bullets(facts),
    `Limitation: IRP ignores bank spreads and capital controls, and the forward is a price fixed today, not what spot will actually be. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'a forward contract is a dollar price the bank fixes today for a future date; it reflects the interest-rate gap, not a guess about the market.'),
    known: [...collectNumbers([irp, bud]), ...scenarioNumbers(s2), ...(wi ? [wi.value] : [])],
  };
}

function tplHedge(s: Scenario, tone: Tone): OfflineOutput {
  const { spot, usdAmount, days, basis, mode } = s.deal;
  const irp = E.irpForward({ spot, iMY: s.a.iMY, iUS: s.a.iUS, days, basis });
  const fwd = s.a.quotedForward ?? irp.value.forward;
  const be = E.breakEvens({ forward: fwd, strike: s.a.optionStrike, premium: s.a.optionPremium, mode });
  const fh = E.forwardHedge({ usd: usdAmount, forward: fwd, spotAtMaturity: s.a.stressSpot });
  const imp = isImporter(s);
  const oArgs = {
    usd: usdAmount,
    strike: s.a.optionStrike,
    premium: s.a.optionPremium,
    spotAtMaturity: s.a.stressSpot,
    type: imp ? 'call' : 'put',
  } as const;
  const oh = E.optionHedge(oArgs);
  const facts = [
    ...factsFor('breakEvens', { forward: fwd, strike: s.a.optionStrike, premium: s.a.optionPremium, mode }, be, ctx(s)),
    ...factsFor('forwardHedge', { usd: usdAmount, forward: fwd, spotAtMaturity: s.a.stressSpot }, fh, ctx(s)),
    ...factsFor('optionHedge', oArgs, oh, ctx(s)),
  ];
  const body = [
    `Direction: a forward fixes your rate at ${rate(fwd)} MYR per 1 USD with no upfront fee. ${imp ? 'A call' : 'A put'} option (strike ${rate(s.a.optionStrike)}, premium ${rate(s.a.optionPremium)} per USD, total ${myr(oh.value.totalPremium)}) protects you in the bad direction and lets you keep the good one.`,
    ...bullets(facts),
    `Stress case, spot ends at ${rate(s.a.stressSpot)}: unhedged ${myr(fh.value.unhedged)}, forward ${myr(fh.value.hedged)}, option ${myr(oh.value.effectiveMYR)} (premium included).`,
    `Limitation: this compares outcomes at one assumed future spot; real bank quotes add spreads and fees, and the best choice depends on what you believe about the rate. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'a forward is a locked price with no way out; an option is insurance you pay for up front but can walk away from.'),
    known: [...collectNumbers([irp, be, fh, oh]), ...scenarioNumbers(s), fwd],
  };
}

function tplFisher(s: Scenario, tone: Tone): OfflineOutput {
  const my = E.fisherReal({ i: s.a.iMY, pi: s.a.piMY });
  const us = E.fisherReal({ i: s.a.iUS, pi: s.a.piUS });
  const facts = factsFor('fisherReal', { i: s.a.iMY, pi: s.a.piMY }, my, ctx(s));
  const body = [
    `Direction: the real rate is the interest rate after inflation. Malaysia: nominal ${pctIn(s.a.iMY)}, inflation ${pctIn(s.a.piMY)}, real ${pct(my.value.real, 3)} (rough rule ${pct(my.value.approx, 3)}). US: nominal ${pctIn(s.a.iUS)}, inflation ${pctIn(s.a.piUS)}, real ${pct(us.value.real, 3)} (rough rule ${pct(us.value.approx, 3)}).`,
    ...bullets(facts),
    'Assumption: the Fisher equation (1 + nominal) = (1 + real) x (1 + inflation), using the inflation rates in your scenario as expected inflation.',
    `Limitation: real rates use expected inflation, which nobody observes directly, and currencies also move on risk and trade flows. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'the real rate is what your money really earns once rising prices are taken off.'),
    known: [...collectNumbers([my, us]), ...scenarioNumbers(s)],
  };
}

function tplArbitrage(s: Scenario, tone: Tone): OfflineOutput {
  const { spot, usdAmount, days, basis } = s.deal;
  const irp = E.irpForward({ spot, iMY: s.a.iMY, iUS: s.a.iUS, days, basis });
  const quoted = s.a.quotedForward ?? irp.value.forward;
  const args = { spot, quotedForward: quoted, iMY: s.a.iMY, iUS: s.a.iUS, spread: s.a.spread, notional: usdAmount };
  const cia = E.ciaCheck(args);
  const body = [
    'Direction: covered interest arbitrage compares the quoted forward with the interest-rate-parity forward.',
    ...bullets(factsFor('ciaCheck', args, cia, ctx(s))),
    `Assumption: you can borrow and lend at the scenario rates (${pctIn(s.a.iMY)} MY, ${pctIn(s.a.iUS)} US) and pay a spread of ${pct(s.a.spread)}.`,
    `Limitation: real markets close these gaps quickly and add borrowing limits and fees, so such gaps rarely last. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'arbitrage means a risk-free profit from a price mismatch; in practice banks quote forwards so it does not exist.'),
    known: [...collectNumbers([irp, cia]), ...scenarioNumbers(s), quoted],
  };
}

function tplForecast(s: Scenario, tone: Tone): OfflineOutput {
  const fv = E.forecastViews(s);
  const body = [
    `Direction: the same ${usd(s.deal.usdAmount)} deal gives a different ringgit amount under each view of the future rate.`,
    ...bullets(factsFor('forecastViews', {}, fv, ctx(s))),
    `Limitation: each view rests on different assumptions (interest gap, inflation gap, a stress case, your own forecast), and none is a prediction. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'a budget needs one rate; this shows how much your ringgit figure changes depending on which rate you pick.'),
    known: [...collectNumbers(fv), ...scenarioNumbers(s)],
  };
}

function tplTornado(s: Scenario, tone: Tone): OfflineOutput {
  const t = E.tornado(s);
  const body = [
    'Direction: each input is nudged on its own (rates by one percentage point, spot by 0.10) to see how your ringgit amount moves.',
    ...bullets(factsFor('tornado', {}, t, ctx(s))),
    `Limitation: each input is bumped on its own by a fixed amount; in reality rates and inflation move together. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'this ranks which assumption matters most to your bottom line, so you know what to watch.'),
    known: [...collectNumbers(t), ...scenarioNumbers(s)],
  };
}

function tplParity(s: Scenario, tone: Tone): OfflineOutput {
  const { spot, usdAmount } = s.deal;
  const args = { spot, iMY: s.a.iMY, iUS: s.a.iUS, piMY: s.a.piMY, piUS: s.a.piUS, usdAmount };
  const pc = E.parityCheck(args);
  const v = pc.value;
  const body = [
    `Direction: starting from spot ${rate(spot)} MYR per 1 USD over one year, the forward comes from the interest gap (${pctIn(s.a.iMY)} MY vs ${pctIn(s.a.iUS)} US) and PPP from the inflation gap (${pctIn(s.a.piMY)} vs ${pctIn(s.a.piUS)}).`,
    ...bullets(factsFor('parityCheck', args, pc, ctx(s))),
    `Real rates are ${pct(v.realMY, 3)} in Malaysia and ${pct(v.realUS, 3)} in the US.`,
    `Limitation: PPP and IRP are simplified models and neither forecasts the actual rate at maturity. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'the bank forward reflects interest rates, while the inflation view reflects price levels; comparing them shows whether locking in looks cheap or dear.'),
    known: [...collectNumbers(pc), ...scenarioNumbers(s)],
  };
}

// ---------- extra templates for the UI's explain topics ----------

function tplSpread(s: Scenario, tone: Tone): OfflineOutput {
  const importer = isImporter(s);
  const args = { rate: s.deal.spot, spread: s.a.spread, side: importer ? 'buyUSD' : 'sellUSD', usd: s.deal.usdAmount } as const;
  const sp = E.withSpread(args);
  const body = [
    `Direction: the bank does not deal at the mid rate ${rate(s.deal.spot)}; it applies a spread of ${pct(s.a.spread)}.`,
    ...bullets(factsFor('withSpread', args, sp, ctx(s))),
    `On ${usd(s.deal.usdAmount)} this comes on top of any forward premium or discount.`,
    `Limitation: real spreads differ by bank, size and tenor, and can be negotiated. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, "the spread is the bank's margin: it sells dollars a bit dearer and buys them a bit cheaper than the middle price."),
    known: [...collectNumbers(sp), ...scenarioNumbers(s)],
  };
}

function tplIFE(s: Scenario, tone: Tone): OfflineOutput {
  const { spot, days, basis } = s.deal;
  const args = { spot, iMY: s.a.iMY, iUS: s.a.iUS, days, basis };
  const r = E.ifeExpected(args);
  const body = [
    `Direction: with ${pctIn(s.a.iMY)} interest in Malaysia and ${pctIn(s.a.iUS)} in the US, the International Fisher Effect gives an expected rate of ${rate(r.value.expected)} MYR per 1 USD against spot ${rate(spot)}.`,
    ...bullets(factsFor('ifeExpected', args, r, ctx(s))),
    'Assumption: the interest gap fully reflects expected inflation gaps (real rates equal in both countries).',
    `Limitation: this is an expectation, not a forecast; in practice high-interest currencies often do not fall as the theory says. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'if one country pays more interest, the theory says its currency drifts weaker so that nobody gains for free.'),
    known: [...collectNumbers(r), ...scenarioNumbers(s)],
  };
}

function tplPayoffs(s: Scenario, tone: Tone): OfflineOutput {
  const args = { strike: s.a.optionStrike, spot: s.a.stressSpot, premium: s.a.optionPremium };
  const p = E.optionPayoffs(args);
  const body = [
    `Direction: at a spot of ${rate(s.a.stressSpot)} and a strike of ${rate(s.a.optionStrike)} MYR per 1 USD, with a premium of ${rate(s.a.optionPremium)} per USD.`,
    ...bullets(factsFor('optionPayoffs', args, p, ctx(s))),
    'The most you can lose is the premium.',
    `Limitation: this is the payoff at expiry only, ignoring the time value of money. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'an option gives you the right, not the duty, to deal at the strike price; the premium is its price.'),
    known: [...collectNumbers(p), ...scenarioNumbers(s)],
  };
}

function forwardOf(s: Scenario): { fwd: number; irp: ReturnType<typeof E.irpForward> } {
  const irp = E.irpForward({ spot: s.deal.spot, iMY: s.a.iMY, iUS: s.a.iUS, days: s.deal.days, basis: s.deal.basis });
  return { fwd: s.a.quotedForward ?? irp.value.forward, irp };
}

function tplForwardHedge(s: Scenario, tone: Tone): OfflineOutput {
  const { fwd, irp } = forwardOf(s);
  const args = { usd: s.deal.usdAmount, forward: fwd, spotAtMaturity: s.a.stressSpot };
  const h = E.forwardHedge(args);
  const body = [
    `Direction: locking the forward at ${rate(fwd)} MYR per 1 USD fixes your ringgit ${noun(s)} at ${myr(h.value.hedged)} (effective rate ${rate(h.value.effectiveRate)}).`,
    ...bullets(factsFor('forwardHedge', args, h, ctx(s))),
    `Limitation: the comparison uses one assumed future spot; the real outcome depends on where spot actually ends, and bank forwards include a spread. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'a forward is a locked price: you know your ringgit figure today, whatever the market does.'),
    known: [...collectNumbers([h, irp]), ...scenarioNumbers(s), fwd],
  };
}

function tplOptionHedge(s: Scenario, tone: Tone): OfflineOutput {
  const imp = isImporter(s);
  const args = {
    usd: s.deal.usdAmount,
    strike: s.a.optionStrike,
    premium: s.a.optionPremium,
    spotAtMaturity: s.a.stressSpot,
    type: imp ? 'call' : 'put',
  } as const;
  const o = E.optionHedge(args);
  const v = o.value;
  const body = [
    `Direction: with a ${imp ? 'call' : 'put'} struck at ${rate(s.a.optionStrike)} and a premium of ${rate(s.a.optionPremium)} per USD (total ${myr(v.totalPremium)}), your effective ${noun(s)} at a spot of ${rate(s.a.stressSpot)} is ${myr(v.effectiveMYR)} against ${myr(v.unhedgedMYR)} unhedged.`,
    ...bullets(factsFor('optionHedge', args, o, ctx(s))),
    `Limitation: the premium is a sunk cost, and this shows one assumed future spot only. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'an option is insurance: you pay a fee up front for a worst-case rate, and can ignore it if the market is kinder.'),
    known: [...collectNumbers(o), ...scenarioNumbers(s)],
  };
}

function tplMoneyMarket(s: Scenario, tone: Tone): OfflineOutput {
  const args = {
    usd: s.deal.usdAmount,
    spot: s.deal.spot,
    iMY: s.a.iMY,
    iUS: s.a.iUS,
    days: s.deal.days,
    basis: s.deal.basis,
    mode: s.deal.mode,
  };
  const m = E.moneyMarketHedge(args);
  const v = m.value;
  const imp = isImporter(s);
  const body = [
    `Direction: instead of a forward, you build the hedge yourself with a loan and a deposit today. ${imp ? `Deposit ${usd(v.usdLeg)} in dollars (it grows to the amount you owe), funded by borrowing ${myr(v.myrLeg)}` : `Borrow ${usd(v.usdLeg)} in dollars (your future receipt repays it), convert it and deposit ${myr(v.myrLeg)}`}.`,
    ...bullets(factsFor('moneyMarketHedge', args, m, ctx(s))),
    `Limitation: it needs access to dollar and ringgit credit at the scenario rates, and real borrowing costs are higher. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'you lock the rate by borrowing and depositing in the two currencies, rather than buying a contract from the bank.'),
    known: [...collectNumbers(m), ...scenarioNumbers(s)],
  };
}


interface CompareData {
  changedInputs: { key: string; from: unknown; to: unknown }[];
  outputs: { key: string; label: string; a: number; b: number; delta: number }[];
}
function isCompare(d: unknown): d is CompareData {
  return !!d && typeof d === 'object' && Array.isArray((d as CompareData).changedInputs) && Array.isArray((d as CompareData).outputs);
}

function tplCompare(s: Scenario, data: unknown, tone: Tone): OfflineOutput {
  if (!isCompare(data)) return tplParity(s, tone);
  const body = [
    'Direction: scenario A against scenario B.',
    ...bullets(factsFor('compareScenarios', {}, { value: data, workings: [] }, ctx(s))),
    `Limitation: only the listed inputs differ, and results come from simplified parity models with illustrative rates. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'this puts two what-if worlds side by side so you can see which assumption drives the difference.'),
    known: [...collectNumbers(data), ...scenarioNumbers(s)],
  };
}

interface SensData {
  input?: string;
  points: { x: number; forwardMYR: number; pppMYR: number }[];
}
function isSens(d: unknown): d is SensData {
  return !!d && typeof d === 'object' && Array.isArray((d as SensData).points) && (d as SensData).points.length > 1;
}

function tplSensitivity(s: Scenario, data: unknown, tone: Tone): OfflineOutput {
  if (!isSens(data)) return tplTornado(s, tone);
  const body = [
    'Direction: how your ringgit amount changes as one input moves.',
    ...bullets(factsFor('sensitivity', { input: data.input }, { value: data, workings: [] }, ctx(s))),
    `Limitation: only one input moves at a time with the rest held at your scenario; in reality rates and inflation move together. ${DISCLAIMER}`,
  ];
  return {
    text: wrap(body, tone, 'this shows how much your ringgit figure moves when you change just one assumption.'),
    known: [...collectNumbers(data), ...scenarioNumbers(s)],
  };
}

// ---------- routing ----------

type Route =
  | 'arbitrage' | 'hedge' | 'fisher' | 'ppp' | 'irp' | 'forecast' | 'tornado' | 'parity'
  | 'spread' | 'ife' | 'compare' | 'sensitivity' | 'payoffs' | 'forwardHedge' | 'optionHedge' | 'moneyMarket';

/** Exact topic keys used by the UI's Explain buttons. */
const TOPIC_ROUTES: Record<string, Route> = {
  forecast_views: 'forecast',
  spread_effect: 'spread',
  irp_forward: 'irp',
  ppp_expected: 'ppp',
  real_rates: 'fisher',
  ife_expected: 'ife',
  parity_identity: 'parity',
  scenario_compare: 'compare',
  sensitivity: 'sensitivity',
  tornado: 'tornado',
  hedge_payoff: 'payoffs',
  forward_hedge: 'forwardHedge',
  option_hedge: 'optionHedge',
  money_market_hedge: 'moneyMarket',
  arbitrage_cia: 'arbitrage',
};

function route(text: string): Route {
  const exact = TOPIC_ROUTES[text.trim()];
  if (exact) return exact;
  const t = text.toLowerCase().replace(/_/g, ' ');
  if (/arbitrage|\bcia\b/.test(t)) return 'arbitrage';
  if (/hedg|option|payoff|break-?even/.test(t)) return 'hedge';
  if (/fisher|real (interest )?rate|\breal\b/.test(t)) return 'fisher';
  if (/inflation|\bppp\b|purchasing/.test(t)) return 'ppp';
  if (/tornado|sensitiv/.test(t)) return 'tornado';
  if (/forecast|budget|view/.test(t)) return 'forecast';
  if (/interest|forward|\birp\b|parity|cheaper/.test(t)) return 'irp';
  return 'parity';
}

function render(r: Route, s: Scenario, tone: Tone, question: string, data?: unknown): OfflineOutput {
  switch (r) {
    case 'arbitrage':
      return tplArbitrage(s, tone);
    case 'hedge':
      return tplHedge(s, tone);
    case 'fisher':
      return tplFisher(s, tone);
    case 'ppp':
      return tplPPP(s, tone, question);
    case 'irp':
      return tplIRP(s, tone, question);
    case 'forecast':
      return tplForecast(s, tone);
    case 'tornado':
      return tplTornado(s, tone);
    case 'parity':
      return tplParity(s, tone);
    case 'spread':
      return tplSpread(s, tone);
    case 'ife':
      return tplIFE(s, tone);
    case 'compare':
      return tplCompare(s, data, tone);
    case 'sensitivity':
      return tplSensitivity(s, data, tone);
    case 'payoffs':
      return tplPayoffs(s, tone);
    case 'forwardHedge':
      return tplForwardHedge(s, tone);
    case 'optionHedge':
      return tplOptionHedge(s, tone);
    case 'moneyMarket':
      return tplMoneyMarket(s, tone);
  }
}

function safe(fn: () => OfflineOutput, s: Scenario): OfflineOutput {
  try {
    return fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      text: `${OFFLINE_LABEL}\n\nSorry, the offline explanation could not be built (${msg}). ${DISCLAIMER}`,
      known: scenarioNumbers(s),
    };
  }
}

/** Answer a free-form question with a deterministic template built from engine results. */
export function offlineAnswer(question: string, scenario: Scenario, tone: Tone): OfflineOutput {
  return safe(() => render(route(question), scenario, tone, question), scenario);
}

/** Explain a result card (topic key + the card's data) with a template; unknown keys fall back to keyword routing, then a parity summary. */
export function offlineExplain(topic: string, data: unknown, scenario: Scenario, tone: Tone): OfflineOutput {
  const out = safe(() => render(route(topic), scenario, tone, '', data), scenario);
  return { text: out.text, known: [...out.known, ...collectNumbers(data)] };
}

/** Number formatters shared with the practice feedback templates. */
export const fmt = { rate, pct, pctIn, myr, usd };
