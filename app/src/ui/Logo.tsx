// OnlyFinance logo. Mark: two opposing arcs (MYR above, USD below) split by a ledger rule.
// Arc one and the rule use currentColor; arc two uses --logo-accent (teal, lighter in dark mode:
// set `--logo-accent: #2dd4bf` under the dark theme). Works on light and dark backgrounds.
import type { CSSProperties } from 'react'

const ACCENT: CSSProperties = { stroke: 'var(--logo-accent, #0f766e)' }

export function LogoMark({ size = 28, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14a10 10 0 0 1 20 0" stroke="currentColor" />
        <path d="M28 18a10 10 0 0 1-20 0" style={ACCENT} />
      </g>
      <path d="M2 16h28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}

export function Logo({
  variant = 'full',
  size = 28,
  className,
}: {
  variant?: 'mark' | 'full'
  /** Mark height in px; the wordmark scales with it. */
  size?: number
  className?: string
}) {
  if (variant === 'mark') return <LogoMark size={size} className={className} title="OnlyFinance" />
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className ?? ''}`} style={{ fontSize: size * 0.78 }}>
      <LogoMark size={size} />
      <span>
        Only<span style={{ color: 'var(--logo-accent, #0f766e)' }}>Finance</span>
      </span>
    </span>
  )
}
