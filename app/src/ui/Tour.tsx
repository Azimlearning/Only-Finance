import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from './icons'
import { useApp } from './state'
import type { TabId, Tone } from './state'

/* ---------------------------------------------------------------------------------------------
 * Guided tour, built for activation rather than a feature walk-through.
 *  - One goal: reach the aha moment in six steps. "Raise Malaysian inflation: the expected rate
 *    moves, the bank forward does not. That gap is why hedging matters."
 *  - Do, don't show: step 2 is interactive and advances by itself when the user makes the change.
 *  - Every step spotlights the real element (data-tour="..."), scrolls it into view and anchors a
 *    popover beside it, flipping to stay on screen. The page behind stays usable and the tour is
 *    dismissable at any point (Skip, Close, Escape).
 *  - Progress is always visible ("Step 3 of 6"). Copy follows the SME owner / Student switch.
 *  - Motion is transform and opacity only, and is dropped under prefers-reduced-motion.
 * ------------------------------------------------------------------------------------------- */

const SEEN_KEY = 'of_tour_seen'
const TARGET_PI = 0.04

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}
function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* storage blocked: the welcome prompt may reappear, nothing else breaks */
  }
}

type Place = 'right' | 'left' | 'bottom' | 'top'
type Both = Record<Tone, string>

interface StepDef {
  tab: TabId
  /** data-tour values; the spotlight covers their union. */
  targets: string[]
  prefer: Place[]
  title: Both
  body: Both
  /** Step 2: the user changes Inflation MY to 4% and the tour moves on by itself. */
  interactive?: boolean
}

const STEPS: StepDef[] = [
  {
    tab: 'budget',
    targets: ['scenario', 'deal'],
    prefer: ['right'],
    title: { sme: 'This is your dollar deal', student: 'Your deal: the exposure' },
    body: {
      sme: 'Pick an example scenario, then check the deal: are you buying or selling dollars, how many, and when do you pay? We loaded an example so you can start right away. Every rate here is made up for teaching.',
      student: 'Importer or exporter, USD amount, tenor and spot define the exposure. A stored scenario is loaded (Baseline), and all rates are illustrative.',
    },
  },
  {
    tab: 'budget',
    targets: ['piMY'],
    prefer: ['right'],
    interactive: true,
    title: { sme: 'Try it: set Inflation MY to 4%', student: 'Try it: set Inflation MY (π MY) to 4%' },
    body: {
      sme: 'Imagine prices in Malaysia start rising faster. Type 4 in the highlighted box and watch what changes next. The scenario switches to Custom, because you changed a number.',
      student: 'Raise the Malaysian inflation rate and see which parity relationship reacts. Type 4 in the highlighted box. The scenario becomes Custom once an input is edited.',
    },
  },
  {
    tab: 'parity',
    targets: ['irp-card', 'ppp-card'],
    prefer: ['bottom', 'top'],
    title: { sme: 'One number moved, one did not', student: 'IRP unchanged, PPP moved' },
    body: {
      sme: 'The bank forward (first card) is set by interest rates, so it stayed put. The inflation-based expected rate (second card) moved: the ringgit is now expected to buy less dollar.',
      student: 'The IRP forward depends on interest rates only, so it is unchanged. Relative PPP uses the inflation differential, so the expected spot moved.',
    },
  },
  {
    tab: 'parity',
    targets: ['identity-card'],
    prefer: ['top', 'bottom'],
    title: { sme: 'The gap is why hedging matters', student: 'The gap is the hedging question' },
    body: {
      sme: 'The two forecasts now disagree. That gap, in ringgit, is what is at stake when you decide whether to lock a rate today or wait.',
      student: 'Forward ÷ PPP no longer equals 1. The gap in MYR is the value at stake in choosing to hedge (lock F) or stay exposed (accept S_T).',
    },
  },
  {
    tab: 'hedging',
    targets: ['hedge-chart'],
    prefer: ['bottom', 'top'],
    title: { sme: 'Now compare your choices', student: 'Compare the hedging strategies' },
    body: {
      sme: 'Flat lines are protected: you know your ringgit cost today. The sloped line is doing nothing, so it moves with the market. Where lines cross, two choices cost the same.',
      student: 'Flat segments are fixed by the hedge; the unhedged line is linear in S_T. Crossings are the break-even rates between strategies.',
    },
  },
  {
    tab: 'hedging',
    targets: ['tutor', 'tone'],
    prefer: ['bottom'],
    title: { sme: 'Stuck? Ask the tutor', student: 'Use the tutor for any step' },
    body: {
      sme: 'The AI tutor explains any number in plain words, and every figure it quotes is checked against the calculator. The SME owner / Student switch changes how explanations are worded.',
      student: 'The tutor explains any result, and each figure it quotes is verified against the engine. The SME owner / Student switch sets the level of terminology.',
    },
  },
]

