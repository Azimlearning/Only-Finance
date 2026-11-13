// Colour theme: Light (default) | Dark | System. One tiny external store, no React state, so it works before
// React mounts (the inline script in index.html sets the same class before first paint).
// Mechanism: `dark` class on <html> plus `data-theme-pref`; tokens live in index.css. Storage key `of_theme`.
import { useSyncExternalStore } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'
export type Resolved = 'light' | 'dark'

export const THEME_KEY = 'of_theme'
/** Browser chrome colour per scheme (kept in step with --bg / the old light value in index.html). */
const CHROME: Record<Resolved, string> = { light: '#f4f7fa', dark: '#0f141a' }

const isPref = (v: unknown): v is ThemePref => v === 'light' || v === 'dark' || v === 'system'

export function getPref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return isPref(v) ? v : 'light'
  } catch {
    return 'light'
  }
}

const mq = (): MediaQueryList | null => {
  try {
    return typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
  } catch {
    return null
  }
}

export function resolve(pref: ThemePref): Resolved {
  if (pref === 'dark') return 'dark'
  if (pref === 'system') return mq()?.matches ? 'dark' : 'light'
  return 'light'
}

let pref: ThemePref = getPref()
let resolved: Resolved = resolve(pref)
let snapshot = { pref, resolved }
const listeners = new Set<() => void>()
let animTimer: number | undefined

function paint(animate: boolean) {
  const root = document.documentElement
  if (animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    root.setAttribute('data-theme-anim', '')
    window.clearTimeout(animTimer)
    animTimer = window.setTimeout(() => root.removeAttribute('data-theme-anim'), 220)
  }
  root.classList.toggle('dark', resolved === 'dark')
  root.setAttribute('data-theme-pref', pref)
  // Both <meta name="theme-color"> tags (one per scheme) follow the resolved theme, so a manual choice wins over the OS.
  const cs = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')
  if (cs) cs.content = resolved
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.content = CHROME[resolved]
  })
}

function publish() {
  snapshot = { pref, resolved }
  listeners.forEach((l) => l())
}

export function setPref(next: ThemePref) {
  pref = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {
    /* storage blocked: the choice still applies for this page view */
  }
  resolved = resolve(next)
  paint(true)
  publish()
}

/** Call once at startup: syncs the DOM with the stored pref and follows the OS while pref is System. */
export function initTheme() {
  pref = getPref()
  resolved = resolve(pref)
  paint(false)
  publish()
  mq()?.addEventListener?.('change', () => {
    if (pref !== 'system') return
    const r = resolve('system')
    if (r === resolved) return
    resolved = r
    paint(true)
    publish()
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useTheme() {
  return useSyncExternalStore(subscribe, () => snapshot)
}
