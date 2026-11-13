import { describe, it, expect } from 'vitest';
import * as engine from './engine';
import { ORACLE, CALC_FUNCTION_NAMES } from './engine';
import { ENGINE_TOOL_NAMES } from './ai/tools';
import { verifyNumbers } from './ai/guard';

describe('Reference values (lecturer workbook, Week 10 guide, verification script)', () => {
  it.each(ORACLE.map(c => [c.id, c] as const))('%s', (_id, c) => {
    const actual = c.actual();
    expect(Number.isFinite(actual)).toBe(true);
    expect(Math.abs(actual - c.expected)).toBeLessThanOrEqual(c.tolerance);
  });

  it('has at least 60 oracle cases', () => {
    expect(ORACLE.length).toBeGreaterThanOrEqual(60);
  });
});

describe('Parity identity', () => {
  const sets: [number, number, number, number, number][] = [
    [4.5, 0.03, 0.045, 0.02, 0.03], // Baseline
    [4.5, 0.03, 0.045, 0.04, 0.03], // Inflation shock
    [4.5, 0.04, 0.06, 0.04, 0.02], // Week 10
    [4.2, 0.03, 0.05, 0.03, 0.01], // Workbook
  ];
  it.each(sets)('F/E_PPP equals real-rate ratio (spot %s)', (spot, iMY, iUS, piMY, piUS) => {
    const { value } = engine.parityCheck({ spot, iMY, iUS, piMY, piUS, usdAmount: 100000 });
    expect(Math.abs(value.ratio - value.realRatio)).toBeLessThan(1e-12);
  });
});

describe('Registry coverage', () => {
  const api = engine as unknown as Record<string, unknown>;

  it.each(CALC_FUNCTION_NAMES.map(n => [n] as const))('%s is exposed to the AI tools', (name) => {
    expect(ENGINE_TOOL_NAMES).toContain(name);
  });

  it.each(CALC_FUNCTION_NAMES.map(n => [n] as const))('%s is a function on engine', (name) => {
    expect(typeof api[name]).toBe('function');
  });

  it('every checked calculation returns non-empty workings', () => {
    const results = [
      engine.irpForward({ spot: 4.5, iMY: 0.03, iUS: 0.045 }),
      engine.pppExpected({ spot: 4.5, piMY: 0.02, piUS: 0.03 }),
      engine.fisherReal({ i: 0.03, pi: 0.02 }),
      engine.forecastViews(engine.getPreset('baseline')),
    ];
    for (const r of results) {
      expect(Array.isArray(r.workings)).toBe(true);
      expect(r.workings.length).toBeGreaterThan(0);
    }
  });
});

describe('Number guard', () => {
  const known = [4.435406, 443540.67, 4.456311, 445631.07, 0.009804, 0.014563];

  it('verifies a correct text fully', () => {
    const r = verifyNumbers(
      'The forward is 4.4354 MYR/USD, costing RM443,541. PPP expects 4.4563. Real rate 0.98%.',
      known,
    );
    expect(r.verified).toBe(r.total);
    expect(r.total).toBeGreaterThanOrEqual(4);
  });

  it('flags a planted wrong number with its correction', () => {
    const r = verifyNumbers('The forward is 4.4360 MYR/USD.', known);
    expect(r.verified).toBeLessThan(r.total);
    const corrected = r.segments.some(
      s => s.kind === 'number' && s.status === 'corrected' && Math.abs((s.correct ?? NaN) - 4.435406) <= 1e-6,
    );
    expect(corrected).toBe(true);
  });
});
