import { MotionConfig } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import EmptyPanel from '../components/leaderboard/EmptyPanel'
import PodiumActions from '../components/podium/PodiumActions'
import PodiumStands from '../components/podium/PodiumStands'
import StandingsTable from '../components/podium/StandingsTable'
import WinnerLine from '../components/podium/WinnerLine'
import Button from '../components/ui/Button'
import { resultsToCsv } from '../engine/csv'
import { useStandings } from '../hooks/useGameView'
import { useEffect, useState } from 'react'
import { useHotkeys } from '../hooks/useHotkeys'
import { downloadText } from '../lib/download'
import { useGameStore } from '../store/useGameStore'

const PODIUM_ENTER_DELAY_MS = 2500

export type ScreenMode = 'control' | 'projector'

const WINNER_DELAY_SECONDS = 1.2

export default function PodiumScreen({ mode }: { mode: ScreenMode }) {
  const theNavigate = useNavigate()
  const theGame = useGameStore((theState) => theState.game)
  const theTeams = useGameStore((theState) => theState.teams)
  const playAgain = useGameStore((theState) => theState.playAgain)
  const theStandings = useStandings()
  const theFinal = theGame.phase === 'podium'
  const theControl = mode === 'control'
  const theLarge = mode === 'projector'

  const [theEnterReady, setTheEnterReady] = useState(false)
  useEffect(() => {
    // A teacher still tapping Enter for Correct when the podium appears must not wipe the results.
    const theTimer = window.setTimeout(() => setTheEnterReady(true), PODIUM_ENTER_DELAY_MS)
    return () => window.clearTimeout(theTimer)
  }, [])
  useHotkeys({ Enter: playAgain }, theControl && theFinal && theEnterReady)

  if (!theFinal && theGame.history.length === 0) {
    let theAction = null
    if (theControl) {
      theAction = (
        <Button variant="primary" size="lg" onClick={() => theNavigate('/')}>
          Go to Setup
        </Button>
      )
    }
    return (
      <section className="mx-auto flex h-full w-full max-w-[1680px] flex-col px-6 py-8 xl:px-10">
        <EmptyPanel title="The podium fills in when a game ends" body="The top three teams stand here, with the full table underneath." action={theAction} />
      </section>
    )
  }

  function exportCsv() {
    downloadText('park-tudor-password-results.csv', resultsToCsv(theStandings, theTeams, theGame.history), 'text/csv')
  }

  let theEyebrow = null
  if (!theFinal) {
    theEyebrow = <p className="label mb-2">Standings so far</p>
  }

  let theActions = null
  if (theControl) {
    theActions = <PodiumActions final={theFinal} onExport={exportCsv} />
  }

  let thePadding = 'px-6 pt-3 pb-3 xl:px-10 xl:pt-7 xl:pb-5'
  if (theLarge) {
    thePadding = 'px-10 pt-8 pb-8'
  }

  // Keyed on the game and phase so a new result replays the reveal while a score edit rerender does not.
  return (
    <MotionConfig reducedMotion="user">
      <section key={theGame.id + '-' + theGame.phase} className={'mx-auto flex h-full w-full max-w-[1680px] flex-col ' + thePadding}>
        <header className="shrink-0">
          {theEyebrow}
          <WinnerLine standings={theStandings} final={theFinal} delay={WINNER_DELAY_SECONDS} large={theLarge} />
        </header>
        <div className="mt-2 min-h-0 flex-1">
          <PodiumStands standings={theStandings} large={theLarge} />
        </div>
        <div className="mt-3 flex shrink-0 flex-col items-stretch gap-3 md:flex-row xl:mt-4 xl:gap-4">
          <StandingsTable standings={theStandings} large={theLarge} />
          {theActions}
        </div>
      </section>
    </MotionConfig>
  )
}
