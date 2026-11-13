import type { DayBasis, Result } from './types';
import { fixed, g, step } from './format';

/** Year fraction t = days / basis. When days is omitted, t = 1 exactly. */
export function tenorFraction(days?: number, basis?: DayBasis): number {
  return days === undefined ? 1 : days / (basis ?? 365);
}

/** Simple-interest period rate: annual × days / basis. */
export function periodRate(p: { annual: number; days: number; basis: DayBasis }): Result<{ rate: number; t: number }> {
  const t = p.days / p.basis;
  const rate = p.annual * t;
  return {
    value: { rate, t },
    workings: [
      step('Tenor fraction', 't = days / basis', `t = ${p.days} / ${p.basis}`, fixed(t, 6)),
      step(
        'Period rate',
        'period rate = annual rate × t',
        `period rate = ${g(p.annual)} × ${p.days}/${p.basis}`,
        `${fixed(rate * 100, 4)}%`,
      ),
    ],
  };
}
