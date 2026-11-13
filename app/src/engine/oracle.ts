// Oracle: one case per expected number in the reference table (lecturer workbook W5/W6,
// Week 10 slides, Baseline family, parity identity, hedging and tenor cases).
// Each case recomputes its value live from the engine; the Verify tab and verify.test.ts read this list.
import type { Scenario, SensInput } from './types';
import { getPreset } from './presets';
import { irpForward, parityCheck, pppExpected, fisherNominal, fisherReal } from './parity';
import { ciaCheck, ciaCompare } from './arbitrage';
import { forecastViews, importBudget, withSpread } from './budget';
import { breakEvens, forwardHedge, moneyMarketHedge, optionHedge, optionPayoffs } from './hedging';
import { tornado } from './scenarios';

export interface OracleCase {
  id: string;
  source: string;
  description: string;
  actual: () => number;
  expected: number;
  tolerance: number;
  unit: 'rate' | 'MYR' | 'USD' | 'pct' | 'ratio';
}

type Unit = OracleCase['unit'];

function c(
  id: string,
  source: string,
  description: string,
  actual: () => number,
  expected: number,
  tolerance: number,
  unit: Unit,
): OracleCase {
  return { id, source, description, actual, expected, tolerance, unit };
}

// ---- scenario helpers ----
const baseline = (): Scenario => getPreset('baseline');
const shock = (): Scenario => getPreset('inflationShock');
const gap = (): Scenario => getPreset('rateGap');
const wk10 = (): Scenario => getPreset('week10');
const lect = (): Scenario => getPreset('lecturer');

const irpOf = (s: Scenario) =>
  irpForward({ spot: s.deal.spot, iMY: s.a.iMY, iUS: s.a.iUS, days: s.deal.days, basis: s.deal.basis }).value;
const pppOf = (s: Scenario) =>
  pppExpected({ spot: s.deal.spot, piMY: s.a.piMY, piUS: s.a.piUS, years: s.deal.days / s.deal.basis }).value;
const parityOf = (s: Scenario) =>
  parityCheck({
    spot: s.deal.spot, iMY: s.a.iMY, iUS: s.a.iUS, piMY: s.a.piMY, piUS: s.a.piUS, usdAmount: s.deal.usdAmount,
  }).value;
const rowMYR = (s: Scenario, key: string) => {
  const row = forecastViews(s).value.rows.find((r) => r.key === key);
  if (!row) throw new Error(`forecastViews has no row ${key}`);
  return row.myr;
};
const bar = (s: Scenario, input: SensInput) => {
  const b = tornado(s).value.bars.find((x) => x.input === input);
  if (!b) throw new Error(`tornado has no bar ${input}`);
  return b;
};
const w5Cia = () =>
  ciaCompare({ amount: 1_000_000, homeRate: 0.05, foreignRate: 0.08, spot: 1.8, forward: 1.78 }).value;
const w5Ppp = () => pppExpected({ spot: 4.2, piMY: 0.03, piUS: 0.01 }).value;
const w5Fisher = () => fisherNominal({ real: 0.02, pi: 0.03 }).value;
const w6Budget = () => importBudget({ usd: 100000, rateOld: 4.2, rateNew: 4.4 }).value;
const w6Fwd = () => forwardHedge({ usd: 100000, forward: 4.25, spotAtMaturity: 4.5 }).value;
const w6Call = () =>
  optionHedge({ usd: 100000, strike: 4.25, premium: 0.05, spotAtMaturity: 4.4, type: 'call' }).value;
const w6Payoffs = () => optionPayoffs({ strike: 4.25, spot: 4.4, premium: 0.05 }).value;
const w10Hedge = () => forwardHedge({ usd: 200000, forward: 4.55, spotAtMaturity: 4.7 }).value;
const cia = (spread: number) => () => {
  const b = baseline();
  return ciaCheck({ spot: b.deal.spot, quotedForward: 4.4, iMY: b.a.iMY, iUS: b.a.iUS, spread }).value.profitPerUnit;
};
const mm = () => {
  const b = baseline();
  return moneyMarketHedge({
    usd: b.deal.usdAmount, spot: b.deal.spot, iMY: b.a.iMY, iUS: b.a.iUS, days: 365, basis: 365, mode: 'importer',
  }).value;
};
const tenorForward = (basis: 365 | 360) => () => {
  const b = baseline();
  return irpForward({ spot: b.deal.spot, iMY: b.a.iMY, iUS: b.a.iUS, days: 90, basis }).value.forward;
};
const be = () => breakEvens({ forward: 4.25, strike: 4.25, premium: 0.05, mode: 'importer' }).value;

