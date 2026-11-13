import type { Step } from '../engine'
import { Icon } from './icons'

export function Workings({ steps }: { steps: Step[] }) {
  return (
    <details className="group mt-6 rounded-lg bg-sunken shadow-[inset_0_0_0_1px_var(--hairline-soft)]">
      <summary className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-fg-2 hover:text-fg">
        <Icon name="workings" size={16} className="text-fg-subtle" />
        Show workings
        <Icon name="chevron" size={16} className="ml-auto text-fg-subtle transition-transform duration-200 [transition-timing-function:var(--ease-out)] group-open:rotate-180" />
      </summary>
      <ol className="space-y-4 border-t border-line/70 px-4 py-4">
        {steps.map((st, i) => (
          <li key={i} className="text-sm [overflow-wrap:anywhere]">
            <div className="font-medium text-fg-2">
              {i + 1}. {st.label}
            </div>
            <div className="mt-1 space-y-0.5 font-mono text-[13px] leading-relaxed text-fg-muted">
              <div>{st.formula}</div>
              <div className="text-fg-muted">= {st.substituted}</div>
              <div className="font-semibold text-fg">= {st.result}</div>
            </div>
          </li>
        ))}
      </ol>
    </details>
  )
}
