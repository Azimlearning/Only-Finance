import { useRef } from 'react'
import { Icon } from './icons'
import type { IconName } from './icons'
import { SEG_WRAP, segBtn } from './kit'
import { setPref, useTheme } from './theme'
import type { ThemePref } from './theme'

const OPTIONS: { id: ThemePref; label: string; icon: IconName }[] = [
  { id: 'light', label: 'Light', icon: 'themeLight' },
  { id: 'dark', label: 'Dark', icon: 'themeDark' },
  { id: 'system', label: 'System', icon: 'themeSystem' },
]

/** Light / Dark / System. Radio group: roving tabindex, arrows/Home/End move and select. */
export function ThemeToggle() {
  const { pref, resolved } = useTheme()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const move = (to: number) => {
    const i = (to + OPTIONS.length) % OPTIONS.length
    setPref(OPTIONS[i].id)
    refs.current[i]?.focus()
  }
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(i + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(i - 1)
    else if (e.key === 'Home') move(0)
    else if (e.key === 'End') move(OPTIONS.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <div className="flex items-center">
      <div role="radiogroup" aria-label="Colour theme" data-testid="theme-toggle" className={`flex ${SEG_WRAP}`}>
        {OPTIONS.map((o, i) => (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={pref === o.id}
            tabIndex={pref === o.id ? 0 : -1}
            title={o.id === 'system' ? `System (currently ${resolved})` : o.label}
            data-testid={`theme-${o.id}`}
            onClick={() => setPref(o.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`${segBtn(pref === o.id)} inline-flex items-center gap-1.5`}
          >
            <Icon name={o.icon} size={16} />
            <span className="sr-only xl:not-sr-only">{o.label}</span>
          </button>
        ))}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {pref === 'system' ? `Theme: System, currently ${resolved}` : ''}
      </span>
    </div>
  )
}
