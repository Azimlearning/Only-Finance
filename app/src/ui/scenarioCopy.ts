// Copy and display helpers for the sidebar Scenario selector.
// No finance maths here: every number comes from the engine (parityCheck) or the preset itself.
import { getPreset, parityCheck } from '../engine'
import type { Assumptions, Deal, Scenario } from '../engine'
import { fmtNum, fmtRate } from './format'
import type { Tone } from './state'

export type ScenarioId = 'baseline' | 'inflationShock' | 'rateGap' | 'week10' | 'custom'

export const SCENARIO_OPTIONS: { id: ScenarioId; label: string }[] = [
  { id: 'baseline', label: 'Baseline' },
  { id: 'inflationShock', label: 'Inflation shock' },
  { id: 'rateGap', label: 'Rate gap' },
  { id: 'week10', label: 'Week 10 example' },
  { id: 'custom', label: 'Custom (your own numbers)' },
]

export const SCENARIO_NAME: Record<ScenarioId, string> = {
  baseline: 'Baseline',
  inflationShock: 'Inflation shock',
  rateGap: 'Rate gap',
  week10: 'Week 10 example',
  custom: 'Custom',
}

const WHAT: Record<ScenarioId, { sme: string; student: string }> = {
  baseline: {
    sme: 'A neutral starting point to compare the three views of the future rate side by side.',
    student: 'Reference case for comparing the IRP forward, the PPP expected spot and the Fisher view.',
  },
  inflationShock: {
    sme: 'Malaysian prices rise faster than before, so the ringgit is expected to weaken.',
    student: 'Higher Malaysian inflation raises the PPP expected spot and leaves the IRP forward unchanged.',
  },
  rateGap: {
    sme: 'US interest rates sit further above Malaysian rates, which makes the bank forward cheaper.',
    student: 'A wider US-over-Malaysia interest differential lowers the IRP forward.',
  },
  week10: {
    sme: 'The Week 10 lecture numbers: a USD 200,000 payment to hedge or leave open.',
    student: 'Week 10 lecture inputs: the hedging choice between forward, option and no hedge on USD 200,000.',
  },
  custom: {
    sme: 'Your inputs, not one of the examples.',
    student: 'Your inputs, not one of the preset examples.',
  },
}

export function scenarioWhat(id: ScenarioId, tone: Tone): string {
  return tone === 'student' ? WHAT[id].student : WHAT[id].sme
}

export function scenarioNote(tone: Tone): string {
  return tone === 'student' ? 'Illustrative rates, not current market data.' : 'Example rates for learning, not today’s market.'
}

// ---- Which inputs a preset changes versus Baseline ----------------------

type DealKey = keyof Deal
type AKey = keyof Assumptions

export interface Change {
  /** Sidebar input id, or undefined when the field has no NumField (day basis). */
  fieldId?: string
  label: string
  from: string
  to: string
}

const pct = (x: number | undefined) => (x === undefined ? 'not set' : `${+(x * 100).toFixed(3)}%`)
const rate = (x: number | undefined) => (x === undefined ? 'not set' : fmtRate(x))

const DEAL_FIELDS: Record<DealKey, { id?: string; label: string; fmt: (v: never) => string }> = {
  mode: { label: 'Mode', fmt: ((v: string) => v) as (v: never) => string },
  usdAmount: { id: 'in-usd', label: 'USD amount', fmt: ((v: number) => `USD ${fmtNum(v, 0)}`) as (v: never) => string },
  days: { id: 'in-days', label: 'Days to payment', fmt: ((v: number) => `${v} days`) as (v: never) => string },
  basis: { label: 'Day basis', fmt: ((v: number) => String(v)) as (v: never) => string },
  spot: { id: 'in-spot', label: 'Spot', fmt: ((v: number) => fmtRate(v)) as (v: never) => string },
}

