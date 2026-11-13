import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { breakEvens, forwardHedge, hedgeComparison, irpForward, moneyMarketHedge, optionHedge } from '../../engine'
import { fmtMYR, fmtRate, fmtSignedMYR, fmtUSD } from '../format'
import { CHART, Card, Pill, Stat, TabPanel, payWord, legendText } from '../kit'
import { useApp } from '../state'
import { useCopy } from '../copy'
import { Explain } from '../Explain'
import { Term } from '../Term'
import { Workings } from '../Workings'

export function HedgingTab() {
  const { active: s } = useApp()
  const c = useCopy()
  const { mode, usdAmount: usd, days, basis, spot } = s.deal
  const { iMY, iUS, stressSpot, optionStrike, optionPremium } = s.a
  const hasQuote = s.a.quotedForward !== undefined

  const r = useMemo(() => {
    const irp = irpForward({ spot, iMY, iUS, days, basis })
    const forward = s.a.quotedForward ?? irp.value.forward
    const comp = hedgeComparison(s)
    const fwd = forwardHedge({ usd, forward, spotAtMaturity: stressSpot })
    const opt = optionHedge({ usd, strike: optionStrike, premium: optionPremium, spotAtMaturity: stressSpot, type: mode === 'importer' ? 'call' : 'put' })
    const mm = moneyMarketHedge({ usd, spot, iMY, iUS, days, basis, mode })
    const be = breakEvens({ forward, strike: optionStrike, premium: optionPremium, mode })
    return { forward, comp, fwd, opt, mm, be }
  }, [s, usd, spot, iMY, iUS, days, basis, stressSpot, optionStrike, optionPremium, mode])

  const { forward, comp, fwd, opt, mm, be } = r
  const verb = payWord(mode)
  const optType = mode === 'importer' ? 'call' : 'put'

  return (
    <TabPanel
      id="hedging"
      title="Should you hedge?"
      intro={c.hedgingIntro(verb, fmtRate(stressSpot))}
    >
      <Card
        testid="card-payoff"
        tour="hedge-chart"
        title={
          <>
            <Term id="payoff">What you {mode === 'importer' ? 'pay' : 'receive'}</Term> at each future rate
          </>
        }
        subtitle={c.payoffSub}
        action={<Explain topic="hedge_payoff" data={{ points: comp.value.points, breakEvens: be.value }} scenario={s} />}
      >
        {usd === 0 ? (
          <div className="grid h-[380px] place-items-center rounded-lg bg-sunken px-6 text-center text-sm text-fg-muted" data-testid="chart-hedge">
            A USD amount of zero has nothing to hedge, so every line sits at RM 0. Enter an amount above zero to see the payoff chart.
          </div>
        ) : (
        <div className="h-[380px]" data-testid="chart-hedge">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comp.value.points} margin={{ top: 20, right: 24, left: 10, bottom: 10 }}>
              <CartesianGrid stroke={CHART.grid} />
              <XAxis
                dataKey="spot"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={CHART.tick}
                tickFormatter={(v) => fmtRate(Number(v))}
                tickLine={false}
                label={{ value: 'Spot rate at payment date (MYR per USD)', position: 'insideBottom', offset: -4, fill: 'var(--fg-muted)', fontSize: 13 }}
              />
              <YAxis tick={CHART.tick} tickFormatter={(v) => fmtMYR(Number(v), 0)} width="auto" domain={['auto', 'auto']} tickLine={false} axisLine={false} />
              <Tooltip {...CHART.tooltip} formatter={(v) => fmtMYR(Number(v))} labelFormatter={(v) => `Spot ${fmtRate(Number(v))}`} />
              <Legend verticalAlign="top" height={36} wrapperStyle={CHART.legend} formatter={legendText} iconType="plainline" />
              <ReferenceLine x={be.value.forwardVsUnhedged} {...CHART.ref} label={{ value: 'Fwd = unhedged', ...CHART.refLabel, position: 'insideTopRight' }} />
              <ReferenceLine x={be.value.optionVsUnhedged} {...CHART.ref} label={{ value: 'Option = unhedged', ...CHART.refLabel, position: 'insideTopLeft', dy: 18 }} />
              <ReferenceLine x={be.value.optionVsForward} {...CHART.ref} label={{ value: 'Option = fwd', ...CHART.refLabel, position: 'insideBottomRight' }} />
              <Line type="linear" dataKey="unhedged" name="Unhedged" stroke={CHART.mute} strokeWidth={2} strokeDasharray="2 4" dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="forward" name="Forward" stroke={CHART.teal} strokeWidth={3} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="option" name={`Option (${optType})`} stroke={CHART.ink} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey="moneyMarket" name="Money market" stroke={CHART.slate} strokeWidth={2} strokeDasharray="7 4" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-3" data-testid="breakevens">
          <Stat label={<Term id="breakEven">Forward = unhedged at</Term>} value={fmtRate(be.value.forwardVsUnhedged)} sub="MYR per USD" />
          <Stat label={<Term id="breakEven">Option = unhedged at</Term>} value={fmtRate(be.value.optionVsUnhedged)} sub="MYR per USD" />
          <Stat label={<Term id="breakEven">Option = forward at</Term>} value={fmtRate(be.value.optionVsForward)} sub="MYR per USD" />
        </div>
        <Workings steps={[...comp.workings, ...be.workings]} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          testid="card-forward"
          title={<Term id="forwardContract">Forward contract</Term>}
          subtitle={c.forwardSub(fmtRate(forward), hasQuote, fmtRate(stressSpot))}
          subtitleClassName="xl:min-h-[4.5rem]"
          action={<Explain topic="forward_hedge" data={fwd.value} scenario={s} />}
        >
          <div className="space-y-4">
            <Stat label={`Hedged: ${verb}`} value={fmtMYR(fwd.value.hedged)} tone="accent" />
            <div className="grid grid-cols-2 gap-4">
              <Stat size="sm" label={<Term id="unhedged">Unhedged</Term>} value={fmtMYR(fwd.value.unhedged)} />
              <Stat size="sm" label="Saving from hedge" value={fmtSignedMYR(fwd.value.saving)} tone={fwd.value.saving > 0 ? 'good' : fwd.value.saving < 0 ? 'bad' : 'default'} />
            </div>
            <div className="num text-sm text-fg-muted">Effective rate {fmtRate(fwd.value.effectiveRate)}</div>
          </div>
          <Workings steps={fwd.workings} />
        </Card>

        <Card
          testid="card-option"
          title={
            <>
              <Term id="option">Currency option</Term> (<Term id={optType}>{optType}</Term>)
            </>
          }
          subtitle={c.optionSub(mode === 'importer', fmtRate(optionStrike), fmtRate(optionPremium))}
          subtitleClassName="xl:min-h-[4.5rem]"
          action={<Explain topic="option_hedge" data={opt.value} scenario={s} />}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Stat label={`With option: ${verb}`} value={fmtMYR(opt.value.effectiveMYR)} tone="accent" />
            </div>
            <Pill tone={opt.value.exercised ? 'teal' : 'slate'}>{opt.value.exercised ? 'Option is used at the stress rate' : 'Option lapses: the market rate is better'}</Pill>
            <div className="grid grid-cols-2 gap-4">
              <Stat size="sm" label={<Term id="unhedged">Unhedged</Term>} value={fmtMYR(opt.value.unhedgedMYR)} />
              <Stat size="sm" label={<Term id="premium">Premium paid</Term>} value={fmtMYR(opt.value.totalPremium)} />
            </div>
            <div className="num text-sm text-fg-muted">Net benefit vs unhedged: {fmtSignedMYR(opt.value.netBenefit)}</div>
          </div>
          <Workings steps={opt.workings} />
        </Card>

        <Card
          testid="card-moneymarket"
          title={<Term id="moneyMarket">Money-market hedge</Term>}
          subtitle={c.moneyMarketSub}
          subtitleClassName="xl:min-h-[4.5rem]"
          action={<Explain topic="money_market_hedge" data={mm.value} scenario={s} />}
        >
          <div className="space-y-4">
            <Stat label={`Money market: ${verb}`} value={fmtMYR(mm.value.myrAtMaturity)} tone="accent" />
            <div className="grid grid-cols-2 gap-4">
              <Stat size="sm" label={<Term id="usdLeg">USD leg</Term>} value={fmtUSD(mm.value.usdLeg)} />
              <Stat size="sm" label={<Term id="usdLeg">MYR leg</Term>} value={fmtMYR(mm.value.myrLeg)} />
            </div>
            <div className="num text-sm text-fg-muted">Implied rate {fmtRate(mm.value.impliedRate)}</div>
            {!hasQuote && (
              <Pill tone="teal">Same as the forward, because no bank quote is entered</Pill>
            )}
          </div>
          <Workings steps={mm.workings} />
        </Card>
      </div>
    </TabPanel>
  )
}
