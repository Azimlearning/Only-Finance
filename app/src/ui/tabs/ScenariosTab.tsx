import { Icon } from '../icons'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { compareScenarios, sensitivity, tornado } from '../../engine'
import type { SensInput } from '../../engine'
import { fmtByHint, fmtPct, fmtRate, fmtSignedPP, fmtSignedRate, fmtSmart } from '../format'
import { CHART, Card, TabPanel, legendText } from '../kit'
import { useApp } from '../state'
import { useCopy } from '../copy'
import { Explain } from '../Explain'
import { Term } from '../Term'
import { Workings } from '../Workings'

const INPUTS: { id: SensInput; label: string; isRate: boolean }[] = [
  { id: 'iMY', label: 'Malaysian interest rate (i MY)', isRate: true },
  { id: 'iUS', label: 'US interest rate (i US)', isRate: true },
  { id: 'piMY', label: 'Malaysian inflation (π MY)', isRate: true },
  { id: 'piUS', label: 'US inflation (π US)', isRate: true },
  { id: 'spot', label: 'Spot rate (MYR per USD)', isRate: false },
]
const shortLabel: Record<SensInput, string> = { iMY: 'i MY', iUS: 'i US', piMY: 'π MY', piUS: 'π US', spot: 'Spot' }
const GRID = 21
const inputLabel: Record<string, string> = { iMY: 'i MY', iUS: 'i US', piMY: 'π MY', piUS: 'π US', spot: 'Spot', spread: 'Spread', usdAmount: 'USD amount', days: 'Days', basis: 'Day basis', stress: 'Stress spot', mode: 'Mode' }

function fmtInputVal(key: string, v: unknown): string {
  if (typeof v !== 'number') return String(v)
  if (/^(a\.)?(iMY|iUS|piMY|piUS|spread)$/.test(key) || /(iMY|iUS|piMY|piUS|spread)$/.test(key)) return fmtPct(v)
  if (/days|basis/i.test(key)) return String(v)
  if (/usd/i.test(key)) return v.toLocaleString('en-MY')
  return fmtSmart(v)
}

