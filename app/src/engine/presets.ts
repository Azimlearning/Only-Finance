import type { Assumptions, Deal, Scenario } from './types';

const baseDeal: Deal = { mode: 'importer', usdAmount: 100000, days: 365, basis: 365, spot: 4.5 };

const baselineA: Assumptions = {
  iMY: 0.03,
  iUS: 0.045,
  piMY: 0.02,
  piUS: 0.03,
  stressSpot: 4.7,
  optionStrike: 4.45,
  optionPremium: 0.05,
  spread: 0,
};

const lecturer: Scenario = {
  id: 'lecturer',
  name: 'Lecturer workbook',
  illustrative: true,
  deal: { ...baseDeal, spot: 4.2 },
  a: {
    iMY: 0.03,
    iUS: 0.05,
    piMY: 0.03,
    piUS: 0.01,
    stressSpot: 4.4,
    quotedForward: 4.25,
    optionStrike: 4.25,
    optionPremium: 0.05,
    spread: 0,
  },
  note: 'Reproduces the lecturer Excel workbook so every engine number can be checked against the sheet.',
};

const baseline: Scenario = {
  id: 'baseline',
  name: 'Baseline',
  illustrative: true,
  deal: { ...baseDeal },
  a: { ...baselineA },
  note: 'A neutral starting point where the three parity views (forward, PPP, Fisher) can be compared side by side.',
};

const inflationShock: Scenario = {
  id: 'inflationShock',
  name: 'Inflation shock',
  illustrative: true,
  deal: { ...baseDeal },
  a: { ...baselineA, piMY: 0.04 },
  note: 'Higher Malaysian inflation lifts the PPP expected spot but leaves the IRP forward unchanged, so the gap between them widens.',
};

const rateGap: Scenario = {
  id: 'rateGap',
  name: 'Rate gap',
  illustrative: true,
  deal: { ...baseDeal },
  a: { ...baselineA, iUS: 0.055 },
  note: 'A wider US-over-Malaysia interest rate gap pulls the IRP forward lower, which lowers the cost of a forward-hedged import.',
};

const week10: Scenario = {
  id: 'week10',
  name: 'Week 10 example',
  illustrative: true,
  deal: { ...baseDeal, usdAmount: 200000 },
  a: {
    iMY: 0.04,
    iUS: 0.06,
    piMY: 0.04,
    piUS: 0.02,
    stressSpot: 4.7,
    quotedForward: 4.55,
    optionStrike: 4.55,
    optionPremium: 0.05,
    spread: 0,
  },
  note: 'The Week 10 lecture numbers: a hedging decision between the forward, the option and doing nothing on a USD 200,000 payment.',
};

export const PRESETS: Scenario[] = [lecturer, baseline, inflationShock, rateGap, week10];

/** Returns an independent copy of a preset so callers can edit it freely. */
export function getPreset(id: string): Scenario {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown preset: ${id}`);
  return { ...p, deal: { ...p.deal }, a: { ...p.a } };
}
