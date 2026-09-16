import { Tabs } from 'radix-ui'
import { MotionConfig } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClassBoardTab from '../components/leaderboard/ClassBoardTab'
import PlayersTab from '../components/leaderboard/PlayersTab'
import RoundHistoryTab from '../components/leaderboard/RoundHistoryTab'
import ThisGameTab from '../components/leaderboard/ThisGameTab'
import Kbd from '../components/ui/Kbd'
import { useHotkeys } from '../hooks/useHotkeys'
import { routeForPhase } from '../hooks/usePhaseRoute'
import { useGameStore } from '../store/useGameStore'

const theTabs = [
  { value: 'game', label: 'This game' },
  { value: 'players', label: 'Players' },
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
        className="display flex h-12 items-center px-3 text-2xl text-muted xl:h-14 xl:px-5 xl:text-3xl transition-colors hover:text-text data-[state=active]:text-text data-[state=active]:shadow-[inset_0_-4px_0_0_var(--crimson)]"
      >
        {theItem.label}
      </Tabs.Trigger>,
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <Tabs.Root value={theTab} onValueChange={setTheTab} className="mx-auto flex h-full w-full max-w-[1680px] flex-col px-6 pt-3 pb-4 xl:px-10 xl:pt-7 xl:pb-6">
        <header className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-0 border-b-2 border-surface-3 xl:mb-5 xl:gap-x-8">
          <h1 className="display pb-2 text-[clamp(2.75rem,9vh,6rem)] xl:pb-3">Leaderboard</h1>
          <div className="flex items-center gap-4 xl:gap-6">
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
        <Tabs.Content value="players" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <PlayersTab />
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
