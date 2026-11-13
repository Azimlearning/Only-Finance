import type { ReactNode } from 'react'
import type { Mode } from '../engine'
import { Icon } from './icons'

export function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  testid,
  tour,
  subtitleClassName = '',
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  testid?: string
  /** data-tour anchor for the guided tour. */
  tour?: string
  /** Lets a row of sibling cards reserve the same subtitle height so their figures line up. */
  subtitleClassName?: string
}) {
  return (
    <section data-testid={testid} data-tour={tour} className={`surface rounded-2xl p-6 sm:p-8 ${className}`}>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[20px] font-semibold leading-snug tracking-tight text-fg">{title}</h3>
          {subtitle && <p className={`mt-1 max-w-3xl text-sm leading-relaxed text-fg-muted ${subtitleClassName}`}>{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
    </section>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone = 'default',
  size = 'lg',
}: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  tone?: 'default' | 'good' | 'bad' | 'accent'
  /** sm for stats packed into narrow cards, so long ringgit amounts stay on one line. */
  size?: 'xl' | 'lg' | 'sm'
}) {
  const color =
    tone === 'good' ? 'text-gain' : tone === 'bad' ? 'text-loss' : tone === 'accent' ? 'text-accent' : 'text-fg'
  return (
    <div className="min-w-0">
      <div className="label">{label}</div>
      <div className={`num mt-2 font-semibold leading-tight tracking-tight [overflow-wrap:break-word] ${size === 'sm' ? 'text-[clamp(1.0625rem,1.35vw,1.375rem)]' : size === 'xl' ? 'text-[clamp(1.75rem,2.2vw,2rem)]' : 'text-[clamp(1.5rem,1.9vw,1.875rem)]'} ${color}`}>{value}</div>
      {sub && <div className="num mt-1 text-sm text-fg-muted">{sub}</div>}
    </div>
  )
}

/** Headline figure for the top of a tab: the one number to read first. Engine value in, no maths here. */
export function KpiTile({
  label,
  value,
  sub,
  tone = 'default',
  testid,
}: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  tone?: 'default' | 'good' | 'bad' | 'accent'
  testid?: string
}) {
  const rail = tone === 'good' ? 'border-gain' : tone === 'bad' ? 'border-loss' : tone === 'accent' ? 'border-accent' : 'border-line-strong'
  return (
    <div data-testid={testid} className={`min-w-0 border-l-2 py-1 pl-4 ${rail}`}>
      <Stat label={label} value={value} sub={sub} tone={tone} />
    </div>
  )
}

export function TabPanel({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div id={`tab-${id}`} data-testid={`tab-${id}`} className="panel-enter space-y-6">
      <div>
        <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-fg">{title}</h2>
        {intro && <p className="mt-2 max-w-3xl text-base leading-relaxed text-fg-muted">{intro}</p>}
      </div>
      {children}
    </div>
  )
}

export function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'teal' | 'amber' | 'red' }) {
  const c = {
    slate: 'bg-muted text-fg-2 ring-1 ring-line',
    teal: 'bg-primary-tint text-accent ring-1 ring-primary-line',
    amber: 'bg-cost-tint text-cost-text ring-1 ring-cost-line',
    red: 'bg-danger-tint text-danger ring-1 ring-danger-line',
  }[tone]
  return <span className={`inline-flex max-w-full items-center rounded-md px-2.5 py-0.5 text-left text-xs font-medium leading-snug ${c}`}>{children}</span>
}

export const payWord = (m: Mode) => (m === 'importer' ? 'you pay' : 'you receive')
export const payWordCap = (m: Mode) => (m === 'importer' ? 'You pay' : 'You receive')
/** Is a higher MYR amount good for this mode? Importer pays, so higher is bad. */
export const higherIsGood = (m: Mode) => m === 'exporter'

/** Chart palette: every value is a CSS variable (index.css) so Recharts re-colours with the theme and needs no re-render.
 *  Colour is kept for meaning: teal = forward / IRP and "better for you", amber = "costs you more"
 *  (gain/loss only). Everything else is a neutral step, told apart by weight and dash pattern, so the charts
 *  survive greyscale print and colour-blind viewing. */
export const CHART = {
  teal: 'var(--chart-teal)',
  amber: 'var(--chart-amber)',
  ink: 'var(--chart-ink)',
  slate: 'var(--chart-slate)',
  mute: 'var(--chart-mute)',
  ppp: 'var(--chart-ppp)',
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  zero: 'var(--chart-zero)',
  /** Sized for an A3 poster screenshot: 13px axis text, darker than the gridlines. */
  tick: { fontSize: 13, fill: 'var(--fg-muted)' },
  axisLabel: { fill: 'var(--fg-muted)', fontSize: 13 },
  /** Reference lines and their labels share one quiet style, so three labels never compete for colour. */
  ref: { stroke: 'var(--chart-ref)', strokeDasharray: '4 4' },
  refLabel: { fill: 'var(--fg-muted)', fontSize: 12, fontWeight: 500 },
  tooltip: {
    contentStyle: {
      background: 'var(--surface-overlay)',
      border: 'none',
      borderRadius: 8,
      boxShadow: 'var(--shadow-overlay)',
      padding: '10px 12px',
      fontSize: 13,
      color: 'var(--fg)',
    },
    labelStyle: { color: 'var(--fg)', fontWeight: 600, marginBottom: 4 },
    itemStyle: { color: 'var(--fg-2)', padding: 0 },
    cursor: { fill: 'var(--chart-cursor)' },
  },
  legend: { fontSize: 13, color: 'var(--fg-2)', paddingTop: 8 },
}

/** Recharts colours legend text with the series colour; keep the swatch, but set the words in body text colour (AA). */
export const legendText = (value: string) => <span style={{ color: 'var(--fg-2)' }}>{value}</span>

export const LEGEND_NOTE = 'Higher MYR per USD means a weaker ringgit. All rates are MYR per 1 USD.'

/** One segmented-control look for the header, sidebar and tutor drawer. */
export const SEG_WRAP = 'rounded-lg bg-muted p-0.5'
export const segBtn = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${
    active ? 'bg-raised text-fg shadow-[var(--shadow-control)]' : 'text-fg-muted hover:text-fg'
  }`

/** The product's one signature: a quiet "checked by the engine" mark. Text and a check, no fill, no pill. */
export function VerifiedMark({ verified, total, offline }: { verified: number; total: number; offline?: boolean }) {
  const all = total > 0 && verified === total
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${all ? 'text-accent' : 'text-cost-text'}`}>
        <Icon name={all ? 'verified' : 'warning'} size={14} />
        {verified}/{total} numbers match the engine
      </span>
      {offline && (
        <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
          <Icon name="offline" size={14} /> Offline
        </span>
      )}
    </span>
  )
}
