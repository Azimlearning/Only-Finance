import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GLOSSARY } from './glossary'
import type { TermId } from './glossary'
import { useApp } from './state'

/* ---------------------------------------------------------------------------------------------
 * Glossary tooltips.
 *  - One tooltip open at a time (module store). Opening takes 300 ms of hover, but is instant
 *    when another tooltip is open or just closed, so sweeping across labels feels immediate.
 *  - Opens on hover, keyboard focus and tap. Escape closes (captured so the tour/drawer do not
 *    also close). role="tooltip" + aria-describedby on the trigger.
 *  - Rendered in a portal with fixed positioning, so scrolling tables and the tab bar never clip
 *    it; flips above/below and clamps to the viewport.
 * ------------------------------------------------------------------------------------------- */

const HOVER_DELAY = 300
const CLOSE_GRACE = 90
const RECENT_MS = 320

let current: string | null = null
let lastClose = 0
const subs = new Set<() => void>()
const subscribe = (f: () => void) => {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}
function setCurrent(key: string | null) {
  if (current === key) return
  if (current !== null && key === null) lastClose = performance.now()
  current = key
  subs.forEach((f) => f())
}
export const isTipOpen = () => current !== null
export const closeTip = () => setCurrent(null)

interface Pos {
  top: number
  left: number
  side: 'top' | 'bottom'
  arrowX: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))

export interface TipOptions {
  /** Touch/click toggles the tip. True for inline terms; false for buttons that already do something on click. */
  tapToggle?: boolean
}

