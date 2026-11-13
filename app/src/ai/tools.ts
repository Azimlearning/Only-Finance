// Tool registry: one JSON-schema entry per engine calculation function (names identical).
// The LLM calls these for every figure; results feed the number guard.

import * as E from '../engine';
import type { Assumptions, Deal, Scenario } from '../engine';
import { factsFor } from './facts';
import { collectNumbers, numbersInText } from './guard';

export interface Tool {
  name: string;
  description: string;
  /** JSON Schema for the arguments object. */
  parameters: object;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (args: any, scenario?: Scenario) => unknown;
}

interface PropSpec {
  type: 'number' | 'string' | 'array';
  description: string;
  enum?: string[];
  required?: boolean;
}

const RATE_NOTE = 'Rates are DECIMALS (0.03 means 3%).';
const FX_NOTE = 'FX rates are MYR per 1 USD (higher = weaker ringgit).';

const num = (description: string, required = true): PropSpec => ({ type: 'number', description, required });
const str = (description: string, values?: string[], required = true): PropSpec => ({
  type: 'string',
  description,
  ...(values ? { enum: values } : {}),
  required,
});
const arr = (description: string, required = true): PropSpec => ({ type: 'array', description, required });

const DEAL_PROPS = {
  mode: { type: 'string', enum: ['importer', 'exporter'], description: 'importer pays USD, exporter receives USD' },
  usdAmount: { type: 'number', description: 'USD amount of the deal' },
  days: { type: 'number', description: 'Days to settlement' },
  basis: { type: 'number', enum: [365, 360], description: 'Day-count basis' },
  spot: { type: 'number', description: 'Spot, MYR per 1 USD' },
};
const ASSUMPTION_PROPS = {
  iMY: { type: 'number', description: 'Malaysian interest rate, decimal' },
  iUS: { type: 'number', description: 'US interest rate, decimal' },
  piMY: { type: 'number', description: 'Malaysian inflation, decimal' },
  piUS: { type: 'number', description: 'US inflation, decimal' },
  stressSpot: { type: 'number', description: 'Stress-case spot, MYR per 1 USD' },
  userForecast: { type: 'number', description: "User's own forecast rate, MYR per 1 USD" },
  quotedForward: { type: 'number', description: 'Bank-quoted forward, MYR per 1 USD' },
  optionStrike: { type: 'number', description: 'Option strike, MYR per 1 USD' },
  optionPremium: { type: 'number', description: 'Option premium, MYR per 1 USD' },
  spread: { type: 'number', description: 'Bank spread, decimal (0.005 = 0.5%)' },
};

const OVERRIDES_SCHEMA = {
  type: 'object',
  description:
    'Optional what-if changes merged onto the CURRENT scenario. Rates are decimals (0.04 = 4%). Omit to use the current scenario unchanged.',
  properties: {
    deal: { type: 'object', description: 'Partial deal fields to override', properties: DEAL_PROPS },
    a: { type: 'object', description: 'Partial assumption fields to override', properties: ASSUMPTION_PROPS },
  },
};

function buildSchema(props: Record<string, PropSpec>, extra: Record<string, object> = {}): object {
  const properties: Record<string, object> = {};
  const required: string[] = [];
  for (const [k, p] of Object.entries(props)) {
    properties[k] = {
      type: p.type,
      description: p.description,
      ...(p.enum ? { enum: p.enum } : {}),
      ...(p.type === 'array' ? { items: { type: 'number' } } : {}),
    };
    if (p.required) required.push(k);
  }
  for (const [k, v] of Object.entries(extra)) properties[k] = v;
  return { type: 'object', properties, required };
}