const LAST = STEPS.length - 1
const INFL_STEP = STEPS.findIndex((s) => s.interactive)

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))
const sel = (id: string) => `[data-tour="${id}"]`

function useTargetRect(targets: string[], active: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)
  const key = targets.join('|')
  useEffect(() => {
    if (!active) {
      setRect(null)
      return
    }
    const measure = () => {
      let l = Infinity
      let t = Infinity
      let r = -Infinity
      let b = -Infinity
      for (const id of key.split('|')) {
        const el = document.querySelector(sel(id))
        if (!el) continue
        const bb = el.getBoundingClientRect()
        if (bb.width === 0 && bb.height === 0) continue
        l = Math.min(l, bb.left)
        t = Math.min(t, bb.top)
        r = Math.max(r, bb.right)
        b = Math.max(b, bb.bottom)
      }
      const next = Number.isFinite(l) ? { x: l, y: t, w: r - l, h: b - t } : null
      setRect((p) => (p && next && p.x === next.x && p.y === next.y && p.w === next.w && p.h === next.h ? p : next))
    }
    measure()
    const iv = window.setInterval(measure, 100)
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.clearInterval(iv)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [key, active])
  return rect
}

/** Anchor the popover beside the spotlight; first preferred side that fits, else a viewport corner. */
function placePopover(rect: Rect | null, pw: number, ph: number, prefer: Place[]): { x: number; y: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const m = 16
  const gap = 18
  if (!rect) return { x: (vw - pw) / 2, y: (vh - ph) / 2 }
  const hole = { x: rect.x - 8, y: rect.y - 8, w: rect.w + 16, h: rect.h + 16 }
  const cand = (p: Place) => {
    switch (p) {
      case 'right':
        return { x: hole.x + hole.w + gap, y: clamp(hole.y + hole.h / 2 - ph / 2, m, vh - ph - m) }
      case 'left':
        return { x: hole.x - gap - pw, y: clamp(hole.y + hole.h / 2 - ph / 2, m, vh - ph - m) }
      case 'bottom':
        return { x: clamp(hole.x + hole.w / 2 - pw / 2, m, vw - pw - m), y: hole.y + hole.h + gap }
      case 'top':
        return { x: clamp(hole.x + hole.w / 2 - pw / 2, m, vw - pw - m), y: hole.y - gap - ph }
    }
  }
  const order: Place[] = [...prefer, 'right', 'bottom', 'top', 'left']
  for (const p of order) {
    const c = cand(p)
    if (c.x >= m && c.y >= m && c.x + pw <= vw - m && c.y + ph <= vh - m) return c
  }
  // Nothing fits beside it (a very tall target): tuck into the bottom-right corner of the screen.
  return { x: vw - pw - m, y: vh - ph - m }
}

function Welcome({ tone, onStart, onSkip }: { tone: Tone; onStart: () => void; onSkip: () => void }) {
  const startRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  useEffect(() => {
    startRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])
  return (
    <div className="tour-fade fixed inset-0 z-[65] grid place-items-center bg-scrim p-6" data-testid="tour-welcome">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="surface-overlay w-full max-w-md rounded-2xl p-7">
        <div className="text-xs font-medium text-fg-muted">Welcome</div>
        <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-fg">
          See how inflation reaches your ringgit budget
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
          {tone === 'sme'
            ? 'In about a minute you will change one number and watch what happens to the dollar price, and why locking a rate can protect you. No finance background needed.'
            : 'In about a minute you will change one input, see how IRP and PPP respond differently, and why that gap frames the hedging decision.'}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onSkip} className="rounded-lg px-4 py-2.5 text-sm font-medium text-fg-muted hover:bg-muted hover:text-fg">
            Skip
          </button>
          <button
            ref={startRef}
            type="button"
            onClick={onStart}
            data-testid="tour-welcome-start"
            className="rounded-lg bg-primary-solid px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-accent"
          >
            Take the 1-minute tour
          </button>
        </div>
      </div>
    </div>
  )
}