const A_FIELDS: Record<AKey, { id: string; label: string; fmt: (v: number | undefined) => string }> = {
  iMY: { id: 'in-iMY', label: 'Interest rate MY', fmt: pct },
  iUS: { id: 'in-iUS', label: 'Interest rate US', fmt: pct },
  piMY: { id: 'in-piMY', label: 'Inflation MY', fmt: pct },
  piUS: { id: 'in-piUS', label: 'Inflation US', fmt: pct },
  stressSpot: { id: 'in-stress', label: 'Stress spot', fmt: rate },
  userForecast: { id: 'in-user', label: 'Your own forecast', fmt: rate },
  quotedForward: { id: 'in-qfwd', label: 'Bank-quoted forward', fmt: rate },
  optionStrike: { id: 'in-strike', label: 'Option strike', fmt: rate },
  optionPremium: { id: 'in-premium', label: 'Option premium', fmt: rate },
  spread: { id: 'in-spread', label: 'Bank spread', fmt: pct },
}

/** Inputs where `s` differs from `ref`, formatted with units. */
export function diffInputs(s: Scenario, ref: Scenario): Change[] {
  const out: Change[] = []
  for (const k of Object.keys(DEAL_FIELDS) as DealKey[]) {
    if (s.deal[k] === ref.deal[k]) continue
    const f = DEAL_FIELDS[k]
    out.push({ fieldId: f.id, label: f.label, from: f.fmt(ref.deal[k] as never), to: f.fmt(s.deal[k] as never) })
  }
  for (const k of Object.keys(A_FIELDS) as AKey[]) {
    if (s.a[k] === ref.a[k]) continue
    const f = A_FIELDS[k]
    out.push({ fieldId: f.id, label: f.label, from: f.fmt(ref.a[k]), to: f.fmt(s.a[k]) })
  }
  return out
}

export function changesVsBaseline(id: ScenarioId): Change[] {
  if (id === 'baseline' || id === 'custom') return []
  return diffInputs(getPreset(id), getPreset('baseline'))
}

/** True when the slot's inputs equal the preset's inputs. */
export function sameInputs(a: Scenario, b: Scenario): boolean {
  return diffInputs(a, b).length === 0
}

export function matchPreset(cur: Scenario): ScenarioId | null {
  for (const o of SCENARIO_OPTIONS) {
    if (o.id === 'custom') continue
    if (sameInputs(cur, getPreset(o.id))) return o.id
  }
  return null
}

// ---- Effect line, built from engine outputs -------------------------------

function parity(s: Scenario) {
  const r = parityCheck({ spot: s.deal.spot, iMY: s.a.iMY, iUS: s.a.iUS, piMY: s.a.piMY, piUS: s.a.piUS, usdAmount: s.deal.usdAmount })
  return { forward: r.value.forward, ppp: r.value.pppExpected }
}

export function effectLine(id: ScenarioId, tone: Tone): string {
  if (id === 'custom') return 'Your own numbers — change any field; results update live.'
  const pppName = tone === 'student' ? 'PPP expected spot' : 'PPP expected rate'
  const fwdName = tone === 'student' ? 'IRP forward' : 'forward'
  const base = parity(getPreset('baseline'))
  if (id === 'baseline') {
    return `${pppName} ${fmtRate(base.ppp)}; ${fwdName} ${fmtRate(base.forward)} (MYR per 1 USD).`
  }
  const cur = parity(getPreset(id))
  const moved: string[] = []
  const same: string[] = []
  const add = (name: string, a: number, b: number) =>
    fmtRate(a) === fmtRate(b) ? same.push(`${name} unchanged at ${fmtRate(b)}`) : moved.push(`${name} ${fmtRate(a)} → ${fmtRate(b)}`)
  add(pppName, base.ppp, cur.ppp)
  add(fwdName, base.forward, cur.forward)
  const parts = [...moved, ...same]
  const text = parts.join('; ')
  return text.charAt(0).toUpperCase() + text.slice(1) + '.'
}
