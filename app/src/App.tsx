import { TutorDrawer } from './ai/components'
import { AppProvider, useApp } from './ui/state'
import { Footer, Header, TabBar } from './ui/Header'
import { Sidebar } from './ui/Sidebar'
import { Tour } from './ui/Tour'
import { LEGEND_NOTE } from './ui/kit'
import { BudgetTab } from './ui/tabs/BudgetTab'
import { ParityTab } from './ui/tabs/ParityTab'
import { ScenariosTab } from './ui/tabs/ScenariosTab'
import { HedgingTab } from './ui/tabs/HedgingTab'
import { ArbitrageTab } from './ui/tabs/ArbitrageTab'
import { VerifyTab } from './ui/tabs/VerifyTab'
import { PracticeTabPanel } from './ui/tabs/PracticeTabPanel'

function Shell() {
  const { state, dispatch, active } = useApp()
  return (
    <div className="min-h-screen text-fg">
      <Header />
      <div className="mx-auto flex max-w-[1800px] items-start gap-6 px-6 py-6">
        <aside data-tour="sidebar" className="sticky top-[calc(var(--header-h)+1.5rem)] -m-1 max-h-[calc(100vh-var(--header-h)-3rem)] w-[328px] shrink-0 overflow-y-auto p-1">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1 rounded-2xl">
          <TabBar />
          {(state.tab === 'budget' || state.tab === 'scenarios' || state.tab === 'hedging' || state.tab === 'arbitrage') && (
            <p className="-mt-3 mb-6 text-sm text-fg-muted" data-testid="direction-note">
              {LEGEND_NOTE}
            </p>
          )}
          {state.tab === 'budget' && <BudgetTab />}
          {state.tab === 'parity' && <ParityTab />}
          {state.tab === 'scenarios' && <ScenariosTab />}
          {state.tab === 'hedging' && <HedgingTab />}
          {state.tab === 'arbitrage' && <ArbitrageTab />}
          {state.tab === 'verify' && <VerifyTab />}
          {state.tab === 'practice' && <PracticeTabPanel />}
        </main>
      </div>
      <Footer />
      <Tour />
      <TutorDrawer
        scenario={active}
        open={state.tutorOpen}
        onClose={() => dispatch({ type: 'setTutor', open: false })}
        tone={state.tone}
        onToneChange={(tone) => dispatch({ type: 'setTone', tone })}
      />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
