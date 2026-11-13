import { useMemo, useState } from 'react'
import { ciaCheck } from '../../engine'
import type { Scenario } from '../../engine'
import { fmtMYR, fmtPct, fmtRate, fmtUSD } from '../format'
import { Card, Pill, Stat, TabPanel } from '../kit'
import { useApp } from '../state'
import { useCopy } from '../copy'
import { Explain } from '../Explain'
import { Term } from '../Term'
import type { TermId } from '../glossary'
import { Workings } from '../Workings'

const DIRECTION_STEPS: Record<string, { title: string; steps: string[] }> = {
  borrowUSD_investMYR: {
    title: 'Borrow USD, invest in MYR',
    steps: [
      'Borrow US dollars today at the US interest rate.',
      'Sell those dollars for ringgit at the spot rate.',
      'Deposit the ringgit at the Malaysian interest rate.',
      'Buy dollars forward at the bank-quoted rate, so the repayment amount is fixed today.',
      'At maturity, use the forward contract to repay the USD loan and keep the leftover ringgit.',
    ],
  },
  borrowMYR_investUSD: {
    title: 'Borrow MYR, invest in USD',
    steps: [
      'Borrow ringgit today at the Malaysian interest rate.',
      'Sell the ringgit for US dollars at the spot rate.',
      'Deposit the dollars at the US interest rate.',
      'Sell the dollars forward at the bank-quoted rate, so the ringgit you get back is fixed today.',
      'At maturity, deliver the dollars into the forward, repay the ringgit loan and keep the leftover ringgit.',
    ],
  },
}

function NumInput({ label, term, value, onChange, unit }: { label: string; term: TermId; value: string; onChange: (t: string) => void; unit?: string }) {
  return (
    <label className="block">
      <span className="label">
        <Term id={term}>{label}</Term>
      </span>
      <div className="field mt-1 flex items-center">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="num w-36 rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
        />
        {unit && <span className="pr-3 text-[13px] text-fg-muted">{unit}</span>}
      </div>
    </label>
  )
}

function ArbitrageInner({ s }: { s: Scenario }) {
  const c = useCopy()
  const [fwdText, setFwdText] = useState(String(s.a.quotedForward ?? 4.4))
  const [spreadText, setSpreadText] = useState(String(+(s.a.spread * 100).toFixed(4)))
  const quoted = Number(fwdText)
  const spreadPct = Number(spreadText)
  const valid = Number.isFinite(quoted) && quoted > 0 && Number.isFinite(spreadPct)
  const res = useMemo(
    () =>
      valid
        ? ciaCheck({
            spot: s.deal.spot,
            quotedForward: quoted,
            iMY: s.a.iMY,
            iUS: s.a.iUS,
            spread: spreadPct / 100,
            notional: s.deal.usdAmount,
          })
        : null,
    [valid, s, quoted, spreadPct],
  )
  const v = res?.value
  const dir = v ? DIRECTION_STEPS[v.direction] : undefined
  const fmtUnit = (n: number) => (v?.unit === 'USD' ? fmtUSD(n, 4) : fmtMYR(n, 4))

  return (
    <>
      <Card title="Test a bank's forward quote" subtitle={c.quoteSub}>
        <div className="flex flex-wrap items-end gap-6">
          <NumInput label="Bank-quoted forward (MYR per USD)" term="quotedForward" value={fwdText} onChange={setFwdText} />
          <NumInput label="Bank spread" term="spread" value={spreadText} onChange={setSpreadText} unit="%" />
          <div className="num text-sm text-fg-muted">
            Spot {fmtRate(s.deal.spot)} &middot; i MY {fmtPct(s.a.iMY)} &middot; i US {fmtPct(s.a.iUS)}
          </div>
        </div>
        <p className="mt-4 text-sm text-fg-muted">{c.quoteHelp}</p>
      </Card>

      {res && v && (
        <Card
          testid="card-cia"
          title={
            <>
              <Term id="cia">Covered interest arbitrage</Term> check
            </>
          }
          subtitle={c.ciaSub}
          action={<Explain topic="arbitrage_cia" data={v} scenario={s} />}
        >
          <div className="grid gap-6 md:grid-cols-4">
            <Stat label={<Term id="irp">Parity (IRP) forward</Term>} value={fmtRate(v.irpForward)} sub="MYR per USD" tone="accent" />
            <Stat label={<Term id="quotedForward">Quoted forward</Term>} value={fmtRate(quoted)} sub="MYR per USD" />
            <Stat label={<Term id="arbitrageProfit">Profit per unit, before spread</Term>} value={fmtUnit(v.profitPerUnitNoSpread)} sub={`per 1 ${v.unit}`} />
            <Stat label={<Term id="arbitrageProfit">Profit per unit, after spread</Term>} value={fmtUnit(v.profitPerUnit)} sub={`per 1 ${v.unit}`} tone={v.profitPerUnit > 0 ? 'good' : 'default'} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-6">
            <Stat label={`Total on ${fmtUSD(s.deal.usdAmount, 0)}`} value={fmtUnit(v.profitTotal)} tone={v.profitTotal > 0 ? 'good' : 'default'} />
            <div data-testid="arbitrage-direction" className="text-[15px] text-fg-2">
              {v.direction === 'none' ? (
                <>
                  <Pill tone="slate">No arbitrage</Pill>
                  <p className="mt-2 max-w-xl">
                    The quoted forward is too close to the parity forward (or the spread eats the gap), so there is nothing to lock in. This is the normal case: banks price forwards from interest rates.
                  </p>
                </>
              ) : (
                <>
                  <Pill tone="teal">Direction: {dir?.title ?? v.direction}</Pill>
                  <p className="mt-2 max-w-xl">
                    The quoted forward ({fmtRate(quoted)}) differs from the parity forward ({fmtRate(v.irpForward)}). {c.arbitrageGap}
                  </p>
                </>
              )}
            </div>
          </div>

          {dir && (
            <ol className="mt-6 space-y-3" data-testid="arbitrage-steps">
              {dir.steps.map((t, i) => (
                <li key={i} className="flex gap-3 text-[15px] text-fg-2">
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-strong text-[13px] font-medium text-fg-muted">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          )}
          <Workings steps={res.workings} />
        </Card>
      )}
      {!valid && <p className="text-sm text-loss">Enter a positive forward rate to run the check.</p>}
    </>
  )
}

export function ArbitrageTab() {
  const { active, state } = useApp()
  const c = useCopy()
  return (
    <TabPanel id="arbitrage" title="Arbitrage check" intro={c.arbitrageIntro}>
      <ArbitrageInner key={`${state.active}-${active.id}`} s={active} />
    </TabPanel>
  )
}
