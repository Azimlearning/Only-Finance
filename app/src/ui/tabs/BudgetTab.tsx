import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LIMITATIONS, forecastViews, withSpread } from '../../engine'
import { fmtMYR, fmtPct, fmtRate, fmtSignedMYR } from '../format'
import { CHART, Card, KpiTile, Stat, TabPanel, higherIsGood, payWord, payWordCap } from '../kit'
import { useApp } from '../state'
import { useCopy } from '../copy'
import { Explain } from '../Explain'
import { Term } from '../Term'
import type { TermId } from '../glossary'
import { Workings } from '../Workings'

const ROW_TERM: Record<string, TermId> = { spot: 'spot', forward: 'irp', ppp: 'pppExpected', ife: 'ife', stress: 'stressSpot', user: 'userForecast' }

export function BudgetTab() {
  const { active: s } = useApp()
  const c = useCopy()
  const { mode, usdAmount } = s.deal
  const views = useMemo(() => forecastViews(s), [s])
  const spreadRes = useMemo(
    () => withSpread({ rate: s.deal.spot, spread: s.a.spread, side: mode === 'importer' ? 'buyUSD' : 'sellUSD', usd: usdAmount }),
    [s, mode, usdAmount],
  )
  const good = (v: number) => (higherIsGood(mode) ? v >= 0 : v <= 0)
  const rows = views.value.rows
  const kpi = (['spot', 'forward', 'stress'] as const).map((k) => rows.find((r) => r.key === k)).filter((r): r is (typeof rows)[number] => !!r)
  const chartData = rows.map((r) => ({ name: r.label, vsSpot: r.vsSpot }))

  return (
    <TabPanel
      id="budget"
      title="Your ringgit budget"
      intro={c.budgetIntro(usdAmount.toLocaleString('en-MY'), mode === 'importer' ? 'payment' : 'receipt', s.deal.days, payWord(mode))}
    >
      <Card
        testid="card-forecast-views"
        tour="budget-card"
        title={
          <>
            What {payWord(mode)} under each <Term id="forecastViews">forecast</Term>
          </>
        }
        subtitle={c.budgetForecastSub}
        action={<Explain topic="forecast_views" data={views.value} scenario={s} />}
      >
        <div className="mb-6 grid gap-4 md:grid-cols-3" role="group" aria-label="Headline figures" data-testid="budget-kpis" data-tour="budget-kpis">
          {kpi.map((r) => (
            <KpiTile
              key={r.key}
              label={ROW_TERM[r.key] ? <Term id={ROW_TERM[r.key]}>{r.label}</Term> : r.label}
              value={fmtMYR(r.myr)}
              sub={r.key === 'spot' ? `${fmtRate(r.rate)} MYR per USD` : `${fmtSignedMYR(r.vsSpot)} vs spot`}
              tone={r.key === 'spot' || r.vsSpot === 0 ? 'default' : good(r.vsSpot) ? 'good' : 'bad'}
            />
          ))}
        </div>
        <div className="overflow-x-auto rounded-lg ring-1 ring-fg/[0.07]">
          <table className="w-full text-[15px]">
            <thead className="label bg-sunken text-left">
              <tr>
                <th className="px-4 py-3">
                  <Term id="forecastViews">View</Term>
                </th>
                <th className="px-4 py-3 text-right">
                  Rate (<Term id="myrPerUsd">MYR/USD</Term>)
                </th>
                <th className="px-4 py-3 text-right">{payWordCap(mode)} (MYR)</th>
                <th className="px-4 py-3 text-right">
                  vs <Term id="spot">spot</Term>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {rows.map((r) => (
                <tr key={r.key} className="hover:bg-sunken">
                  <td className="px-4 py-3 font-medium text-fg">{ROW_TERM[r.key] ? <Term id={ROW_TERM[r.key]}>{r.label}</Term> : r.label}</td>
                  <td className="num px-4 py-3 text-right text-fg-2">{fmtRate(r.rate)}</td>
                  <td className="num px-4 py-3 text-right font-semibold text-fg">{fmtMYR(r.myr)}</td>
                  <td className={`num px-4 py-3 text-right font-medium ${r.vsSpot === 0 ? 'text-fg-muted' : good(r.vsSpot) ? 'text-gain' : 'text-loss'}`}>
                    {fmtSignedMYR(r.vsSpot)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
            <div className="text-sm font-medium text-fg-2">
              Difference vs spot, in ringgit (legend holds the colour key)
            </div>
            <div className="flex items-center gap-4 text-[13px] text-fg-2" aria-hidden="true">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-gain" />
                {mode === 'importer' ? 'you pay less' : 'you receive more'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-loss" />
                {mode === 'importer' ? 'you pay more' : 'you receive less'}
              </span>
            </div>
          </div>
          {chartData.every((d) => d.vsSpot === 0) ? (
            <div className="grid h-[300px] place-items-center rounded-lg bg-sunken px-6 text-center text-sm text-fg-muted" data-testid="chart-budget">
              Every view equals spot, so there is no difference to chart. Enter a USD amount above zero or change an assumption.
            </div>
          ) : (
          <div className="h-[300px]" data-testid="chart-budget">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 32, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="name" tick={CHART.tick} interval={0} tickMargin={30} height={60} tickLine={false} axisLine={{ stroke: CHART.axis }} />
                <YAxis tick={CHART.tick} tickFormatter={(v) => fmtMYR(Number(v), 0)} width="auto" tickLine={false} axisLine={false} />
                <Tooltip {...CHART.tooltip} formatter={(v) => fmtSignedMYR(Number(v))} />
                <ReferenceLine y={0} stroke={CHART.zero} />
                <Bar dataKey="vsSpot" name="vs spot" radius={[4, 4, 0, 0]} maxBarSize={72} isAnimationActive={false}>
                  <LabelList
                    dataKey="vsSpot"
                    content={(p) => {
                      const { x, y, width, height, value } = p as { x: number; y: number; width: number; height: number; value: number }
                      if (!Number(value)) return null
                      const top = Math.min(Number(y), Number(y) + Number(height))
                      const bottom = Math.max(Number(y), Number(y) + Number(height))
                      const ly = Number(value) > 0 ? top - 10 : bottom + 18
                      return (
                        <text x={Number(x) + Number(width) / 2} y={ly} textAnchor="middle" fontSize={13} fill="var(--fg-2)" className="num">
                          {fmtSignedMYR(Number(value))}
                        </text>
                      )
                    }}
                  />
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.vsSpot === 0 ? CHART.zero : good(d.vsSpot) ? CHART.teal : CHART.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </div>
        <Workings steps={views.workings} />
      </Card>

      <Card
        testid="card-spread"
        title={
          <>
            What the bank <Term id="spread">spread</Term> costs you
          </>
        }
        subtitle={c.budgetSpreadSub(fmtPct(s.a.spread), mode === 'importer', spreadRes.value.extraMYR === 0)}
        action={<Explain topic="spread_effect" data={spreadRes.value} scenario={s} />}
      >
        <div className="grid grid-cols-3 gap-6">
          <Stat label={<Term id="spot">Spot (mid)</Term>} value={fmtRate(s.deal.spot)} sub="MYR per USD" />
          <Stat label={<Term id="effectiveRate">Effective rate after spread</Term>} value={fmtRate(spreadRes.value.effectiveRate)} sub="MYR per USD" tone="accent" />
          <Stat label={mode === 'importer' ? 'Extra ringgit you pay' : 'Ringgit you give up'} value={fmtMYR(spreadRes.value.extraMYR)} tone={spreadRes.value.extraMYR > 0 ? 'bad' : 'default'} />
        </div>
        <Workings steps={spreadRes.workings} />
      </Card>

      <Card testid="card-limitations" title="What this model cannot tell you" subtitle={c.limitationsSub}>
        <ul className="grid gap-x-12 gap-y-6 md:grid-cols-2">
          {LIMITATIONS.map((l) => (
            <li key={l.title}>
              <div className="text-sm font-medium text-fg">{l.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{l.text}</p>
            </li>
          ))}
        </ul>
      </Card>
    </TabPanel>
  )
}
