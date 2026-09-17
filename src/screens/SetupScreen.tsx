import { Tabs } from 'radix-ui'
import { useState } from 'react'
import ClassesPanel from '../components/setup/ClassesPanel'
import QuickStartHero from '../components/setup/QuickStartHero'
import QuickTeamsPanel from '../components/setup/QuickTeamsPanel'
import { teamsComeFromClass } from '../components/setup/setupHelpers'
import { useHotkeys } from '../hooks/useHotkeys'
import { findClass, useGameStore } from '../store/useGameStore'

const theTabStyle =
  'display -mb-1 border-b-4 [word-spacing:0.15em] border-transparent px-1 pb-2 text-4xl text-faint transition-colors hover:text-text data-[state=active]:border-crimson data-[state=active]:text-text 2xl:text-5xl'

export default function SetupScreen() {
  const quickGame = useGameStore((theState) => theState.quickGame)
  // A teacher who last worked on a class lands back on it.
  const [theTab, setTheTab] = useState(() => {
    const theState = useGameStore.getState()
    if (teamsComeFromClass(theState.teams, findClass(theState.classes, theState.activeClassId))) {
      return 'classes'
    }
    return 'teams'
  })

  useHotkeys(
    {
      Enter: (theEvent) => {
        // useHotkeys swallows Enter, so a focused button still needs its own press delivered.
        const theTarget = theEvent.target
        if (theTarget instanceof HTMLElement && theTarget !== document.body && theTarget.closest('button, a, [role="tab"]') !== null) {
          theTarget.click()
          return
        }
        quickGame()
      },
    },
    true,
  )

  return (
    <div className="grid h-full min-h-0 overflow-y-auto lg:grid-cols-[minmax(460px,0.82fr)_1.18fr] lg:overflow-hidden">
      <div className="lg:min-h-0">
        <QuickStartHero />
      </div>

      <Tabs.Root id="team-setup" value={theTab} onValueChange={setTheTab} className="flex h-[calc(100dvh-3.5rem)] min-h-0 min-w-0 flex-col px-5 pt-5 pb-5 xl:px-10 xl:pt-7 xl:pb-8 lg:h-auto">
        <Tabs.List aria-label="Team setup" className="mb-5 flex gap-8 border-b-4 border-surface-2">
          <Tabs.Trigger value="teams" className={theTabStyle}>
            Quick teams
          </Tabs.Trigger>
          <Tabs.Trigger value="classes" className={theTabStyle}>
            Classes
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="teams" className="min-h-0 flex-1">
          <QuickTeamsPanel onOpenClasses={() => setTheTab('classes')} />
        </Tabs.Content>
        <Tabs.Content value="classes" className="min-h-0 flex-1">
          <ClassesPanel />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
