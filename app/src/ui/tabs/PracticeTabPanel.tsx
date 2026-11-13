import { PracticeTab } from '../../ai/components'
import { useCopy } from '../copy'
import { TabPanel } from '../kit'
import { useApp } from '../state'

export function PracticeTabPanel() {
  const { state } = useApp()
  const c = useCopy()
  return (
    <TabPanel id="practice" title="Practice" intro={c.practiceIntro}>
      <PracticeTab tone={state.tone} />
    </TabPanel>
  )
}
