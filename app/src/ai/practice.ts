// Practice question generator + scoring + feedback (LLM or offline template).

import * as E from '../engine';
import type { Scenario, Step } from '../engine';
import { chatOrOffline } from './client';
import type { TutorReply } from './client';
import { collectNumbers, numbersInText } from './guard';
import { OFFLINE_LABEL, fmt } from './offline';
import { buildFeedbackPrompt, buildSystemPrompt } from './prompts';
import type { Tone } from './prompts';

export type PracticeTarget = 'ppp' | 'irp' | 'cost';
export type PracticeInput = 'piMY' | 'iUS' | 'iMY' | 'spot';
export type Direction = 'up' | 'down';

export interface PracticeQuestion {
  id: string;
  presetName: string;
  target: PracticeTarget;
  targetLabel: string;
  input: PracticeInput;
  /** Change applied to the input (decimal for rates, MYR per USD for spot). */
  delta: number;
  base: Scenario;
  changed: Scenario;
  prompt: string;
  baseValue: number;
  answerValue: number;
  answerDirection: Direction;
  unit: 'rate' | 'MYR';
  workings: Step[];
}

export interface PracticeScore {
  directionCorrect: boolean;
  valueCorrect: boolean;
  /** 1 = direction and value right, 0.5 = direction only, 0 = otherwise. */
  score: 0 | 0.5 | 1;
  /** Both parts right. */
  correct: boolean;
  /** |value − answer| / |answer| (Infinity when no usable value). */
  errorPct: number;
}

const TARGET_INPUTS: Record<PracticeTarget, PracticeInput[]> = {
  ppp: ['piMY', 'spot'],
  irp: ['iUS', 'iMY', 'spot'],
  cost: ['iUS', 'iMY', 'spot'],
};

let counter = 0;

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

function targetLabel(target: PracticeTarget, s: Scenario): string {
  if (target === 'ppp') return 'PPP expected rate';
  if (target === 'irp') return 'IRP forward';
  return s.deal.mode === 'importer' ? 'MYR cost at the forward' : 'MYR proceeds at the forward';
}

function evaluate(s: Scenario, target: PracticeTarget): { value: number; workings: Step[] } {
  const { spot, usdAmount } = s.deal;
  const pc = E.parityCheck({ spot, iMY: s.a.iMY, iUS: s.a.iUS, piMY: s.a.piMY, piUS: s.a.piUS, usdAmount });
  if (target === 'ppp') {
    const r = E.pppExpected({ spot, piMY: s.a.piMY, piUS: s.a.piUS });
    return { value: pc.value.pppExpected, workings: r.workings };
  }
  const f = E.irpForward({ spot, iMY: s.a.iMY, iUS: s.a.iUS });
  if (target === 'irp') return { value: pc.value.forward, workings: f.workings };
  const extra: Step = {
    label: 'MYR at the forward',
    formula: 'USD amount x forward',
    substituted: `${usdAmount} x ${pc.value.forward}`,
    result: String(pc.value.myrAtForward),
  };
  return { value: pc.value.myrAtForward, workings: [...f.workings, extra] };
}

function applyChange(s: Scenario, input: PracticeInput, delta: number): Scenario {
  if (input === 'spot') return { ...s, deal: { ...s.deal, spot: s.deal.spot + delta } };
  return { ...s, a: { ...s.a, [input]: s.a[input] + delta } };
}

function describeChange(base: Scenario, changed: Scenario, input: PracticeInput): string {
  if (input === 'spot') {
    return `Spot moves from ${fmt.rate(base.deal.spot)} to ${fmt.rate(changed.deal.spot)} MYR per 1 USD.`;
  }
  const names: Record<Exclude<PracticeInput, 'spot'>, string> = {
    piMY: 'Malaysian inflation',
    iUS: 'The US interest rate',
    iMY: 'The Malaysian interest rate',
  };
  const from = base.a[input];
  const to = changed.a[input];
  return `${names[input]} ${to > from ? 'rises' : 'falls'} from ${fmt.pctIn(from)} to ${fmt.pctIn(to)}.`;
}

export function generateQuestion(rng: () => number = Math.random): PracticeQuestion {
  const base = pick(E.PRESETS, rng);
  const target = pick(['ppp', 'irp', 'cost'] as const, rng);
  const input = pick(TARGET_INPUTS[target], rng);

  let magnitude: number;
  if (input === 'spot') magnitude = 0.1;
  else if (input === 'piMY') magnitude = (rng() < 0.5 ? 1 : 2) / 100;
  else magnitude = 0.01;
  let delta = (rng() < 0.5 ? -1 : 1) * magnitude;
  // keep rates and spot sensible: never push a rate below 0
  if (input !== 'spot' && base.a[input] + delta < 0) delta = -delta;

  const changed = applyChange(base, input, delta);
  const before = evaluate(base, target);
  const after = evaluate(changed, target);
  const label = targetLabel(target, base);
  const unit: 'rate' | 'MYR' = target === 'cost' ? 'MYR' : 'rate';
  const shown = (v: number): string => (unit === 'MYR' ? fmt.myr(v) : `${fmt.rate(v)} MYR per 1 USD`);

  const prompt = [
    `Starting point (${base.name}, one-year view): spot ${fmt.rate(base.deal.spot)} MYR per 1 USD; interest ${fmt.pctIn(base.a.iMY)} Malaysia and ${fmt.pctIn(base.a.iUS)} US; inflation ${fmt.pctIn(base.a.piMY)} Malaysia and ${fmt.pctIn(base.a.piUS)} US; deal ${fmt.usd(base.deal.usdAmount)} as an ${base.deal.mode}.`,
    `Before the change the ${label} is ${shown(before.value)}.`,
    `Now: ${describeChange(base, changed, input)}`,
    `Does the ${label} go up or down, and to roughly what value?`,
  ].join(' ');

  counter += 1;
  return {
    id: `q${counter}`,
    presetName: base.name,
    target,
    targetLabel: label,
    input,
    delta,
    base,
    changed,
    prompt,
    baseValue: before.value,
    answerValue: after.value,
    answerDirection: after.value >= before.value ? 'up' : 'down',
    unit,
    workings: after.workings,
  };
}

