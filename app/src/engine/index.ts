export * from './types';

export { periodRate } from './tenor';
export {
  irpForward,
  pppExpected,
  fisherReal,
  fisherNominal,
  ifeExpected,
  parityCheck,
} from './parity';
export type { ParityVerdict } from './parity';
export { ciaCheck, ciaCompare } from './arbitrage';
export type { CiaDirection } from './arbitrage';
export { importBudget, withSpread, forecastViews } from './budget';
export type { ForecastKey } from './budget';
export {
  forwardHedge,
  optionHedge,
  optionPayoffs,
  moneyMarketHedge,
  hedgeComparison,
  breakEvens,
} from './hedging';
export { compareScenarios, sensitivity, tornado } from './scenarios';

export { PRESETS, getPreset } from './presets';
export { LIMITATIONS } from './limitations';
export { ORACLE } from './oracle';
export type { OracleCase } from './oracle';

/** Exactly the calculation functions in the contract table (getPreset is a helper, not a tool). */
export const CALC_FUNCTION_NAMES = [
  'periodRate',
  'irpForward',
  'pppExpected',
  'fisherReal',
  'fisherNominal',
  'ifeExpected',
  'parityCheck',
  'ciaCheck',
  'ciaCompare',
  'importBudget',
  'withSpread',
  'forecastViews',
  'forwardHedge',
  'optionHedge',
  'optionPayoffs',
  'moneyMarketHedge',
  'hedgeComparison',
  'breakEvens',
  'compareScenarios',
  'sensitivity',
  'tornado',
] as const;
