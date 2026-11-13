import type { Result, Step } from './types';
import { fixed, fx, g, pct, rate, step } from './format';
import { irpForward } from './parity';

export type CiaDirection = 'borrowUSD_investMYR' | 'borrowMYR_investUSD' | 'none';

/**
 * Covered interest arbitrage check (one-year view, t = 1).
 * Compares the bank-quoted forward with the IRP-implied forward.
 */
export function ciaCheck(p: {
  spot: number; quotedForward: number; iMY: number; iUS: number; spread?: number; notional?: number;
}): Result<{
  irpForward: number;
  direction: CiaDirection;
  unit: 'USD' | 'MYR';
  profitPerUnit: number;
  profitPerUnitNoSpread: number;
  profitTotal: number;
}> {
  const spread = p.spread ?? 0;
  const fq = p.quotedForward;
  const f = irpForward({ spot: p.spot, iMY: p.iMY, iUS: p.iUS });
  const irp = f.value.forward;
  const workings: Step[] = [...f.workings];

  const borrowUsd = (sp: number) =>
    (p.spot * (1 - sp) * (1 + p.iMY)) / (fq * (1 + sp)) - (1 + p.iUS);
  const borrowMyr = (sp: number) =>
    ((1 / (p.spot * (1 + sp))) * (1 + p.iUS) * fq * (1 - sp)) - (1 + p.iMY);

  let direction: CiaDirection;
  let unit: 'USD' | 'MYR';
  let profitPerUnit: number;
  let profitPerUnitNoSpread: number;

  workings.push(
    step(
      'Compare quoted forward with IRP forward',
      'quoted F vs IRP F',
      `${rate(fq)} vs ${rate(irp)}`,
      fq < irp - 1e-9
        ? 'quoted forward is below IRP: buying USD forward is cheap'
        : fq > irp + 1e-9
          ? 'quoted forward is above IRP: selling USD forward is rich'
          : 'quoted forward equals IRP: no arbitrage',
    ),
  );

  if (fq < irp - 1e-9) {
    direction = 'borrowUSD_investMYR';
    unit = 'USD';
    profitPerUnit = borrowUsd(spread);
    profitPerUnitNoSpread = borrowUsd(0);
    workings.push(
      step(
        'Route',
        'borrow USD → sell at S(1 − spread) → invest MYR at i_MY → buy USD forward at Fq(1 + spread) → repay USD at (1 + i_US)',
        'borrow 1 USD, convert, deposit, then repay out of the forward purchase',
        'borrow USD, invest MYR',
      ),
      step(
        'Profit per 1 USD borrowed (no spread)',
        'S(1 + i_MY) / Fq − (1 + i_US)',
        `${fx(p.spot)} × (1 + ${g(p.iMY)}) / ${rate(fq)} − (1 + ${g(p.iUS)})`,
        `${rate(profitPerUnitNoSpread, 6)} USD`,
      ),
      step(
        'Profit per 1 USD borrowed (with spread)',
        'S(1 − spread)(1 + i_MY) / (Fq(1 + spread)) − (1 + i_US)',
        `${fx(p.spot)} × (1 − ${g(spread)}) × (1 + ${g(p.iMY)}) / (${rate(fq)} × (1 + ${g(spread)})) − (1 + ${g(p.iUS)})`,
        `${rate(profitPerUnit, 6)} USD`,
      ),
    );
  } else if (fq > irp + 1e-9) {
    direction = 'borrowMYR_investUSD';
    unit = 'MYR';
    profitPerUnit = borrowMyr(spread);
    profitPerUnitNoSpread = borrowMyr(0);
    workings.push(
      step(
        'Route',
        'borrow MYR → buy USD at S(1 + spread) → invest USD at i_US → sell USD forward at Fq(1 − spread) → repay MYR at (1 + i_MY)',
        'borrow 1 MYR, convert, deposit, then sell the maturing USD forward',
        'borrow MYR, invest USD',
      ),
      step(
        'Profit per 1 MYR borrowed (no spread)',
        '(1 / S)(1 + i_US) × Fq − (1 + i_MY)',
        `(1 / ${fx(p.spot)}) × (1 + ${g(p.iUS)}) × ${rate(fq)} − (1 + ${g(p.iMY)})`,
        `${rate(profitPerUnitNoSpread, 6)} MYR`,
      ),
      step(
        'Profit per 1 MYR borrowed (with spread)',
        '(1 / (S(1 + spread)))(1 + i_US) × Fq(1 − spread) − (1 + i_MY)',
        `(1 / (${fx(p.spot)} × (1 + ${g(spread)}))) × (1 + ${g(p.iUS)}) × ${rate(fq)} × (1 − ${g(spread)}) − (1 + ${g(p.iMY)})`,
        `${rate(profitPerUnit, 6)} MYR`,
      ),
    );
  } else {
    direction = 'none';
    unit = 'USD';
    profitPerUnit = 0;
    profitPerUnitNoSpread = 0;
    workings.push(
      step('Profit per unit', 'quoted F = IRP F → no riskless profit', `${rate(fq)} = ${rate(irp)}`, '0'),
    );
  }

  const notional = p.notional ?? 1_000_000;
  const profitTotal = profitPerUnit * notional;
  workings.push(
    step(
      'Total profit',
      'profit per unit × notional',
      `${rate(profitPerUnit, 6)} × ${fixed(notional, 0)} ${unit}`,
      `${fixed(profitTotal, 2)} ${unit}`,
    ),
  );

  return {
    value: { irpForward: irp, direction, unit, profitPerUnit, profitPerUnitNoSpread, profitTotal },
    workings,
  };
}

/**
 * Workbook W5 CIA layout: home deposit vs the hedged foreign route.
 * spot and forward are home currency per 1 foreign unit.
 */
export function ciaCompare(p: {
  amount: number; homeRate: number; foreignRate: number; spot: number; forward: number;
}): Result<{
  homeMaturity: number;
  foreignBought: number;
  foreignMaturity: number;
  hedgedHome: number;
  extra: number;
  extraPct: number;
}> {
  const homeMaturity = p.amount * (1 + p.homeRate);
  const foreignBought = p.amount / p.spot;
  const foreignMaturity = foreignBought * (1 + p.foreignRate);
  const hedgedHome = foreignMaturity * p.forward;
  const extra = hedgedHome - homeMaturity;
  const extraPct = extra / p.amount;
  return {
    value: { homeMaturity, foreignBought, foreignMaturity, hedgedHome, extra, extraPct },
    workings: [
      step(
        'Home deposit at maturity',
        'amount × (1 + i_home)',
        `${fixed(p.amount, 0)} × (1 + ${g(p.homeRate)})`,
        fixed(homeMaturity, 2),
      ),
      step(
        'Foreign currency bought at spot',
        'amount / S',
        `${fixed(p.amount, 0)} / ${fx(p.spot)}`,
        fixed(foreignBought, 2),
      ),
      step(
        'Foreign deposit at maturity',
        'foreign bought × (1 + i_foreign)',
        `${fixed(foreignBought, 2)} × (1 + ${g(p.foreignRate)})`,
        fixed(foreignMaturity, 2),
      ),
      step(
        'Converted back at the forward',
        'foreign at maturity × F',
        `${fixed(foreignMaturity, 2)} × ${fx(p.forward)}`,
        fixed(hedgedHome, 2),
      ),
      step(
        'Extra from the hedged foreign route',
        'hedged home − home deposit',
        `${fixed(hedgedHome, 2)} − ${fixed(homeMaturity, 2)}`,
        `${fixed(extra, 2)} (${pct(extraPct)} of the amount)`,
      ),
    ],
  };
}