function validate(name: string, props: Record<string, PropSpec>, args: unknown): Record<string, unknown> {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error(`${name}: arguments must be a JSON object`);
  }
  const a = args as Record<string, unknown>;
  for (const [k, p] of Object.entries(props)) {
    const v = a[k];
    if (v === undefined || v === null) {
      if (p.required) throw new Error(`${name}: missing required argument "${k}"`);
      continue;
    }
    if (p.type === 'number' && (typeof v !== 'number' || !Number.isFinite(v))) {
      throw new Error(`${name}: "${k}" must be a finite number (got ${JSON.stringify(v)})`);
    }
    if (p.type === 'string' && typeof v !== 'string') throw new Error(`${name}: "${k}" must be a string`);
    if (p.enum && !p.enum.includes(String(v))) {
      throw new Error(`${name}: "${k}" must be one of ${p.enum.join(', ')} (got ${JSON.stringify(v)})`);
    }
    if (p.type === 'array' && (!Array.isArray(v) || v.some((x) => typeof x !== 'number' || !Number.isFinite(x)))) {
      throw new Error(`${name}: "${k}" must be an array of finite numbers`);
    }
  }
  return a;
}

/** Plain engine tool: args are the engine function's parameter object. */
function plain(
  name: string,
  description: string,
  props: Record<string, PropSpec>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (p: any) => unknown,
): Tool {
  return {
    name,
    description,
    parameters: buildSchema(props),
    run: (args) => fn(validate(name, props, args)),
  };
}

function scenarioOrDefault(s?: Scenario): Scenario {
  return s ?? E.getPreset('baseline');
}

