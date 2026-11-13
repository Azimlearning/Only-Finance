import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fisherReal, ifeExpected, irpForward, parityCheck, pppExpected } from '../../engine'
import type { Mode } from '../../engine'
import { fmtMYR, fmtPct, fmtRate, fmtRatio, fmtSignedMYR, fmtSignedPct } from '../format'
import { Card, Pill, Stat, TabPanel } from '../kit'
import { useApp } from '../state'
import { useCopy } from '../copy'
import { Explain } from '../Explain'
import { SvgTip, Term } from '../Term'
import type { TermId } from '../glossary'
import { Workings } from '../Workings'

type Verdict = 'forwardCheaper' | 'forwardDearer' | 'aligned'

function verdictText(v: Verdict, mode: Mode): { text: ReactNode; tone: 'teal' | 'amber' | 'slate' } {
  if (v === 'aligned')
    return {
      tone: 'slate',
      text: 'The bank forward and the inflation-based forecast agree. Parity holds, so the forward is a fair price and hedging neither wins nor loses on expectation.',
    }
  const fwdCheaper = v === 'forwardCheaper'
  if (mode === 'importer') {
    return fwdCheaper
      ? { tone: 'teal', text: <>Locking in the forward costs <strong>less</strong> ringgit than where inflation differences say the rate is heading. The forward looks like a good deal for someone who has to pay in dollars.</> }
      : { tone: 'amber', text: <>Locking in the forward costs <strong>more</strong> ringgit than where inflation differences say the rate is heading. You would be paying a premium to remove uncertainty.</> }
  }
  return fwdCheaper
    ? { tone: 'amber', text: <>Locking in the forward brings you <strong>less</strong> ringgit than where inflation differences say the rate is heading. You would be giving up some expected ringgit to remove uncertainty.</> }
    : { tone: 'teal', text: <>Locking in the forward brings you <strong>more</strong> ringgit than where inflation differences say the rate is heading. The forward looks like a good deal for someone who is paid in dollars.</> }
}

function Triangle(props: {
  iMY: number
  iUS: number
  piMY: number
  piUS: number
  spot: number
  forward: number
  ratio: number
  realMY: number
  realUS: number
  premium: number
  pppChange: number
}) {
  const node = (cx: number, cy: number, title: string, l1: string, l2: string, term: TermId, lead = false) => (
    <SvgTip id={term}>
      <rect x={cx - 130} y={cy - 46} width={260} height={92} rx={12} fill="var(--surface-raised)" stroke="var(--line-strong)" strokeWidth={1.5} />
      <text x={cx} y={cy - 16} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        {title}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" className="num">
        {l1}
      </text>
      <text x={cx} y={cy + 29} textAnchor="middle" fontSize={15} fontWeight={lead ? 600 : 400} fill={lead ? "var(--accent)" : "var(--fg-muted)"} className="num">
        {l2}
      </text>
    </SvgTip>
  )
  const edge = (x: number, y: number, name: string, value: string, term: TermId) => (
    <SvgTip id={term}>
      <rect x={x - 118} y={y - 30} width={236} height={60} rx={8} fill="var(--surface-sunken)" stroke="var(--line)" strokeWidth={1.5} />
      <text x={x} y={y - 7} textAnchor="middle" fontSize={14} fontWeight={500} fill="var(--fg-muted)">
        {name}
      </text>
      <text x={x} y={y + 16} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)" className="num">
        {value}
      </text>
    </SvgTip>
  )
  const T = { x: 450, y: 70 }
  const L = { x: 150, y: 400 }
  const R = { x: 750, y: 400 }
  const line = (a: { x: number; y: number }, b: { x: number; y: number }) => (
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--chart-ref)" strokeWidth={2} strokeLinecap="round" />
  )
  return (
    <svg viewBox="0 0 900 480" className="mx-auto w-full max-w-[860px]" role="group" aria-label="Parity triangle" data-testid="parity-triangle">
      {line(T, L)}
      {line(T, R)}
      {line(L, R)}
      {edge(300, 235, 'Fisher Effect', `Real: MY ${fmtPct(props.realMY)} | US ${fmtPct(props.realUS)}`, 'fisher')}
      {edge(600, 235, 'IRP / International Fisher', `Fwd premium ${fmtSignedPct(props.premium)}`, 'irp')}
      {edge(450, 400, 'Relative PPP', `Expected change ${fmtSignedPct(props.pppChange)}`, 'ppp')}
      {node(T.x, T.y, 'Interest rate differential', `i MY ${fmtPct(props.iMY)}  vs  i US ${fmtPct(props.iUS)}`, `(1+i MY)/(1+i US) = ${fmtRatio(props.ratio)}`, 'interestRate')}
      {node(L.x, L.y, 'Inflation differential', `π MY ${fmtPct(props.piMY)}`, `π US ${fmtPct(props.piUS)}`, 'inflation')}
      {node(R.x, R.y, 'Exchange-rate movement', `Spot ${fmtRate(props.spot)}`, `Forward ${fmtRate(props.forward)}`, 'spot', true)}
    </svg>
  )
}

