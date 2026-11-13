import { createContext, useContext, useEffect, useReducer } from 'react'
import type { Dispatch, ReactNode } from 'react'
import { getPreset } from '../engine'
import type { Assumptions, Deal, Scenario } from '../engine'

export type Slot = 'A' | 'B'
export type Tone = 'student' | 'sme'
export type TabId = 'budget' | 'parity' | 'scenarios' | 'hedging' | 'arbitrage' | 'verify' | 'practice'

export const TABS: { id: TabId; label: string }[] = [
  { id: 'budget', label: 'Budget' },
  { id: 'parity', label: 'Parity Check' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'hedging', label: 'Hedging' },
  { id: 'arbitrage', label: 'Arbitrage' },
  { id: 'verify', label: 'Verify' },
  { id: 'practice', label: 'Practice' },
]

export interface AppState {
  slots: Record<Slot, Scenario>
  active: Slot
  tab: TabId
  tone: Tone
  tutorOpen: boolean
  tourStep: number | null
}

export type Action =
  | { type: 'loadPreset'; id: string }
  /** Keep the current inputs but stop claiming they are a stored preset. */
  | { type: 'setCustom' }
  | { type: 'setDeal'; patch: Partial<Deal> }
  | { type: 'setAssumptions'; patch: Partial<Assumptions> }
  | { type: 'setSlot'; slot: Slot }
  | { type: 'setTab'; tab: TabId }
  | { type: 'setTone'; tone: Tone }
  | { type: 'setTutor'; open: boolean }
  | { type: 'tour'; step: number | null }

function tabFromHash(): TabId | null {
  if (typeof window === 'undefined') return null
  const h = window.location.hash.replace('#', '')
  return TABS.some((t) => t.id === h) ? (h as TabId) : null
}

function init(): AppState {
  return {
    slots: { A: getPreset('baseline'), B: getPreset('inflationShock') },
    active: 'A',
    tab: tabFromHash() ?? 'budget',
    tone: 'sme',
    tutorOpen: false,
    tourStep: null,
  }
}

export const CUSTOM_ID = 'custom'
function asCustom(sc: Scenario): Scenario {
  if (sc.id === CUSTOM_ID) return sc
  return { ...sc, id: CUSTOM_ID, name: 'Custom', note: undefined }
}

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'loadPreset':
      return { ...s, slots: { ...s.slots, [s.active]: getPreset(a.id) } }
    case 'setCustom':
      return { ...s, slots: { ...s.slots, [s.active]: asCustom(s.slots[s.active]) } }
    // Editing any input means the slot is no longer a stored preset, so it never claims one.
    case 'setDeal': {
      const cur = asCustom(s.slots[s.active])
      return { ...s, slots: { ...s.slots, [s.active]: { ...cur, deal: { ...cur.deal, ...a.patch } } } }
    }
    case 'setAssumptions': {
      const cur = asCustom(s.slots[s.active])
      return { ...s, slots: { ...s.slots, [s.active]: { ...cur, a: { ...cur.a, ...a.patch } } } }
    }
    case 'setSlot':
      return { ...s, active: a.slot }
    case 'setTab':
      return { ...s, tab: a.tab }
    case 'setTone':
      return { ...s, tone: a.tone }
    case 'setTutor':
      return { ...s, tutorOpen: a.open }
    case 'tour': {
      // Tour.tsx owns the steps and which tab each one needs; state only holds the current index.
      if (a.step === null) return { ...s, tourStep: null }
      const step = Math.max(0, a.step)
      // The tour always starts (or restarts) on the Baseline preset in the active slot.
      const slots = s.tourStep === null || step === 0 ? { ...s.slots, [s.active]: getPreset('baseline') } : s.slots
      return { ...s, slots, tourStep: step }
    }
  }
}

interface Ctx {
  state: AppState
  dispatch: Dispatch<Action>
  active: Scenario
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  // URL hash and tab stay in sync (lets screenshots select a tab).
  useEffect(() => {
    const want = `#${state.tab}`
    if (window.location.hash !== want) window.history.replaceState(null, '', want)
  }, [state.tab])
  useEffect(() => {
    const onHash = () => {
      const t = tabFromHash()
      if (t) dispatch({ type: 'setTab', tab: t })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return <AppContext.Provider value={{ state, dispatch, active: state.slots[state.active] }}>{children}</AppContext.Provider>
}

export function useApp(): Ctx {
  const c = useContext(AppContext)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}
