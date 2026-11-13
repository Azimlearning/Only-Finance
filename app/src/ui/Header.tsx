import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useApp, TABS } from './state'
import type { Slot, TabId, Tone } from './state'
import { TONE_TOAST } from './copy'
import { Icon } from './icons'
import type { IconName } from './icons'
import { Logo } from './Logo'
import { SEG_WRAP, segBtn } from './kit'
import { Term, closeTip, useTip } from './Term'
import { ThemeToggle } from './ThemeToggle'
import type { TermId } from './glossary'

const TAB_TERM: Record<TabId, TermId> = {
  budget: 'tabBudget',
  parity: 'tabParity',
  scenarios: 'tabScenarios',
  hedging: 'tabHedging',
  arbitrage: 'tabArbitrage',
  verify: 'tabVerify',
  practice: 'tabPractice',
}

export function Header() {
  const { state, dispatch } = useApp()
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const headerRef = useRef<HTMLElement>(null)
  // Publish the real header height so sticky offsets never rely on a magic number.
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])
  const chooseTone = (t: Tone) => {
    if (t === state.tone) return
    dispatch({ type: 'setTone', tone: t })
    window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), text: TONE_TOAST[t] })
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }
  return (
    <header ref={headerRef} className="sticky top-0 z-30 bg-surface shadow-[0_1px_0_var(--hairline)]">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="text-fg">
            <Logo variant="full" size={30} />
            <div className="mt-0.5 text-[13px] font-normal text-fg-subtle">Only the finance you need before you pay in dollars.</div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2" data-testid="slot-switch">
            <span className="label">
              <Term id="scenario">Scenario</Term>
            </span>
            <div className={`flex ${SEG_WRAP}`}>
              {(['A', 'B'] as Slot[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => dispatch({ type: 'setSlot', slot: s })}
                  title={state.slots[s].name}
                  className={segBtn(state.active === s)}
                >
                  {s}
                  <span className="ml-1.5 hidden text-xs font-normal opacity-80 xl:inline">{state.slots[s].name}</span>
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Explanation style" data-testid="tone-switch" data-tour="tone" className={`flex ${SEG_WRAP}`}>
            {([
              ['sme', 'SME owner'],
              ['student', 'Student'],
            ] as [Tone, string][]).map(([t, l]) => (
              <button
                key={t}
                type="button"
                aria-pressed={state.tone === t}
                data-testid={`tone-${t}`}
                onClick={() => chooseTone(t)}
                className={segBtn(state.tone === t)}
              >
                {l}
              </button>
            ))}
          </div>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => dispatch({ type: 'tour', step: 0 })}
            data-testid="tour-start"
            className="control rounded-lg bg-surface px-4 py-2.5 text-sm font-medium text-fg-2 hover:text-fg"
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name="tour" size={16} className="text-fg-subtle" />
              Guided tour
            </span>
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'setTutor', open: true })}
            data-testid="tutor-open"
            data-tour="tutor"
            className="rounded-lg bg-primary-solid px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-accent"
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name="tutor" size={16} />
              Ask the tutor
            </span>
          </button>
        </div>
      </div>
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          data-testid="tone-toast"
          className="toast-enter surface-overlay pointer-events-none fixed right-6 top-[calc(var(--header-h)+0.75rem)] z-[70] flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-fg"
        >
          <Icon name="verified" size={16} className="text-accent" />
          {toast.text}
        </div>
      )}
    </header>
  )
}

const TAB_ICON: Record<TabId, IconName> = {
  budget: 'budget',
  parity: 'parity',
  scenarios: 'scenarios',
  hedging: 'hedging',
  arbitrage: 'arbitrage',
  verify: 'verify',
  practice: 'practice',
}

function TabButton({ id, label, selected, onSelect }: { id: TabId; label: string; selected: boolean; onSelect: () => void }) {
  // Tooltip says what the tab helps you decide. Click still just switches tab (tapToggle off).
  const { triggerProps, bubble } = useTip(TAB_TERM[id], { tapToggle: false })
  return (
    <>
      <button
        {...triggerProps}
        role="tab"
        aria-selected={selected}
        data-testid={`tabbtn-${id}`}
        data-tour={`tab-${id}`}
        type="button"
        onClick={() => {
          closeTip()
          onSelect()
        }}
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-[15px] font-medium ${
          selected ? 'text-accent' : 'text-fg-muted hover:text-fg'
        }`}
      >
        <Icon name={TAB_ICON[id]} size={16} className={selected ? '' : 'text-fg-subtle'} />
        {label}
      </button>
      {bubble}
    </>
  )
}

export function TabBar() {
  const { state, dispatch } = useApp()
  const navRef = useRef<HTMLElement>(null)
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null)

  // Measure the active tab so one underline can slide between tabs (transform only).
  const measure = () => {
    const el = navRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (el) setBar({ x: el.offsetLeft, w: el.offsetWidth })
  }
  useLayoutEffect(measure, [state.tab])
  useEffect(() => {
    window.addEventListener('resize', measure)
    void document.fonts?.ready.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <nav ref={navRef} role="tablist" className="relative mb-8 flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--hairline)]">
      {TABS.map((t) => (
        <TabButton key={t.id} id={t.id} label={t.label} selected={state.tab === t.id} onSelect={() => dispatch({ type: 'setTab', tab: t.id })} />
      ))}
      {bar && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-px origin-left rounded-full bg-primary-solid [transition:transform_240ms_var(--ease-in-out)] motion-reduce:transition-none"
          style={{ transform: `translateX(${bar.x}px) scaleX(${bar.w})` }}
        />
      )}
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1800px] px-6 pb-10 pt-4 text-center">
      <p className="text-sm font-medium text-fg-2" data-testid="footer-illustrative">Educational tool. Illustrative rates, not market data. Not financial advice.</p>
      <p className="mt-1 text-[13px] text-fg-muted">
        Sources: Lecturer&apos;s W05&ndash;06 workbook &middot; Week 10 study guide &middot; BNM FEP (Foreign Exchange Policy)
      </p>
    </footer>
  )
}