export function Tour() {
  const { state, dispatch, active } = useApp()
  const step = state.tourStep
  const running = step !== null
  const tone = state.tone
  const [welcome, setWelcome] = useState(false)
  const opener = useRef<Element | null>(null)

  // Welcome prompt: first visit only.
  useEffect(() => {
    if (readSeen()) return
    const t = window.setTimeout(() => setWelcome(true), 500)
    return () => window.clearTimeout(t)
  }, [])
  useEffect(() => {
    if (running) {
      setWelcome(false)
      markSeen()
    }
  }, [running])

  const start = useCallback(() => {
    markSeen()
    setWelcome(false)
    dispatch({ type: 'tour', step: 0 })
  }, [dispatch])
  const skipWelcome = useCallback(() => {
    markSeen()
    setWelcome(false)
  }, [])
  const close = useCallback(() => {
    dispatch({ type: 'tour', step: null })
    const o = opener.current
    opener.current = null
    if (o instanceof HTMLElement) o.focus({ preventScroll: true })
  }, [dispatch])

  if (!running && welcome) return <Welcome tone={tone} onStart={start} onSkip={skipWelcome} />
  if (!running) return null
  return <TourRun step={step} tone={tone} opener={opener} close={close} dispatchStep={(n) => dispatch({ type: 'tour', step: n })} piMY={active.a.piMY} setPi={() => dispatch({ type: 'setAssumptions', patch: { piMY: TARGET_PI } })} setTab={(tab) => dispatch({ type: 'setTab', tab })} currentTab={state.tab} />
}

