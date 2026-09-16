import { Tabs } from 'radix-ui'
import { MotionConfig } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClassBoardTab from '../components/leaderboard/ClassBoardTab'
import RoundHistoryTab from '../components/leaderboard/RoundHistoryTab'
import ThisGameTab from '../components/leaderboard/ThisGameTab'
import Kbd from '../components/ui/Kbd'
import { useHotkeys } from '../hooks/useHotkeys'
import { routeForPhase } from '../hooks/usePhaseRoute'
import { useGameStore } from '../store/useGameStore'

const theTabs = [
  { value: 'game', label: 'This game' },
  { value: 'history', label: 'Round history' },
  { value: 'classes', label: 'Class board' },
]

export default function LeaderboardScreen() {
  const theNavigate = useNavigate()
  const thePhase = useGameStore((theState) => theState.game.phase)
  const [theTab, setTheTab] = useState('game')

  function goBack() {
    // A teacher who opened the leaderboard straight from a bookmark has no in-app page to return to.
    const theHistoryState = window.history.state as { idx?: number } | null
    if (theHistoryState !== null && typeof theHistoryState.idx === 'number' && theHistoryState.idx > 0) {
      theNavigate(-1)
    } else {
      theNavigate(routeForPhase(thePhase))
    }
  }

  useHotkeys({ Escape: goBack }, true)

  const theTriggers = []
  for (let n = 0; n < theTabs.length; n++) {
    const theItem = theTabs[n]
    theTriggers.push(
      <Tabs.Trigger
        key={theItem.value}
        value={theItem.value}
        className="display flex h-14 items-center px-5 text-3xl text-muted transition-colors hover:text-text data-[state=active]:text-text data-[state=active]:shadow-[inset_0_-4px_0_0_var(--crimson)]"
      >
        {theItem.label}
      </Tabs.Trigger>,
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <Tabs.Root value={theTab} onValueChange={setTheTab} className="mx-auto flex h-full w-full max-w-[1680px] flex-col px-6 pt-5 pb-6 xl:px-10 xl:pt-7">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b-2 border-surface-3">
          <h1 className="display pb-3 text-[clamp(3.75rem,9vh,6rem)]">Leaderboard</h1>
          <div className="flex items-center gap-6">
            <span className="label hidden items-center gap-2 md:flex">
              <Kbd>Esc</Kbd> back
            </span>
            <Tabs.List aria-label="Leaderboard views" className="flex">
              {theTriggers}
            </Tabs.List>
          </div>
        </header>
        <Tabs.Content value="game" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <ThisGameTab />
        </Tabs.Content>
        <Tabs.Content value="history" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <RoundHistoryTab />
        </Tabs.Content>
        <Tabs.Content value="classes" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <ClassBoardTab />
        </Tabs.Content>
      </Tabs.Root>
    </MotionConfig>
  )
}