function applyOverrides(s: Scenario, overrides: unknown): Scenario {
  if (overrides === undefined || overrides === null) return s;
  if (typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('"overrides" must be an object');
  const o = overrides as { deal?: Partial<Deal>; a?: Partial<Assumptions> };
  return { ...s, deal: { ...s.deal, ...(o.deal ?? {}) }, a: { ...s.a, ...(o.a ?? {}) } };
}

/** Scenario tool: args = { overrides?, ...extra }, merged onto the current scenario. */
function scenarioTool(
  name: string,
  description: string,
  props: Record<string, PropSpec>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (s: Scenario, p: any, base: Scenario) => unknown,
): Tool {
  return {
    name,
    description: `${description} Uses the CURRENT scenario; pass "overrides" ({deal?, a?}) for what-if changes. ${RATE_NOTE}`,
    parameters: buildSchema(props, { overrides: OVERRIDES_SCHEMA }),
    run: (args, scenario) => {
      const p = validate(name, props, args ?? {});
      const base = scenarioOrDefault(scenario);
      return fn(applyOverrides(base, p.overrides), p, base);
    },
  };
}

const MODE = ['importer', 'exporter'];

export const TOOLS: Tool[] = [
  plain('periodRate', `Convert an annual rate to the rate for a period of days. ${RATE_NOTE}`, {
    annual: num('Annual rate, decimal'),
    days: num('Days in the period'),
    basis: num('Day-count basis, 365 or 360'),
  }, E.periodRate),

  plain('irpForward', `Interest rate parity (covered) forward rate: spot adjusted by the MY/US interest differential. ${FX_NOTE} ${RATE_NOTE} Omit days for exactly one year.`, {
    spot: num('Spot, MYR per 1 USD'),
    iMY: num('Malaysian interest rate, decimal'),
    iUS: num('US interest rate, decimal'),
    days: num('Days to maturity (optional)', false),
    basis: num('Day-count basis 365 or 360 (optional)', false),
  }, E.irpForward),

  plain('pppExpected', `Purchasing power parity expected spot rate from the inflation differential. ${FX_NOTE} ${RATE_NOTE}`, {
    spot: num('Spot, MYR per 1 USD'),
    piMY: num('Malaysian inflation, decimal'),
    piUS: num('US inflation, decimal'),
    years: num('Horizon in years (optional, default 1)', false),
  }, E.pppExpected),

  plain('fisherReal', `Fisher equation: real rate from a nominal rate and inflation (exact and approximate). ${RATE_NOTE}`, {
    i: num('Nominal interest rate, decimal'),
    pi: num('Inflation rate, decimal'),
  }, E.fisherReal),

  plain('fisherNominal', `Fisher equation: nominal rate from a real rate and inflation. ${RATE_NOTE}`, {
    real: num('Real interest rate, decimal'),
    pi: num('Inflation rate, decimal'),
  }, E.fisherNominal),

  plain('ifeExpected', `International Fisher Effect expected spot rate from the interest differential. ${FX_NOTE} ${RATE_NOTE}`, {
    spot: num('Spot, MYR per 1 USD'),
    iMY: num('Malaysian interest rate, decimal'),
    iUS: num('US interest rate, decimal'),
    days: num('Days (optional)', false),
    basis: num('Day-count basis (optional)', false),
  }, E.ifeExpected),

  plain('parityCheck', `One-year parity summary: IRP forward vs PPP expected rate, real rates, MYR cost at each, and a verdict (forwardCheaper / forwardDearer / aligned). ${FX_NOTE} ${RATE_NOTE}`, {
    spot: num('Spot, MYR per 1 USD'),
    iMY: num('Malaysian interest rate, decimal'),
    iUS: num('US interest rate, decimal'),
    piMY: num('Malaysian inflation, decimal'),
    piUS: num('US inflation, decimal'),
    usdAmount: num('USD amount'),
  }, E.parityCheck),

  plain('ciaCheck', `Covered interest arbitrage check: compares a quoted forward with the IRP forward and gives direction and profit. ${FX_NOTE} ${RATE_NOTE}`, {
    spot: num('Spot, MYR per 1 USD'),
    quotedForward: num('Quoted forward, MYR per 1 USD'),
    iMY: num('Malaysian interest rate, decimal'),
    iUS: num('US interest rate, decimal'),
    spread: num('Bid-ask spread, decimal (optional)', false),
    notional: num('Notional in USD (optional)', false),
  }, E.ciaCheck),

  plain('ciaCompare', `Covered interest arbitrage comparison (workbook layout): invest at home vs buy foreign and hedge. Spot/forward are home currency per 1 foreign unit. ${RATE_NOTE}`, {
    amount: num('Amount in home currency'),
    homeRate: num('Home interest rate, decimal'),
    foreignRate: num('Foreign interest rate, decimal'),
    spot: num('Spot, home per 1 foreign'),
    forward: num('Forward, home per 1 foreign'),
  }, E.ciaCompare),

  plain('importBudget', `Change in MYR import budget when the rate moves from rateOld to rateNew. ${FX_NOTE}`, {
    usd: num('USD amount'),
    rateOld: num('Old rate, MYR per 1 USD'),
    rateNew: num('New rate, MYR per 1 USD'),
  }, E.importBudget),

  plain('withSpread', `Effective rate after the bank spread. ${FX_NOTE} ${RATE_NOTE}`, {
    rate: num('Mid rate, MYR per 1 USD'),
    spread: num('Spread, decimal (0.005 = 0.5%)'),
    side: str('buyUSD (importer) or sellUSD (exporter)', ['buyUSD', 'sellUSD']),
    usd: num('USD amount (optional)', false),
  }, E.withSpread),

  scenarioTool('forecastViews', 'MYR cost/proceeds of the deal under each forecast view: spot, forward, PPP, IFE, stress, user.', {},
    (s) => E.forecastViews(s)),

  plain('forwardHedge', `Forward hedge outcome vs unhedged. ${FX_NOTE}`, {
    usd: num('USD amount'),
    forward: num('Forward rate, MYR per 1 USD'),
    spotAtMaturity: num('Spot at maturity, MYR per 1 USD'),
  }, E.forwardHedge),

  plain('optionHedge', `Currency option hedge outcome (call for importer, put for exporter). ${FX_NOTE}`, {
    usd: num('USD amount'),
    strike: num('Strike, MYR per 1 USD'),
    premium: num('Premium, MYR per 1 USD'),
    spotAtMaturity: num('Spot at maturity, MYR per 1 USD'),
    type: str('call or put', ['call', 'put']),
  }, E.optionHedge),

  plain('optionPayoffs', `Intrinsic values and net payoffs of a call and a put at a spot. ${FX_NOTE}`, {
    strike: num('Strike, MYR per 1 USD'),
    spot: num('Spot, MYR per 1 USD'),
    premium: num('Premium, MYR per 1 USD'),
  }, E.optionPayoffs),

  plain('moneyMarketHedge', `Money-market hedge: borrow/lend to lock the MYR amount today. ${FX_NOTE} ${RATE_NOTE}`, {
    usd: num('USD amount'),
    spot: num('Spot, MYR per 1 USD'),
    iMY: num('Malaysian interest rate, decimal'),
    iUS: num('US interest rate, decimal'),
    days: num('Days (optional)', false),
    basis: num('Day-count basis (optional)', false),
    mode: str('importer or exporter', MODE),
  }, E.moneyMarketHedge),

  scenarioTool('hedgeComparison', 'MYR outcome of unhedged vs forward vs option vs money-market hedge across a range of spot rates at maturity.', {
    spots: arr('Spot rates to evaluate, MYR per 1 USD (optional)', false),
  }, (s, p) => E.hedgeComparison(s, p.spots)),

  plain('breakEvens', `Break-even spot rates between unhedged, forward and option. ${FX_NOTE}`, {
    forward: num('Forward, MYR per 1 USD'),
    strike: num('Option strike, MYR per 1 USD'),
    premium: num('Option premium, MYR per 1 USD'),
    mode: str('importer or exporter', MODE),
  }, E.breakEvens),

  scenarioTool('compareScenarios', 'Compare scenario A (the current scenario) with scenario B (current scenario plus the overrides): changed inputs and output differences.', {},
    (s, _p, base) => E.compareScenarios(base, s)),

  scenarioTool('sensitivity', 'How the forward-based and PPP-based MYR amounts change as one input varies. Rate inputs are decimals; spot is MYR per 1 USD.', {
    input: str('Input to vary', ['iMY', 'iUS', 'piMY', 'piUS', 'spot']),
    values: arr('Values of that input to evaluate (decimals for rates)'),
  }, (s, p) => E.sensitivity(s, p.input, p.values)),

  scenarioTool('tornado', 'Rank which input moves the MYR outcome most (rates +0.01, spot +0.10).', {},
    (s) => E.tornado(s)),
];

export const ENGINE_TOOL_NAMES: string[] = TOOLS.map((t) => t.name);

/** Effective deal mode for fact wording: explicit `mode` arg, else overrides, else the scenario. */
function factContext(args: unknown, scenario?: Scenario): { mode: 'importer' | 'exporter'; scenario: Scenario } {
  const base = scenarioOrDefault(scenario);
  let eff = base;
  try {
    eff = applyOverrides(base, (args as { overrides?: unknown } | null)?.overrides);
  } catch {
    eff = base;
  }
  const argMode = (args as { mode?: unknown } | null)?.mode;
  const mode = argMode === 'importer' || argMode === 'exporter' ? argMode : eff.deal.mode;
  return { mode, scenario: eff };
}

export function runTool(
  name: string,
  args: unknown,
  scenario?: Scenario,
): { result: unknown; numbers: number[]; facts: string[] } {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) {
    return { result: { error: `Unknown tool "${name}". Available: ${ENGINE_TOOL_NAMES.join(', ')}` }, numbers: [], facts: [] };
  }
  try {
    const engine = tool.run(args ?? {}, scenario);
    // Direction sentences are generated in code from the engine values (never by the model).
    const facts = factsFor(name, args ?? {}, engine, factContext(args, scenario));
    const result = engine !== null && typeof engine === 'object' && !Array.isArray(engine) ? { ...(engine as object), facts } : { value: engine, facts };
    // Numbers quoted in facts are engine-derived too, so the guard treats them as known.
    return { result, numbers: [...collectNumbers(engine), ...numbersInText(facts.join(' '))], facts };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { result: { error: `${name} failed: ${message}` }, numbers: [], facts: [] };
  }
}