function TourRun(props: {
  step: number
  tone: Tone
  opener: { current: Element | null }
  close: () => void
  dispatchStep: (n: number) => void
  piMY: number
  setPi: () => void
  setTab: (t: TabId) => void
  currentTab: TabId
}) {
  const { step, tone, opener, close, dispatchStep, piMY, setPi, setTab, currentTab } = props
  const def = STEPS[Math.min(step, LAST)]
  const titleId = useId()
  const bodyId = useId()
  const popRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [glide, setGlide] = useState(false)
  const rect = useTargetRect(def.targets, true)

  // Remember what had focus so Close/Escape can give it back.
  useEffect(() => {
    if (!opener.current) opener.current = document.activeElement
  }, [opener])

  // Each step lives on a tab: switch to it.
  useEffect(() => {
    if (currentTab !== def.tab) setTab(def.tab)
  }, [step, def.tab, currentTab, setTab])

  // Bring the real element into view (the tab may need a moment to render), then move focus.
  useEffect(() => {
    let tries = 0
    let timer = 0
    const go = () => {
      const el = def.targets.map((t) => document.querySelector<HTMLElement>(sel(t))).find((e): e is HTMLElement => !!e)
      if (!el) {
        if (tries++ < 20) timer = window.setTimeout(go, 60)
        return
      }
      const tall = el.getBoundingClientRect().height > window.innerHeight * 0.7
      el.style.scrollMarginTop = '104px'
      el.scrollIntoView({ block: tall ? 'start' : 'center', behavior: prefersReduced() ? 'auto' : 'smooth' })
      timer = window.setTimeout(() => {
        const input = def.interactive ? document.querySelector<HTMLInputElement>('#in-piMY') : null
        if (input) {
          input.focus({ preventScroll: true })
          input.select()
        } else popRef.current?.focus({ preventScroll: true })
      }, 380)
    }
    timer = window.setTimeout(go, 40)
    return () => window.clearTimeout(timer)
  }, [step, def.targets, def.interactive])

  // Measure the popover so it can be anchored and flipped.
  useLayoutEffect(() => {
    const el = popRef.current
    if (!el) return
    const w = el.offsetWidth
    const h = el.offsetHeight
    setSize((p) => (p.w === w && p.h === h ? p : { w, h }))
  })
  useEffect(() => {
    const t = window.setTimeout(() => setGlide(true), 120)
    return () => window.clearTimeout(t)
  }, [])

  // Keyboard: Escape closes (a glossary tooltip that is open swallows the first Escape).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  // Interactive step: advance when the user makes the change (not when it was already 4%).
  const startPi = useRef(piMY)
  useEffect(() => {
    startPi.current = piMY
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])
  const hit = Math.abs(piMY - TARGET_PI) < 1e-9
  useEffect(() => {
    if (step !== INFL_STEP || !hit || Math.abs(startPi.current - TARGET_PI) < 1e-9) return
    const t = window.setTimeout(() => dispatchStep(INFL_STEP + 1), 1100)
    return () => window.clearTimeout(t)
  }, [step, hit, dispatchStep])

  const pos = size.w ? placePopover(rect, size.w, size.h, def.prefer) : { x: 0, y: 0 }
  const hole = rect && { x: rect.x - 8, y: rect.y - 8, w: rect.w + 16, h: rect.h + 16 }
  const last = step === LAST
  const waiting = def.interactive && !hit

  return (
    <>
      {hole ? (
        <>
          {/* Four dim panels around a cut-out (a huge box-shadow spread did not paint reliably). */}
          {(() => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const x0 = clamp(hole.x, 0, vw)
            const y0 = clamp(hole.y, 0, vh)
            const x1 = clamp(hole.x + hole.w, 0, vw)
            const y1 = clamp(hole.y + hole.h, 0, vh)
            const dim = 'tour-fade pointer-events-none fixed z-[60] bg-scrim'
            return (
              <>
                <div aria-hidden="true" className={dim} style={{ left: 0, top: 0, width: vw, height: y0 }} />
                <div aria-hidden="true" className={dim} style={{ left: 0, top: y1, width: vw, height: Math.max(0, vh - y1) }} />
                <div aria-hidden="true" className={dim} style={{ left: 0, top: y0, width: x0, height: Math.max(0, y1 - y0) }} />
                <div aria-hidden="true" className={dim} style={{ left: x1, top: y0, width: Math.max(0, vw - x1), height: Math.max(0, y1 - y0) }} />
              </>
            )
          })()}
          <div
            aria-hidden="true"
            data-testid="tour-spotlight"
            className="tour-hole pointer-events-none fixed left-0 top-0 z-[60] rounded-2xl"
            style={{ width: hole.w, height: hole.h, transform: `translate(${hole.x}px, ${hole.y}px)` }}
          />
        </>
      ) : (
        <div aria-hidden="true" className="tour-fade pointer-events-none fixed inset-0 z-[60] bg-scrim" />
      )}

      <div
        ref={popRef}
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        data-testid="tour"
        data-glide={glide}
        className="tour-pop fixed left-0 top-0 z-[65] w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl outline-none"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, opacity: size.w ? 1 : 0 }}
      >
        <div key={step} className="tour-fade surface-overlay rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-medium text-fg-muted" data-testid="tour-progress">
              Guided tour &middot; {step + 1} of {STEPS.length}
            </div>
            <button type="button" onClick={close} aria-label="Close tour" className="-m-1 rounded-md p-1 text-fg-subtle hover:bg-muted hover:text-fg">
              <Icon name="close" size={16} />
            </button>
          </div>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary-solid' : 'bg-line'}`} />
            ))}
          </div>

          <h3 id={titleId} className="mt-4 text-lg font-semibold leading-snug tracking-tight text-fg">
            {def.title[tone]}
          </h3>
          <p id={bodyId} className="mt-2 text-[15px] leading-relaxed text-fg-muted">
            {def.body[tone]}
          </p>

          {def.interactive && (
            <div
              role="status"
              data-testid="tour-tryit"
              className={`mt-3 flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm ${hit ? 'bg-primary-tint font-medium text-accent' : 'bg-sunken text-fg-2'}`}
            >
              {hit ? (
                <span>
                  <Icon name="verified" size={16} className="mr-1.5 inline align-[-3px] text-accent" />
                  Done. Inflation MY is 4%. See what moved.
                </span>
              ) : (
                <>
                  <span>Waiting for you to enter 4</span>
                  <button type="button" onClick={setPi} className="shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold text-accent hover:bg-primary-tint">
                    Set it for me
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-2">
            {last ? (
              <button type="button" onClick={() => dispatchStep(0)} data-testid="tour-restart" className="rounded-lg px-2.5 py-2 text-sm font-medium text-accent hover:bg-primary-tint">
                Restart tour
              </button>
            ) : (
              <button type="button" onClick={close} className="rounded-lg px-2.5 py-2 text-sm font-medium text-fg-muted hover:bg-muted hover:text-fg">
                Skip tour
              </button>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => dispatchStep(step - 1)}
                className="control rounded-lg bg-surface px-4 py-2 text-sm font-medium text-fg-2 hover:bg-sunken disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="back" size={16} />
                  Back
                </span>
              </button>
              <button
                type="button"
                onClick={() => (last ? close() : dispatchStep(step + 1))}
                data-testid="tour-next"
                className={`rounded-lg px-5 py-2 text-sm font-semibold ${
                  waiting ? 'bg-surface text-accent shadow-[0_0_0_1.5px_var(--primary-solid)] hover:bg-primary-tint' : 'bg-primary-solid text-on-primary hover:bg-accent'
                }`}
              >
                {last ? (
                  'Done'
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    Next
                    <Icon name="next" size={16} />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
