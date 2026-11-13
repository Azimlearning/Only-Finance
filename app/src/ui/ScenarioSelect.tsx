import { useApp } from './state'
import { Icon } from './icons'
import {
  SCENARIO_NAME,
  SCENARIO_OPTIONS,
  changesVsBaseline,
  effectLine,
  scenarioWhat,
} from './scenarioCopy'
import type { ScenarioId } from './scenarioCopy'

export interface ScenarioPick {
  value: ScenarioId
  /** Input ids the selected preset changes versus Baseline, mapped to the preset name. */
  changed: Record<string, string>
  select: (id: ScenarioId) => void
}

/** Single source of truth: the active slot's scenario id (state.tsx sets it on loadPreset, and flips it to custom on any input edit). */
export function useScenarioPick(): ScenarioPick {
  const { dispatch, active } = useApp()
  const value: ScenarioId = SCENARIO_OPTIONS.some((o) => o.id === active.id) ? (active.id as ScenarioId) : 'custom'
  const changed: Record<string, string> = {}
  for (const c of changesVsBaseline(value)) if (c.fieldId) changed[c.fieldId] = SCENARIO_NAME[value]
  return {
    value,
    changed,
    select: (id) => {
      if (id === 'custom') dispatch({ type: 'setCustom' })
      else dispatch({ type: 'loadPreset', id })
    },
  }
}

export function ScenarioSelect({ pick }: { pick: ScenarioPick }) {
  const { state } = useApp()
  const { tone } = state
  const { value } = pick
  const changes = changesVsBaseline(value)

  return (
    <section className="surface rounded-2xl p-4" data-tour="scenario">
      <label htmlFor="scenario-select" className="mb-2 block text-[13px] font-medium text-fg-muted">
        Scenario
      </label>
      <div className="control relative rounded-lg bg-surface transition-shadow duration-150 focus-within:shadow-[var(--shadow-focus)]">
        <select
          id="scenario-select"
          data-testid="scenario-select"
          aria-describedby="scenario-explain"
          value={value}
          onChange={(e) => pick.select(e.target.value as ScenarioId)}
          className="min-h-10 w-full appearance-none rounded-lg bg-transparent py-2 pl-3 pr-9 text-[15px] font-medium text-fg outline-none"
        >
          {SCENARIO_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="chevron" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted" />
      </div>

      <div id="scenario-explain" data-testid="scenario-explain" aria-live="polite" className="mt-3 space-y-2 text-sm leading-snug text-fg-2">
        <p>{scenarioWhat(value, tone)}</p>
        {value === 'custom' ? (
          <p className="text-fg-muted">{effectLine(value, tone)}</p>
        ) : (
          <>
            {changes.length > 0 && (
              <div>
                <span className="font-medium text-fg">Changes vs Baseline:</span>
                <ul className="mt-0.5 space-y-0.5 text-fg-2">
                  {changes.map((c) => (
                    <li key={c.label} className="num">
                      {c.label} {c.from} <Icon name="next" size={12} className="mx-0.5 inline align-[-1px] text-fg-subtle" /> {c.to}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              <span className="font-medium text-fg">Effect:</span> <span className="num">{effectLine(value, tone)}</span>
            </p>
          </>
        )}
      </div>
    </section>
  )
}
