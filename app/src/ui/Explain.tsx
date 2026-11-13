import { ExplainButton } from '../ai/components'
import type { Scenario } from '../engine'
import { useApp } from './state'

/** ExplainButton wired to the header tone switch, so AI and offline explanations follow SME owner / Student. */
export function Explain(props: { topic: string; data: unknown; scenario: Scenario }) {
  const { state } = useApp()
  return <ExplainButton {...props} tone={state.tone} />
}