function Compare() {
  const { state } = useApp()
  const c = useCopy()
  const A = state.slots.A
  const B = state.slots.B
  const cmp = useMemo(() => compareScenarios(A, B), [A, B])
  const changed = new Set(cmp.value.changedInputs.map((c) => c.key))
  return (
    <Card
      testid="card-compare"
      title={
        <>
          <Term id="scenario">Scenario</Term> A vs Scenario B
        </>
      }
      subtitle={c.compareSub}
      action={<Explain topic="scenario_compare" data={cmp.value} scenario={state.slots[state.active]} />}
    >
      <div className="mb-5 grid grid-cols-2 gap-4">
        {[
          ['A', A.name],
          ['B', B.name],
        ].map(([slot, name]) => (
          <div key={slot} className={`flex items-center gap-3 border-l-2 py-1 pl-4 ${state.active === slot ? 'border-accent' : 'border-line-strong'}`}>
            <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted font-mono text-sm font-medium text-fg-2">{slot}</span>
            <span className="text-lg font-semibold text-fg">{name}</span>
          </div>
        ))}
      </div>

      <h4 className="label mb-2">Inputs that changed</h4>
      {cmp.value.changedInputs.length === 0 ? (
        <p className="mb-5 text-sm text-fg-muted">The two scenarios have identical inputs.</p>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2" data-testid="changed-inputs">
          {cmp.value.changedInputs.map((c) => (
            <div key={c.key} className="rounded-lg bg-cost-tint px-3 py-2 text-sm ring-1 ring-cost-line">
              <span className="font-semibold text-cost-text">{inputLabel[c.key] ?? c.key}</span>
              <span className="num ml-2 text-fg-muted">
                {fmtInputVal(c.key, c.from)} <Icon name="next" size={12} className="inline align-[-1px] text-fg-subtle" /> <strong className="text-fg">{fmtInputVal(c.key, c.to)}</strong>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg ring-1 ring-fg/[0.07]">
        <table className="w-full text-[15px]">
          <thead className="label bg-sunken text-left">
            <tr>
              <th className="px-4 py-3">Output</th>
              <th className="px-4 py-3 text-right">A</th>
              <th className="px-4 py-3 text-right">B</th>
              <th className="px-4 py-3 text-right">Change (B vs A)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {cmp.value.outputs.map((o) => {
              const hint = `${o.key} ${o.label}`
              return (
                <tr key={o.key} className={changed.has(o.key) ? 'bg-cost-tint/50' : 'hover:bg-sunken'}>
                  <td className="px-4 py-3 font-medium text-fg">{o.label}</td>
                  <td className="num px-4 py-3 text-right text-fg-2">{fmtByHint(hint, o.a)}</td>
                  <td className="num px-4 py-3 text-right text-fg-2">{fmtByHint(hint, o.b)}</td>
                  <td className="num px-4 py-3 text-right font-semibold text-fg">{fmtByHint(hint, o.delta, true)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Workings steps={cmp.workings} />
    </Card>
  )
}

function Sensitivity() {
  const { active: s } = useApp()
  const c = useCopy()
  const [input, setInput] = useState<SensInput>('piMY')
  const [width, setWidth] = useState(0.03) // slider position; rates: +/- decimal, spot: +/- MYR
  const meta = INPUTS.find((i) => i.id === input)!
  const base = input === 'spot' ? s.deal.spot : s.a[input]
  const half = meta.isRate ? width : width * 10
  const values = useMemo(() => Array.from({ length: GRID }, (_, k) => base - half + (2 * half * k) / (GRID - 1)), [base, half])
  const res = useMemo(() => sensitivity(s, input, values), [s, input, values])
  const xFmt = (v: number) => (meta.isRate ? fmtPct(v) : fmtRate(v))
  return (
    <Card
      testid="card-sensitivity"
      title={
        <>
          <Term id="sensitivity">Sensitivity</Term>: one input at a time
        </>
      }
      subtitle={c.sensitivitySub}
      action={<Explain topic="sensitivity" data={{ input, points: res.value.points }} scenario={s} />}
    >
      <div className="mb-4 flex flex-wrap items-end gap-6">
        <label className="block">
          <span className="label">Input to vary</span>
          <select
            data-testid="sens-input"
            value={input}
            onChange={(e) => setInput(e.target.value as SensInput)}
            className="field mt-1 block px-3 py-2 text-sm"
          >
            {INPUTS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[260px] flex-1">
          <span className="label flex justify-between">
            <span>Range around current value</span>
            <span className="num text-fg-2">
              {xFmt(values[0])} to {xFmt(values[GRID - 1])}
            </span>
          </span>
          <input
            data-testid="sens-range"
            type="range"
            min={0.005}
            max={0.1}
            step={0.005}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </label>
      </div>
      <div className="h-[320px]" data-testid="chart-sensitivity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={res.value.points} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} />
            <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tick={CHART.tick} tickFormatter={(v) => xFmt(Number(v))} tickLine={false} />
            <YAxis tick={CHART.tick} tickFormatter={(v) => fmtSmart(Number(v))} width="auto" domain={['auto', 'auto']} tickLine={false} axisLine={false} />
            <Tooltip {...CHART.tooltip} formatter={(v) => fmtSmart(Number(v))} labelFormatter={(v) => `${meta.label}: ${xFmt(Number(v))}`} />
            <Legend wrapperStyle={CHART.legend} formatter={legendText} iconType="plainline" />
            <ReferenceLine x={base} stroke={CHART.zero} strokeDasharray="4 4" label={{ value: 'now', ...CHART.axisLabel }} />
            <Line type="monotone" dataKey="forwardMYR" name="Forward (IRP)" stroke={CHART.teal} strokeWidth={3} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="pppMYR" name="PPP expected" stroke={CHART.ppp} strokeWidth={3} strokeDasharray="7 4" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Workings steps={res.workings} />
    </Card>
  )
}

function Tornado() {
  const { active: s } = useApp()
  const c = useCopy()
  const res = useMemo(() => tornado(s), [s])
  const data = res.value.bars.map((b) => ({
    name: `${shortLabel[b.input]} ${b.input === 'spot' ? fmtSignedRate(b.bump) : fmtSignedPP(b.bump)}`,
    forwardDelta: b.forwardDelta,
    pppDelta: b.pppDelta,
  }))
  return (
    <Card
      testid="card-tornado"
      title="Which input moves your answer most?"
      subtitle={c.tornadoSub}
      action={<Explain topic="tornado" data={res.value} scenario={s} />}
    >
      <div className="h-[320px]" data-testid="chart-tornado">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 24, left: 20, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} horizontal={false} />
            <XAxis type="number" tick={CHART.tick} tickFormatter={(v) => fmtSmart(Number(v))} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ ...CHART.tick, fill: 'var(--fg-2)' }} width={110} tickLine={false} axisLine={false} />
            <Tooltip {...CHART.tooltip} formatter={(v) => fmtSignedRate(Number(v))} />
            <Legend wrapperStyle={CHART.legend} formatter={legendText} />
            <ReferenceLine x={0} stroke={CHART.zero} />
            <Bar dataKey="forwardDelta" name="Change in forward" fill={CHART.teal} radius={3} isAnimationActive={false} />
            <Bar dataKey="pppDelta" name="Change in PPP rate" fill={CHART.mute} radius={3} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Workings steps={res.workings} />
    </Card>
  )
}

export function ScenariosTab() {
  const c = useCopy()
  return (
    <TabPanel id="scenarios" title="Compare two what-ifs" intro={c.scenariosIntro}>
      <Compare />
      <Sensitivity />
      <Tornado />
    </TabPanel>
  )
}