export function ParityTab() {
  const { active: s } = useApp()
  const c = useCopy()
  const { spot } = s.deal
  const { iMY, iUS, piMY, piUS } = s.a
  const [approx, setApprox] = useState(false)

  // Parity is shown over a one-year horizon (days omitted in every call) so the three
  // relationships are on the same footing as parityCheck.
  const r = useMemo(() => {
    const irp = irpForward({ spot, iMY, iUS })
    const ppp = pppExpected({ spot, piMY, piUS })
    const realMY = fisherReal({ i: iMY, pi: piMY })
    const realUS = fisherReal({ i: iUS, pi: piUS })
    const ife = ifeExpected({ spot, iMY, iUS })
    const chk = parityCheck({ spot, iMY, iUS, piMY, piUS, usdAmount: s.deal.usdAmount })
    return { irp, ppp, realMY, realUS, ife, chk }
  }, [spot, iMY, iUS, piMY, piUS, s.deal.usdAmount])

  const { irp, ppp, realMY, realUS, ife, chk } = r
  const verdict = verdictText(chk.value.verdict, s.deal.mode)

  return (
    <TabPanel
      id="parity"
      title="Parity check"
      intro={c.parityIntro}
    >
      <Card testid="card-triangle" title={<Term id="parityTriangle">The parity triangle</Term>} subtitle={c.triangleSub}>
        <Triangle
          iMY={iMY}
          iUS={iUS}
          piMY={piMY}
          piUS={piUS}
          spot={spot}
          forward={irp.value.forward}
          ratio={chk.value.ratio}
          realMY={realMY.value.real}
          realUS={realUS.value.real}
          premium={irp.value.premium}
          pppChange={ppp.value.change}
        />
        <div className="mt-2 text-center text-sm text-fg-muted" data-testid="direction-legend">
          <strong className="text-fg">Direction:</strong> higher <Term id="myrPerUsd">MYR per USD</Term> = <strong>weaker ringgit</strong>. All rates are MYR per 1 USD.
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Card
          testid="card-irp"
          tour="irp-card"
          title={<Term id="irp">IRP forward</Term>}
          subtitle={c.irpSub}
          action={<Explain topic="irp_forward" data={irp.value} scenario={s} />}
        >
          <div className="grid grid-cols-2 gap-6">
            <Stat size="xl" label={<Term id="forward">Forward</Term>} value={fmtRate(irp.value.forward)} sub="MYR per USD" tone="accent" />
            <Stat label={<Term id="forwardPremium">Forward premium</Term>} value={fmtSignedPct(irp.value.premium)} sub={irp.value.premium < 0 ? 'USD at a forward discount' : 'USD at a forward premium'} />
          </div>
          <Workings steps={irp.workings} />
        </Card>

        <Card
          testid="card-ppp"
          tour="ppp-card"
          title={<Term id="pppExpected">PPP expected rate</Term>}
          subtitle={c.pppSub}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setApprox((x) => !x)}
                data-testid="ppp-approx-toggle"
                className="rounded-md border border-line-strong px-2.5 py-1 text-xs font-medium text-fg-2 hover:border-fg-subtle hover:text-fg"
              >
                {approx ? 'Approximate' : 'Exact'}
              </button>
              <Explain topic="ppp_expected" data={ppp.value} scenario={s} />
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-6">
            <Stat
              label={approx ? 'Expected (approx.)' : 'Expected (exact)'}
              value={fmtRate(approx ? ppp.value.approx : ppp.value.expected)}
              sub="MYR per USD"
              tone="accent"
            />
            <Stat label="Expected change" value={fmtSignedPct(approx ? ppp.value.approxChange : ppp.value.change)} sub={approx ? 'approximation' : 'exact formula'} />
          </div>
          <Workings steps={ppp.workings} />
        </Card>

      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
        <Card
          testid="card-real"
          title={<Term id="realRate">Real interest rates</Term>}
          subtitle={c.realSub}
          action={<Explain topic="real_rates" data={{ my: realMY.value, us: realUS.value }} scenario={s} />}
        >
          <div className="grid grid-cols-2 gap-6">
            <Stat size="sm" label={<Term id="realRate">Malaysia (real)</Term>} value={fmtPct(realMY.value.real)} sub={`approx. ${fmtPct(realMY.value.approx)}`} />
            <Stat size="sm" label="United States (real)" value={fmtPct(realUS.value.real)} sub={`approx. ${fmtPct(realUS.value.approx)}`} />
          </div>
          <Workings steps={[...realMY.workings, ...realUS.workings]} />
        </Card>

        <Card
          testid="card-ife"
          title={<Term id="ife">IFE expected rate</Term>}
          subtitle={c.ifeSub}
          action={<Explain topic="ife_expected" data={ife.value} scenario={s} />}
        >
          <div className="grid grid-cols-2 gap-6">
            <Stat size="sm" label="Expected spot" value={fmtRate(ife.value.expected)} sub="MYR per USD" tone="accent" />
            <Stat size="sm" label="Expected change" value={fmtSignedPct(ife.value.change)} />
          </div>
          <Workings steps={ife.workings} />
        </Card>
      </div>

      <Card
        testid="card-identity"
        tour="identity-card"
        title={
          <>
            <Term id="parityIdentity">Do the parities agree?</Term>
          </>
        }
        subtitle={
          <>
            <span className="font-mono text-[13px] text-fg-2">Forward ÷ PPP = (1 + r_MY) ÷ (1 + r_US)</span>
            <br />
            {c.identitySub}
          </>
        }
        action={<Explain topic="parity_identity" data={chk.value} scenario={s} />}
      >
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="border-t border-line pt-4">
            <div className="label">Forward ÷ PPP</div>
            <div className="num mt-1 text-4xl font-semibold text-fg" data-testid="identity-left">
              {fmtRatio(chk.value.ratio)}
            </div>
            <div className="num mt-1 text-sm text-fg-muted">
              {fmtRate(chk.value.forward)} ÷ {fmtRate(chk.value.pppExpected)}
            </div>
          </div>
          <div className="text-center text-3xl font-light text-fg-subtle">=</div>
          <div className="border-t border-line pt-4">
            <div className="label">Real-rate ratio (1 + r_MY) ÷ (1 + r_US)</div>
            <div className="num mt-1 text-4xl font-semibold text-fg" data-testid="identity-right">
              {fmtRatio(chk.value.realRatio)}
            </div>
            <div className="num mt-1 text-sm text-fg-muted">
              real MY {fmtPct(chk.value.realMY)} &middot; real US {fmtPct(chk.value.realUS)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Stat label={`Ringgit at forward`} value={fmtMYR(chk.value.myrAtForward)} />
          <Stat label="Ringgit at PPP rate" value={fmtMYR(chk.value.myrAtPPP)} />
          <Stat label={<Term id="ppp">Gap (PPP minus forward)</Term>} value={fmtSignedMYR(chk.value.gapMYR)} tone="accent" />
        </div>

        <div
          data-testid="parity-verdict"
          className={`mt-6 border-l-2 py-1 pl-4 text-[15px] leading-relaxed ${
            verdict.tone === 'teal' ? 'border-accent text-fg' : verdict.tone === 'amber' ? 'border-cost text-fg' : 'border-line-strong text-fg-2'
          }`}
        >
          <div className="mb-1">
            <Pill tone={verdict.tone === 'slate' ? 'slate' : verdict.tone}>{chk.value.verdict === 'forwardCheaper' ? 'Forward cheaper than PPP' : chk.value.verdict === 'forwardDearer' ? 'Forward dearer than PPP' : 'Parity holds'}</Pill>
          </div>
          {verdict.text}
        </div>
        <Workings steps={chk.workings} />
      </Card>
    </TabPanel>
  )
}