export function scoreAnswer(question: PracticeQuestion, direction: Direction, value: number): PracticeScore {
  const directionCorrect = direction === question.answerDirection;
  const ans = question.answerValue;
  const errorPct = Number.isFinite(value) && ans !== 0 ? Math.abs(value - ans) / Math.abs(ans) : Infinity;
  const valueCorrect = errorPct <= 0.01;
  const score = directionCorrect && valueCorrect ? 1 : directionCorrect ? 0.5 : 0;
  return { directionCorrect, valueCorrect, score, correct: directionCorrect && valueCorrect, errorPct };
}

function reason(q: PracticeQuestion): string {
  const up = q.delta > 0;
  switch (q.input) {
    case 'piMY':
      return up
        ? 'higher Malaysian inflation means the ringgit loses purchasing power faster than the dollar, so PPP expects more ringgit per dollar'
        : 'lower Malaysian inflation means the ringgit holds its purchasing power better, so PPP expects fewer ringgit per dollar';
    case 'iUS':
      return up
        ? 'the forward is spot x (1 + MY interest) / (1 + US interest); a higher US rate makes the divisor bigger, so the forward falls'
        : 'the forward is spot x (1 + MY interest) / (1 + US interest); a lower US rate makes the divisor smaller, so the forward rises';
    case 'iMY':
      return up
        ? 'the forward is spot x (1 + MY interest) / (1 + US interest); a higher MY rate makes the top bigger, so the forward rises'
        : 'the forward is spot x (1 + MY interest) / (1 + US interest); a lower MY rate makes the top smaller, so the forward falls';
    case 'spot':
      return up
        ? 'both parity formulas start from spot, so a higher spot lifts the result by the same proportion'
        : 'both parity formulas start from spot, so a lower spot lowers the result by the same proportion';
  }
}

function fmtValue(q: PracticeQuestion, v: number): string {
  return q.unit === 'MYR' ? fmt.myr(v) : fmt.rate(v);
}

function workingsText(q: PracticeQuestion): string {
  return q.workings.map((s) => `${s.label}: ${s.formula} -> ${s.substituted} = ${s.result}`).join('\n');
}

/** Feedback for a submitted answer: LLM (with engine answer + workings in the prompt) or offline template. */
export async function practiceFeedback(
  question: PracticeQuestion,
  direction: Direction,
  value: number,
  score: PracticeScore,
  tone: Tone = 'sme',
): Promise<TutorReply> {
  const known = [
    question.answerValue,
    question.baseValue,
    value,
    ...(Number.isFinite(score.errorPct) ? [score.errorPct] : []),
    ...collectNumbers([question.base.deal, question.base.a, question.changed.deal, question.changed.a]),
    ...question.workings.flatMap((s) => numbersInText(`${s.formula} ${s.substituted} ${s.result}`)),
  ];
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(question.changed, tone) },
    {
      role: 'user' as const,
      content: buildFeedbackPrompt({
        question: question.prompt,
        learnerDirection: direction,
        learnerValue: value,
        engineDirection: question.answerDirection,
        engineValue: question.answerValue,
        workings: workingsText(question),
        directionCorrect: score.directionCorrect,
        valueCorrect: score.valueCorrect,
      }),
    },
  ];

  return chatOrOffline(messages, question.changed, known, () => {
    const dirLine = score.directionCorrect
      ? `Direction: correct, the ${question.targetLabel} goes ${question.answerDirection}.`
      : `Direction: not quite, the ${question.targetLabel} actually goes ${question.answerDirection}.`;
    const valLine = !Number.isFinite(value)
      ? 'Value: no number was entered.'
      : score.valueCorrect
        ? `Value: ${fmtValue(question, value)} is within 1% of the engine answer ${fmtValue(question, question.answerValue)}.`
        : `Value: ${fmtValue(question, value)} is ${fmt.pct(score.errorPct)} away from the engine answer ${fmtValue(question, question.answerValue)} (you need to be within 1%).`;
    const text = [
      OFFLINE_LABEL,
      '',
      `${dirLine} It moves from ${fmtValue(question, question.baseValue)} to ${fmtValue(question, question.answerValue)}.`,
      valLine,
      `Why: ${reason(question)}.`,
      'Working (from the engine):',
      workingsText(question),
      'Limitation: this is a simplified one-year parity model with illustrative rates, not a market forecast.',
    ].join('\n');
    return { text, known };
  });
}
