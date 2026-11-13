import { useState } from 'react'
import type { ReactNode } from 'react'
import type { DayBasis, Mode } from '../engine'
import { useApp } from './state'
import { Term, useTip } from './Term'
import { Icon } from './icons'
import type { IconName } from './icons'
import type { TermId } from './glossary'
import { ScenarioSelect, useScenarioPick } from './ScenarioSelect'
import { scenarioNote } from './scenarioCopy'

function NumField({
  label,
  term,
  tour,
  value,
  onChange,
  scale = 1,
  maxDp = 4,
  unit,
  optional = false,
  hint,
  help,
  id,
  changedBy,
}: {
  label: string
  /** Glossary entry explaining the label. */
  term?: TermId
  /** data-tour anchor for the guided tour. */
  tour?: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  scale?: number
  maxDp?: number
  unit?: string
  optional?: boolean
  hint?: string
  /** One-line plain-English explanation shown under the field. */
  help?: string
  id: string
  /** Name of the scenario that changes this field versus Baseline. */
  changedBy?: string
}) {
  const [focus, setFocus] = useState(false)
  const [draft, setDraft] = useState('')
  const shown = value === undefined ? '' : String(+(value * scale).toFixed(maxDp + 2))
  return (
    <label className="relative block" htmlFor={id} data-tour={tour}>
      {changedBy && (
        <>
          <span aria-hidden="true" data-testid={`${id}-changed`} className="absolute -left-2.5 bottom-0 top-0 w-0.5 rounded-full bg-primary-solid" />
          <span id={`${id}-changed`} className="sr-only">changed by {changedBy}</span>
        </>
      )}
      <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-fg">
        <span>{term ? <Term id={term}>{label}</Term> : label}</span>
        {hint && <span className="text-xs font-normal text-fg-muted">{hint}</span>}
      </span>
      <div className="control mt-1 flex items-center rounded-lg bg-surface transition-shadow duration-150 focus-within:shadow-[var(--shadow-focus)]">
        <input
          id={id}
          data-testid={id}
          inputMode="decimal"
          aria-describedby={[help ? `${id}-help` : '', changedBy ? `${id}-changed` : ''].filter(Boolean).join(' ') || undefined}
          className="num min-h-10 w-full rounded-lg bg-transparent px-3 py-2 text-[15px] text-fg outline-none placeholder:text-fg-subtle"
          placeholder={optional ? 'optional' : ''}
          value={focus ? draft : shown}
          onFocus={() => {
            setDraft(shown)
            setFocus(true)
          }}
          onBlur={() => setFocus(false)}
          onChange={(e) => {
            const t = e.target.value
            setDraft(t)
            if (t.trim() === '') {
              if (optional) onChange(undefined)
              return
            }
            const n = Number(t)
            if (Number.isFinite(n)) onChange(n / scale)
          }}
        />
        {unit && <span className="pr-3 text-[13px] text-fg-muted">{unit}</span>}
      </div>
      {help && (
        <span id={`${id}-help`} className="mt-1 block text-xs leading-snug text-fg-muted">
          {help}
        </span>
      )}
    </label>
  )
}

function SegButton({ term, label, active, onClick }: { term?: TermId; label: string; active: boolean; onClick: () => void }) {
  const { triggerProps, bubble } = useTip(term ?? 'importer', { tapToggle: false })
  return (
    <>
      <button
        {...(term ? triggerProps : {})}
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`min-h-9 rounded-md px-3 py-1.5 text-sm font-medium ${
          active ? 'control bg-raised text-accent' : 'text-fg-muted hover:text-fg'
        }`}
      >
        {label}
      </button>
      {term ? bubble : null}
    </>
  )
}

function Seg<T extends string | number>({
  options,
  value,
  onChange,
  testid,
}: {
  options: { value: T; label: string; term?: TermId }[]
  value: T
  onChange: (v: T) => void
  testid?: string
}) {
  return (
    <div data-testid={testid} className="grid grid-flow-col auto-cols-fr rounded-lg bg-muted p-0.5 shadow-[inset_0_1px_2px_var(--hairline-soft)]">
      {options.map((o) => (
        <SegButton key={String(o.value)} term={o.term} label={o.label} active={o.value === value} onClick={() => onChange(o.value)} />
      ))}
    </div>
  )
}

function Section({ title, icon, children, tour, note }: { title: ReactNode; icon?: IconName; children: ReactNode; tour?: string; note?: string }) {
  return (
    <section data-tour={tour} className="surface rounded-2xl p-4">
      <h3 className="flex items-center gap-2 text-[13px] font-medium text-fg-muted">
        {icon && <Icon name={icon} size={16} className="text-fg-subtle" />}
        {title}
      </h3>
      {note ? <p className="mt-1 text-xs text-fg-subtle" data-testid="illustrative-badge">{note}</p> : null}
      <div className="mb-4" />
      <div className="space-y-3.5">{children}</div>
    </section>
  )
}

