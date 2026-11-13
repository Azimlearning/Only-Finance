import type { Assumptions, Deal, Result, Scenario, SensInput, Step } from './types';
import { fixed, g, myr, rate, step } from './format';
import { dealForward, dealPPP, parityCheck } from './parity';

type InputValue = number | string | undefined;

const DEAL_KEYS: (keyof Deal)[] = ['mode', 'usdAmount', 'days', 'basis', 'spot'];
const ASSUMPTION_KEYS: (keyof Assumptions)[] = [
  'iMY', 'iUS', 'piMY', 'piUS', 'stressSpot', 'userForecast', 'quotedForward', 'optionStrike', 'optionPremium', 'spread',
];

function show(v: InputValue): string {
  return v === undefined ? 'not set' : typeof v === 'number' ? g(v) : v;
}

/** A copy of the scenario with one sensitivity input replaced. */
function withInput(s: Scenario, input: SensInput, value: number): Scenario {
  if (input === 'spot') return { ...s, deal: { ...s.deal, spot: value } };
  const a: Assumptions = { ...s.a };
  a[input] = value;
  return { ...s, a };
}

/** The deal's cost in MYR at the IRP forward and at the PPP expected spot. */
function dealCosts(s: Scenario): { forwardMYR: number; pppMYR: number } {
  return {
    forwardMYR: s.deal.usdAmount * dealForward(s.deal, s.a),
    pppMYR: s.deal.usdAmount * dealPPP(s.deal, s.a),
  };
}

/** Scenario A vs B: which inputs differ and how the parity outputs move. */
export function compareScenarios(a: Scenario, b: Scenario): Result<{
  changedInputs: { key: string; from: number | string | undefined; to: number | string | undefined }[];
  outputs: { key: string; label: string; a: number; b: number; delta: number }[];
}> {
  const changedInputs: { key: string; from: InputValue; to: InputValue }[] = [];
  for (const k of DEAL_KEYS) {
    if (a.deal[k] !== b.deal[k]) changedInputs.push({ key: k, from: a.deal[k], to: b.deal[k] });
  }
  for (const k of ASSUMPTION_KEYS) {
    if (a.a[k] !== b.a[k]) changedInputs.push({ key: k, from: a.a[k], to: b.a[k] });
  }

  const pa = parityCheck({
    spot: a.deal.spot, iMY: a.a.iMY, iUS: a.a.iUS, piMY: a.a.piMY, piUS: a.a.piUS, usdAmount: a.deal.usdAmount,
  });
  const pb = parityCheck({
    spot: b.deal.spot, iMY: b.a.iMY, iUS: b.a.iUS, piMY: b.a.piMY, piUS: b.a.piUS, usdAmount: b.deal.usdAmount,
  });
  const defs: { key: string; label: string; a: number; b: number }[] = [
    { key: 'forward', label: 'IRP forward (MYR/USD)', a: pa.value.forward, b: pb.value.forward },
    { key: 'pppExpected', label: 'PPP expected spot (MYR/USD)', a: pa.value.pppExpected, b: pb.value.pppExpected },
    { key: 'realMY', label: 'Malaysia real rate', a: pa.value.realMY, b: pb.value.realMY },
    { key: 'realUS', label: 'US real rate', a: pa.value.realUS, b: pb.value.realUS },
    { key: 'myrAtForward', label: 'MYR cost at the forward', a: pa.value.myrAtForward, b: pb.value.myrAtForward },
    { key: 'myrAtPPP', label: 'MYR cost at the PPP expected spot', a: pa.value.myrAtPPP, b: pb.value.myrAtPPP },
    { key: 'gapMYR', label: 'Gap: PPP minus forward (MYR)', a: pa.value.gapMYR, b: pb.value.gapMYR },
  ];
  const outputs = defs.map((d) => ({ ...d, delta: d.b - d.a }));

  const workings: Step[] = [
    step(
      'Inputs that differ',
      'compare every deal and assumption field',
      `${a.name} vs ${b.name}`,
      changedInputs.length === 0
        ? 'no differences'
        : changedInputs.map((c) => `${c.key}: ${show(c.from)} → ${show(c.to)}`).join('; '),
    ),
    ...outputs.map((o) => {
      const money = o.key.startsWith('myr') || o.key === 'gapMYR';
      const fmt = (n: number) => (money ? myr(n) : o.key.startsWith('real') ? rate(n, 6) : rate(n));
      return step(`Δ ${o.label}`, 'B − A', `${fmt(o.b)} − ${fmt(o.a)}`, fmt(o.delta));
    }),
  ];
  return { value: { changedInputs, outputs }, workings };
}

