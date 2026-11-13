// Semantic icon map for OnlyFinance. One style only: Lucide outline, currentColor, 1.75 stroke. No emoji.
import {
  Wallet, Scale, Layers, ShieldCheck, ArrowLeftRight, BadgeCheck, GraduationCap, Sparkles,
  Lightbulb, X, Compass, Info, Bookmark, PackageOpen, Ship, FileText, SlidersHorizontal,
  Percent, TrendingUp, Coins, CalendarDays, CircleCheck, TriangleAlert, WifiOff, Send,
  RotateCcw, ArrowRight, ArrowLeft, ChevronDown, ChevronRight, Sun, Moon, Monitor,
  ExternalLink, Calculator, ArrowUp, ArrowDown,
  type LucideIcon,
} from 'lucide-react'

export const ICONS = {
  // tabs
  budget: Wallet,
  parity: Scale,
  scenarios: Layers,
  hedging: ShieldCheck,
  arbitrage: ArrowLeftRight,
  verify: BadgeCheck,
  practice: GraduationCap,
  // assistant
  tutor: Sparkles,
  explain: Lightbulb,
  close: X,
  tour: Compass,
  info: Info,
  // deal
  scenario: Bookmark,
  importer: PackageOpen,
  exporter: Ship,
  invoice: FileText,
  assumptions: SlidersHorizontal,
  interestRate: Percent,
  inflation: TrendingUp,
  exchangeRate: Coins,
  days: CalendarDays,
  // status
  verified: CircleCheck,
  warning: TriangleAlert,
  offline: WifiOff,
  // actions
  send: Send,
  restart: RotateCcw,
  next: ArrowRight,
  back: ArrowLeft,
  chevron: ChevronDown,
  chevronRight: ChevronRight,
  external: ExternalLink,
  workings: Calculator,
  up: ArrowUp,
  down: ArrowDown,
  // theme
  themeLight: Sun,
  themeDark: Moon,
  themeSystem: Monitor,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  className,
  label,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  /** Accessible name. Omit for decorative icons (aria-hidden). */
  label?: string
}) {
  const Cmp = ICONS[name]
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      color="currentColor"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    />
  )
}