function SubHead({ children, icon }: { children: ReactNode; icon?: IconName }) {
  return (
    <div className="flex items-center gap-2 pt-2 text-[13px] font-semibold text-accent first:pt-0">
      {icon && <Icon name={icon} size={14} />}
      <span>{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </div>
  )
}

export function Sidebar() {
  const { state, dispatch, active } = useApp()
  const { deal, a } = active
  const pick = useScenarioPick()
  const setDeal = (patch: Partial<typeof deal>) => dispatch({ type: 'setDeal', patch })
  const setA = (patch: Partial<typeof a>) => dispatch({ type: 'setAssumptions', patch })

  return (
    <div className="space-y-4">
      <ScenarioSelect pick={pick} />

      <Section title={`Your deal · Scenario ${state.active}`} icon="invoice" tour="deal">
        <Seg<Mode>
          testid="mode-toggle"
          value={deal.mode}
          onChange={(mode) => setDeal({ mode })}
          options={[
            { value: 'importer', label: 'Importer', term: 'importer' },
            { value: 'exporter', label: 'Exporter', term: 'exporter' },
          ]}
        />
        <NumField id="in-usd" changedBy={pick.changed['in-usd']} label="USD amount" term="usdAmount" unit="USD" help="Size of the payment or receipt." maxDp={2} value={deal.usdAmount} onChange={(v) => v !== undefined && setDeal({ usdAmount: v })} />
        <div className="grid grid-cols-2 gap-3">
          <NumField id="in-days" changedBy={pick.changed['in-days']} label="Days to payment" term="tenor" unit="days" maxDp={0} value={deal.days} onChange={(v) => v !== undefined && setDeal({ days: v })} />
          <div>
            <div className="text-sm font-medium text-fg">
              <Term id="dayBasis">Day basis</Term>
            </div>
            <div className="mt-1">
              <Seg<DayBasis>
                testid="basis-toggle"
                value={deal.basis}
                onChange={(basis) => setDeal({ basis })}
                options={[
                  { value: 365, label: '365' },
                  { value: 360, label: '360' },
                ]}
              />
            </div>
          </div>
        </div>
        <NumField id="in-spot" changedBy={pick.changed['in-spot']} label="Spot" term="spot" hint="MYR per 1 USD" help="Today's price of one US dollar in ringgit." maxDp={4} value={deal.spot} onChange={(v) => v !== undefined && setDeal({ spot: v })} />
      </Section>

      <Section title="Your assumptions" icon="assumptions" tour="assumptions" note={scenarioNote(state.tone)}>
        <SubHead icon="interestRate"><Term id="interestRate">Interest rates</Term> (per year)</SubHead>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="in-iMY" changedBy={pick.changed['in-iMY']} label="i MY" term="iMY" unit="%" maxDp={3} scale={100} value={a.iMY} onChange={(v) => v !== undefined && setA({ iMY: v })} />
          <NumField id="in-iUS" changedBy={pick.changed['in-iUS']} label="i US" term="iUS" unit="%" maxDp={3} scale={100} value={a.iUS} onChange={(v) => v !== undefined && setA({ iUS: v })} />
        </div>
        <SubHead icon="inflation"><Term id="inflation">Inflation</Term> (per year)</SubHead>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="in-piMY" changedBy={pick.changed['in-piMY']} label="Inflation MY" term="inflation" tour="piMY" unit="%" maxDp={3} scale={100} value={a.piMY} onChange={(v) => v !== undefined && setA({ piMY: v })} />
          <NumField id="in-piUS" changedBy={pick.changed['in-piUS']} label="Inflation US" term="inflation" unit="%" maxDp={3} scale={100} value={a.piUS} onChange={(v) => v !== undefined && setA({ piUS: v })} />
        </div>
        <SubHead icon="exchangeRate"><Term id="forecastViews">Rate views</Term> (<Term id="myrPerUsd">MYR per USD</Term>)</SubHead>
        <NumField id="in-stress" changedBy={pick.changed['in-stress']} label="Stress spot" term="stressSpot" hint="MYR per USD" help="A bad-day rate to test your budget against." maxDp={4} value={a.stressSpot} onChange={(v) => v !== undefined && setA({ stressSpot: v })} />
        <NumField id="in-user" changedBy={pick.changed['in-user']} label="Your own forecast" term="userForecast" optional hint="MYR per USD" maxDp={4} value={a.userForecast} onChange={(v) => setA({ userForecast: v })} />
        <NumField id="in-qfwd" changedBy={pick.changed['in-qfwd']} label="Bank-quoted forward" term="quotedForward" optional hint="MYR per USD" help="Leave blank to use the IRP forward." maxDp={4} value={a.quotedForward} onChange={(v) => setA({ quotedForward: v })} />
        <SubHead icon="hedging"><Term id="hedge">Hedge</Term> and bank terms</SubHead>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="in-strike" changedBy={pick.changed['in-strike']} label="Option strike" term="strike" hint="MYR/USD" maxDp={4} value={a.optionStrike} onChange={(v) => v !== undefined && setA({ optionStrike: v })} />
          <NumField id="in-premium" changedBy={pick.changed['in-premium']} label="Option premium" term="premium" hint="MYR/USD" maxDp={4} value={a.optionPremium} onChange={(v) => v !== undefined && setA({ optionPremium: v })} />
        </div>
        <NumField id="in-spread" changedBy={pick.changed['in-spread']} label="Bank spread" term="spread" unit="%" maxDp={3} scale={100} value={a.spread} onChange={(v) => v !== undefined && setA({ spread: v })} />
      </Section>
    </div>
  )
}