/** Deal cost at the forward and at PPP as one input is swept over a list of values. */
export function sensitivity(s: Scenario, input: SensInput, values: number[]): Result<{
  points: { x: number; forwardMYR: number; pppMYR: number }[];
}> {
  const points = values.map((x) => {
    const c = dealCosts(withInput(s, input, x));
    return { x, forwardMYR: c.forwardMYR, pppMYR: c.pppMYR };
  });
  const workings: Step[] = [
    step(
      'Cost at the forward',
      'USD × S × (1 + i_MY·t) / (1 + i_US·t)',
      `${fixed(s.deal.usdAmount, 0)} × IRP forward, sweeping ${input}`,
      `${points.length} points`,
    ),
    step(
      'Cost at the PPP expected spot',
      'USD × S × ((1 + π_MY) / (1 + π_US))^years',
      `${fixed(s.deal.usdAmount, 0)} × PPP expected spot (years = ${s.deal.days}/${s.deal.basis}), sweeping ${input}`,
      `${points.length} points`,
    ),
  ];
  const first = points[0];
  const last = points[points.length - 1];
  if (first && last) {
    workings.push(
      step(
        'Range covered',
        `${input} from first to last value`,
        `${g(first.x)} to ${g(last.x)}`,
        `forward ${myr(first.forwardMYR)} to ${myr(last.forwardMYR)}; PPP ${myr(first.pppMYR)} to ${myr(last.pppMYR)}`,
      ),
    );
  }
  return { value: { points }, workings };
}

const BUMPS: { input: SensInput; bump: number }[] = [
  { input: 'iMY', bump: 0.01 },
  { input: 'iUS', bump: 0.01 },
  { input: 'piMY', bump: 0.01 },
  { input: 'piUS', bump: 0.01 },
  { input: 'spot', bump: 0.1 },
];

/** One-at-a-time bumps (rates +1 percentage point, spot +0.10) and their MYR impact, largest first. */
export function tornado(s: Scenario): Result<{
  bars: { input: SensInput; bump: number; forwardDelta: number; pppDelta: number }[];
}> {
  const base = dealCosts(s);
  const bars = BUMPS.map(({ input, bump }) => {
    const current = input === 'spot' ? s.deal.spot : s.a[input];
    const c = dealCosts(withInput(s, input, current + bump));
    return { input, bump, forwardDelta: c.forwardMYR - base.forwardMYR, pppDelta: c.pppMYR - base.pppMYR };
  });
  bars.sort(
    (x, y) =>
      Math.max(Math.abs(y.forwardDelta), Math.abs(y.pppDelta)) -
      Math.max(Math.abs(x.forwardDelta), Math.abs(x.pppDelta)),
  );
  const workings: Step[] = [
    step('Base cost at the forward', 'USD × IRP forward', `${fixed(s.deal.usdAmount, 0)} × ${rate(dealForward(s.deal, s.a))}`, myr(base.forwardMYR)),
    step('Base cost at PPP', 'USD × PPP expected spot', `${fixed(s.deal.usdAmount, 0)} × ${rate(dealPPP(s.deal, s.a))}`, myr(base.pppMYR)),
    ...bars.map((b) =>
      step(
        `Bump ${b.input} by ${b.input === 'spot' ? '+0.10' : '+1 percentage point'}`,
        'new cost − base cost',
        `forward Δ and PPP Δ with ${b.input} + ${g(b.bump)}`,
        `forward ${b.forwardDelta >= 0 ? '+' : ''}${myr(b.forwardDelta)}; PPP ${b.pppDelta >= 0 ? '+' : ''}${myr(b.pppDelta)}`,
      ),
    ),
  ];
  return { value: { bars }, workings };
}