const W5 = 'Workbook W5';
const W6 = 'Workbook W6';

export const ORACLE: OracleCase[] = [
  // ---- Workbook W5 IRP (S 4.20, i 3% / 5%) ----
  c('w5-irp-forward', `${W5} IRP`, 'IRP forward F', () => irpForward({ spot: 4.2, iMY: 0.03, iUS: 0.05 }).value.forward, 4.12, 1e-4, 'rate'),
  c('w5-irp-f-minus-s', `${W5} IRP`, 'Forward minus spot', () => irpForward({ spot: 4.2, iMY: 0.03, iUS: 0.05 }).value.forwardMinusSpot, -0.08, 1e-4, 'rate'),
  c('w5-irp-premium', `${W5} IRP`, 'Forward premium F/S − 1', () => irpForward({ spot: 4.2, iMY: 0.03, iUS: 0.05 }).value.premium, -0.0190476, 5e-8, 'pct'),

  // ---- Workbook W5 CIA (USD 1,000,000; US 5%; UK 8%; spot 1.80 USD/GBP; forward 1.78) ----
  c('w5-cia-home', `${W5} CIA`, 'US deposit at maturity (USD)', () => w5Cia().homeMaturity, 1050000, 1, 'USD'),
  c('w5-cia-foreign-bought', `${W5} CIA`, 'GBP bought at spot (foreign amount)', () => w5Cia().foreignBought, 555555.56, 0.01, 'USD'),
  c('w5-cia-foreign-maturity', `${W5} CIA`, 'GBP deposit at maturity (foreign amount)', () => w5Cia().foreignMaturity, 600000, 0.01, 'USD'),
  c('w5-cia-hedged', `${W5} CIA`, 'Hedged USD at maturity via UK route', () => w5Cia().hedgedHome, 1068000, 1, 'USD'),
  c('w5-cia-extra', `${W5} CIA`, 'Extra USD from the hedged UK route', () => w5Cia().extra, 18000, 1, 'USD'),
  c('w5-cia-extra-pct', `${W5} CIA`, 'Extra as a share of the amount (1.8%)', () => w5Cia().extraPct, 0.018, 1e-4, 'pct'),

  // ---- Workbook W5 PPP (S 4.20, π 3% / 1%) ----
  c('w5-ppp-approx-change', `${W5} PPP`, 'Approximate change in spot', () => w5Ppp().approxChange, 0.02, 1e-4, 'pct'),
  c('w5-ppp-approx', `${W5} PPP`, 'Approximate expected spot', () => w5Ppp().approx, 4.284, 1e-4, 'rate'),
  c('w5-ppp-exact', `${W5} PPP`, 'Exact expected spot', () => w5Ppp().expected, 4.283168, 5e-7, 'rate'),
  c('w5-ppp-exact-change', `${W5} PPP`, 'Exact change in spot', () => w5Ppp().change, 0.019802, 5e-7, 'pct'),

  // ---- Workbook W5 Fisher (r 2%, π 3%) ----
  c('w5-fisher-approx', `${W5} Fisher`, 'Approximate nominal rate r + π', () => w5Fisher().approx, 0.05, 1e-4, 'pct'),
  c('w5-fisher-exact', `${W5} Fisher`, 'Exact nominal rate (1 + r)(1 + π) − 1', () => w5Fisher().nominal, 0.0506, 1e-6, 'pct'),
  c('w5-fisher-diff', `${W5} Fisher`, 'Exact minus approximate', () => w5Fisher().diff, 0.0006, 1e-6, 'pct'),

  // ---- Workbook W6 Import Budget (USD 100k; 4.20 → 4.40) ----
  c('w6-budget-old', `${W6} Import Budget`, 'Budget at the old rate', () => w6Budget().oldMYR, 420000, 1, 'MYR'),
  c('w6-budget-new', `${W6} Import Budget`, 'Budget at the new rate', () => w6Budget().newMYR, 440000, 1, 'MYR'),
  c('w6-budget-diff', `${W6} Import Budget`, 'Extra cost', () => w6Budget().diff, 20000, 1, 'MYR'),
  c('w6-budget-diff-pct', `${W6} Import Budget`, 'Extra cost as a percentage (4.7619%)', () => w6Budget().diffPct, 0.047619, 5e-7, 'pct'),

  // ---- Workbook W6 Forward Hedge (USD 100k; F 4.25; spot 4.50) ----
  c('w6-fwd-hedged', `${W6} Forward Hedge`, 'Hedged cost', () => w6Fwd().hedged, 425000, 1, 'MYR'),
  c('w6-fwd-unhedged', `${W6} Forward Hedge`, 'Unhedged cost', () => w6Fwd().unhedged, 450000, 1, 'MYR'),
  c('w6-fwd-saving', `${W6} Forward Hedge`, 'Saving from hedging', () => w6Fwd().saving, 25000, 1, 'MYR'),
  c('w6-fwd-effective', `${W6} Forward Hedge`, 'Effective rate', () => w6Fwd().effectiveRate, 4.25, 1e-4, 'rate'),

  // ---- Workbook W6 USD Call (USD 100k; K 4.25; premium 0.05; spot 4.40) ----
  c('w6-call-intrinsic', `${W6} USD Call`, 'Call intrinsic value', () => w6Call().intrinsic, 0.15, 1e-4, 'rate'),
  c('w6-call-net-per-usd', `${W6} USD Call`, 'Net benefit per USD', () => w6Call().netPerUnit, 0.1, 1e-4, 'rate'),
  c('w6-call-gross', `${W6} USD Call`, 'Gross payoff', () => w6Call().gross, 15000, 1, 'MYR'),
  c('w6-call-premium', `${W6} USD Call`, 'Total premium', () => w6Call().totalPremium, 5000, 1, 'MYR'),
  c('w6-call-net', `${W6} USD Call`, 'Net benefit', () => w6Call().netBenefit, 10000, 1, 'MYR'),
  c('w6-call-effective', `${W6} USD Call`, 'Effective MYR cost with the call', () => w6Call().effectiveMYR, 430000, 1, 'MYR'),
  c('w6-call-unhedged', `${W6} USD Call`, 'Unhedged MYR cost', () => w6Call().unhedgedMYR, 440000, 1, 'MYR'),

  // ---- Workbook W6 Option Payoffs (K 4.25; spot 4.40; premium 0.05) ----
  c('w6-payoff-call', `${W6} Option Payoffs`, 'Call intrinsic', () => w6Payoffs().callIntrinsic, 0.15, 1e-4, 'rate'),
  c('w6-payoff-put', `${W6} Option Payoffs`, 'Put intrinsic', () => w6Payoffs().putIntrinsic, 0, 1e-4, 'rate'),
  c('w6-payoff-call-net', `${W6} Option Payoffs`, 'Call net of premium', () => w6Payoffs().callNet, 0.1, 1e-4, 'rate'),
  c('w6-payoff-put-net', `${W6} Option Payoffs`, 'Put net of premium', () => w6Payoffs().putNet, -0.05, 1e-4, 'rate'),

  // ---- Week 10 slides ----
  c('w10-s4-forward', 'Week 10 slide 4', 'IRP forward (S 4.50, i 4% / 6%)', () => irpForward({ spot: 4.5, iMY: 0.04, iUS: 0.06 }).value.forward, 4.4151, 5e-5, 'rate'),
  c('w10-s6-ppp', 'Week 10 slide 6', 'PPP expected spot (S 4.50, π 4% / 2%)', () => pppExpected({ spot: 4.5, piMY: 0.04, piUS: 0.02 }).value.expected, 4.5882, 5e-5, 'rate'),
  c('w10-s8-approx', 'Week 10 slide 8', 'Approximate nominal rate (r 3%, π 4%)', () => fisherNominal({ real: 0.03, pi: 0.04 }).value.approx, 0.07, 1e-4, 'pct'),
  c('w10-s8-exact', 'Week 10 slide 8', 'Exact nominal rate (r 3%, π 4%) 7.12%', () => fisherNominal({ real: 0.03, pi: 0.04 }).value.nominal, 0.0712, 1e-6, 'pct'),
  c('w10-s11-spot', 'Week 10 slide 11', 'USD 200k at spot 4.50', () => rowMYR({ ...wk10(), a: { ...wk10().a, userForecast: 4.7 } }, 'spot'), 900000, 1, 'MYR'),
  c('w10-s11-forecast', 'Week 10 slide 11', 'USD 200k at forecast 4.70', () => rowMYR({ ...wk10(), a: { ...wk10().a, userForecast: 4.7 } }, 'user'), 940000, 1, 'MYR'),
  c('w10-s11-forward', 'Week 10 slide 11', 'USD 200k at forward 4.55', () => w10Hedge().hedged, 910000, 1, 'MYR'),
  c('w10-s11-saving', 'Week 10 slide 11', 'Saving of the forward vs the forecast', () => w10Hedge().saving, 30000, 1, 'MYR'),

  // ---- Baseline (S 4.50, i 3% / 4.5%, π 2% / 3%, USD 100k) ----
  c('base-forward', 'Baseline', 'IRP forward', () => irpOf(baseline()).forward, 4.4354067, 5e-7, 'rate'),
  c('base-premium', 'Baseline', 'Forward premium −1.435%', () => irpOf(baseline()).premium, -0.01435, 5e-6, 'pct'),
  c('base-ppp', 'Baseline', 'PPP expected spot', () => pppOf(baseline()).expected, 4.456311, 5e-7, 'rate'),
  c('base-ppp-approx', 'Baseline', 'PPP approximation', () => pppOf(baseline()).approx, 4.455, 1e-6, 'rate'),
  c('base-real-my', 'Baseline', 'Malaysia real rate 0.9804%', () => fisherReal({ i: 0.03, pi: 0.02 }).value.real, 0.009804, 5e-7, 'pct'),
  c('base-real-us', 'Baseline', 'US real rate 1.4563%', () => fisherReal({ i: 0.045, pi: 0.03 }).value.real, 0.014563, 5e-7, 'pct'),
  c('base-myr-spot', 'Baseline', 'RM cost at spot', () => rowMYR(baseline(), 'spot'), 450000, 1, 'MYR'),
  c('base-myr-forward', 'Baseline', 'RM cost at the forward', () => rowMYR(baseline(), 'forward'), 443541, 1, 'MYR'),
  c('base-myr-ppp', 'Baseline', 'RM cost at PPP', () => rowMYR(baseline(), 'ppp'), 445631, 1, 'MYR'),
  c('base-myr-stress', 'Baseline', 'RM cost at stress spot 4.70', () => rowMYR(baseline(), 'stress'), 470000, 1, 'MYR'),

  // ---- Inflation shock (Baseline with π_MY 4%) ----
  c('shock-ppp', 'Inflation shock', 'PPP expected spot', () => pppOf(shock()).expected, 4.5437, 5e-5, 'rate'),
  c('shock-myr-ppp', 'Inflation shock', 'RM cost at PPP', () => rowMYR(shock(), 'ppp'), 454369, 1, 'MYR'),
  c('shock-forward', 'Inflation shock', 'IRP forward unchanged', () => irpOf(shock()).forward, 4.4354, 5e-5, 'rate'),
  c('shock-gap', 'Inflation shock', 'Gap: PPP minus forward (RM)', () => parityOf(shock()).gapMYR, 10828, 1, 'MYR'),
  c('shock-real-my', 'Inflation shock', 'Malaysia real rate −0.9615%', () => parityOf(shock()).realMY, -0.009615, 5e-7, 'pct'),

  // ---- Rate gap (Baseline with i_US 5.5%) ----
  c('gap-forward', 'Rate gap', 'IRP forward', () => irpOf(gap()).forward, 4.3934, 5e-5, 'rate'),
  c('gap-myr-forward', 'Rate gap', 'RM cost at the forward', () => rowMYR(gap(), 'forward'), 439336, 1, 'MYR'),

  // ---- Parity identity: F/E_PPP = (1 + r_MY)/(1 + r_US) on four data sets ----
  c('parity-baseline-ratio', 'Parity identity (Baseline)', 'F / E_PPP', () => parityOf(baseline()).ratio, 0.995309, 5e-7, 'ratio'),
  c('parity-baseline-real', 'Parity identity (Baseline)', '(1 + r_MY)/(1 + r_US)', () => parityOf(baseline()).realRatio, 0.995309, 5e-7, 'ratio'),
  c('parity-shock-ratio', 'Parity identity (Inflation shock)', 'F / E_PPP', () => parityOf(shock()).ratio, 0.976169, 5e-7, 'ratio'),
  c('parity-shock-real', 'Parity identity (Inflation shock)', '(1 + r_MY)/(1 + r_US)', () => parityOf(shock()).realRatio, 0.976169, 5e-7, 'ratio'),
  c('parity-week10-ratio', 'Parity identity (Week 10)', 'F / E_PPP', () => parityOf(wk10()).ratio, 0.962264, 5e-7, 'ratio'),
  c('parity-week10-real', 'Parity identity (Week 10)', '(1 + r_MY)/(1 + r_US)', () => parityOf(wk10()).realRatio, 0.962264, 5e-7, 'ratio'),
  c('parity-workbook-ratio', 'Parity identity (Workbook)', 'F / E_PPP', () => parityOf(lect()).ratio, 0.961905, 5e-7, 'ratio'),
  c('parity-workbook-real', 'Parity identity (Workbook)', '(1 + r_MY)/(1 + r_US)', () => parityOf(lect()).realRatio, 0.961905, 5e-7, 'ratio'),

  // ---- CIA with a quoted forward of 4.40 (Baseline) ----
  c('cia-no-spread', 'CIA quoted forward', 'Profit per USD borrowed, no spread', cia(0), 0.008409, 5e-7, 'rate'),
  c('cia-spread', 'CIA quoted forward', 'Profit per USD borrowed, 0.3% spread', cia(0.003), 0.0021, 5e-5, 'rate'),

  // ---- Money-market hedge (Baseline importer, 365 days) ----
  c('mm-usd-deposit', 'Money-market hedge', 'USD deposited today', () => mm().usdLeg, 95693.78, 0.01, 'USD'),
  c('mm-myr-borrowed', 'Money-market hedge', 'MYR borrowed today', () => mm().myrLeg, 430622.01, 0.01, 'MYR'),
  c('mm-myr-repay', 'Money-market hedge', 'MYR repaid at maturity (= forward cost)', () => mm().myrAtMaturity, 443540.67, 0.01, 'MYR'),
  c('mm-equals-forward', 'Money-market hedge', 'Money-market cost minus forward cost (must be 0)', () => mm().myrAtMaturity - baseline().deal.usdAmount * irpOf(baseline()).forward, 0, 0.01, 'MYR'),

  // ---- Tenor: Baseline, 90 days ----
  c('tenor-act365', 'Tenor', 'IRP forward, 90 days ACT/365', tenorForward(365), 4.4835, 5e-5, 'rate'),
  c('tenor-act360', 'Tenor', 'IRP forward, 90 days ACT/360', tenorForward(360), 4.4833, 5e-5, 'rate'),

  // ---- Spread (S 4.50, 0.5%, buying USD 100k) ----
  c('spread-rate', 'Spread', 'Effective rate when buying USD', () => withSpread({ rate: 4.5, spread: 0.005, side: 'buyUSD', usd: 100000 }).value.effectiveRate, 4.5225, 5e-5, 'rate'),
  c('spread-extra', 'Spread', 'Extra MYR paid on USD 100k', () => withSpread({ rate: 4.5, spread: 0.005, side: 'buyUSD', usd: 100000 }).value.extraMYR, 2250, 1, 'MYR'),

  // ---- Break-evens (F 4.25, K 4.25, premium 0.05, importer) ----
  c('be-fwd-vs-unhedged', 'Break-evens', 'Forward vs unhedged', () => be().forwardVsUnhedged, 4.25, 1e-4, 'rate'),
  c('be-call-vs-unhedged', 'Break-evens', 'Call vs unhedged (K + p)', () => be().optionVsUnhedged, 4.3, 1e-4, 'rate'),
  c('be-call-vs-forward', 'Break-evens', 'Call vs forward (F − p)', () => be().optionVsForward, 4.2, 1e-4, 'rate'),

  // ---- Tornado on Baseline (+1pp on rates, +0.10 on spot), RM impact ----
  c('tornado-iMY', 'Tornado (Baseline)', 'i_MY +1pp: forward cost change', () => bar(baseline(), 'iMY').forwardDelta, 4306, 1, 'MYR'),
  c('tornado-iUS', 'Tornado (Baseline)', 'i_US +1pp: forward cost change', () => bar(baseline(), 'iUS').forwardDelta, -4204, 1, 'MYR'),
  c('tornado-piMY', 'Tornado (Baseline)', 'π_MY +1pp: PPP cost change', () => bar(baseline(), 'piMY').pppDelta, 4369, 1, 'MYR'),
  c('tornado-piUS', 'Tornado (Baseline)', 'π_US +1pp: PPP cost change', () => bar(baseline(), 'piUS').pppDelta, -4285, 1, 'MYR'),
  c('tornado-spot-fwd', 'Tornado (Baseline)', 'Spot +0.10: forward cost change (≈)', () => bar(baseline(), 'spot').forwardDelta, 9856, 1, 'MYR'),
  c('tornado-spot-ppp', 'Tornado (Baseline)', 'Spot +0.10: PPP cost change (≈)', () => bar(baseline(), 'spot').pppDelta, 9903, 1, 'MYR'),
];