export function useTip(id: TermId, { tapToggle = true }: TipOptions = {}) {
  const key = useId()
  const tipId = useId()
  const { state } = useApp()
  const open = useSyncExternalStore(
    subscribe,
    () => current === key,
    () => false,
  )
  const trigRef = useRef<Element | null>(null)
  const bubRef = useRef<HTMLDivElement | null>(null)
  const openTimer = useRef<number | undefined>(undefined)
  const closeTimer = useRef<number | undefined>(undefined)
  const pointerKind = useRef<string>('mouse')
  const [pos, setPos] = useState<Pos | null>(null)

  const clearTimers = () => {
    window.clearTimeout(openTimer.current)
    window.clearTimeout(closeTimer.current)
  }
  const show = useCallback(() => setCurrent(key), [key])
  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      if (current === key) setCurrent(null)
    }, CLOSE_GRACE)
  }, [key])

  // Position: below by default, flip above when there is no room, clamp to the viewport.
  const place = useCallback(() => {
    const t = trigRef.current
    const b = bubRef.current
    if (!t || !b) return
    const r = t.getClientRects()[0] ?? t.getBoundingClientRect()
    const bw = b.offsetWidth
    const bh = b.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight
    const gap = 10
    const m = 8
    const fitsBelow = r.bottom + gap + bh <= vh - m
    const fitsAbove = r.top - gap - bh >= m
    const side: 'top' | 'bottom' = fitsBelow ? 'bottom' : fitsAbove ? 'top' : vh - r.bottom >= r.top ? 'bottom' : 'top'
    const top = clamp(side === 'bottom' ? r.bottom + gap : r.top - gap - bh, m, vh - bh - m)
    const left = clamp(r.left + r.width / 2 - bw / 2, m, vw - bw - m)
    const arrowX = clamp(r.left + r.width / 2 - left, 16, bw - 16)
    setPos((p) => (p && p.top === top && p.left === left && p.side === side && p.arrowX === arrowX ? p : { top, left, side, arrowX }))
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    place()
  }, [open, place, state.tone])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setCurrent(null)
    }
    const onDown = (e: PointerEvent) => {
      const n = e.target as Node
      if (trigRef.current?.contains(n) || bubRef.current?.contains(n)) return
      setCurrent(null)
    }
    const onMove = () => place()
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open, place])

  useEffect(
    () => () => {
      window.clearTimeout(openTimer.current)
      window.clearTimeout(closeTimer.current)
      if (current === key) setCurrent(null)
    },
    [key],
  )

  const triggerProps = {
    ref: (el: Element | null) => {
      trigRef.current = el
    },
    'aria-describedby': open ? tipId : undefined,
    onPointerEnter: (e: ReactPointerEvent) => {
      pointerKind.current = e.pointerType
      if (e.pointerType === 'touch') return
      clearTimers()
      const instant = current !== null || performance.now() - lastClose < RECENT_MS
      if (instant) show()
      else openTimer.current = window.setTimeout(show, HOVER_DELAY)
    },
    onPointerLeave: () => {
      window.clearTimeout(openTimer.current)
      if (current === key) scheduleClose()
    },
    onPointerDown: (e: ReactPointerEvent) => {
      pointerKind.current = e.pointerType
    },
    onFocus: (e: { currentTarget: Element }) => {
      let kbd = true
      try {
        kbd = e.currentTarget.matches(':focus-visible')
      } catch {
        kbd = true
      }
      if (kbd) {
        clearTimers()
        show()
      }
    },
    onBlur: () => {
      window.clearTimeout(openTimer.current)
      if (current === key) setCurrent(null)
    },
    onClick: (e: { preventDefault: () => void }) => {
      if (!tapToggle) return
      // Tapping an inline term inside a <label> should explain it, not jump into the field.
      if (pointerKind.current === 'touch') {
        e.preventDefault()
        setCurrent(current === key ? null : key)
      } else {
        clearTimers()
        show()
      }
    },
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (!tapToggle) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setCurrent(current === key ? null : key)
      }
    },
  }

  const g = GLOSSARY[id]
  const student = state.tone === 'student'
  const bubble =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={bubRef}
            id={tipId}
            role="tooltip"
            onPointerEnter={() => window.clearTimeout(closeTimer.current)}
            onPointerLeave={scheduleClose}
            className={`fixed left-0 top-0 z-[80] w-max max-w-[280px] rounded-lg bg-tip-bg px-4 py-3 text-left text-[13px] font-normal normal-case leading-relaxed tracking-normal text-tip-fg shadow-[var(--shadow-tip)] ${pos ? 'tip-enter' : 'invisible'}`}
            style={
              pos
                ? ({ top: pos.top, left: pos.left, '--tip-origin': `${pos.arrowX}px ${pos.side === 'bottom' ? '0%' : '100%'}` } as CSSProperties)
                : undefined
            }
          >
            <span
              aria-hidden="true"
              className="absolute h-2.5 w-2.5 rotate-45 bg-tip-bg"
              style={pos ? { left: pos.arrowX - 5, [pos.side === 'bottom' ? 'top' : 'bottom']: -4 } : undefined}
            />
            <div className="relative">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-tip-title">{g.term}</span>
                <span className="shrink-0 text-xs font-medium text-tip-fg-2">{student ? 'Textbook' : 'Plain words'}</span>
              </div>
              <p className="mt-1 text-tip-fg">{student ? g.student : g.plain}</p>
              {g.example && <p className="mt-1.5 border-t border-tip-line pt-1.5 text-[12px] text-tip-fg-2">e.g. {g.example}</p>}
            </div>
          </div>,
          document.body,
        )
      : null

  return { triggerProps, bubble }
}

/** Inline term: dotted underline, explains itself on hover, focus or tap. */
export function Term({ id, children, className = '' }: { id: TermId; children: ReactNode; className?: string }) {
  const { triggerProps, bubble } = useTip(id)
  return (
    <>
      <span
        {...triggerProps}
        tabIndex={0}
        data-term={id}
        className={`cursor-help rounded-sm underline decoration-dotted decoration-line-strong decoration-[0.5px] underline-offset-[4px] hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`}
      >
        {children}
      </span>
      {bubble}
    </>
  )
}

/** Same tooltip for a group inside an SVG (the parity triangle edges and corners). */
export function SvgTip({ id, children }: { id: TermId; children: ReactNode }) {
  const { triggerProps, bubble } = useTip(id)
  return (
    <>
      <g {...triggerProps} tabIndex={0} data-term={id} className="cursor-help rounded-md outline-none focus-visible:outline-2 focus-visible:outline-focus">
        {children}
      </g>
      {bubble}
    </>
  )
}
