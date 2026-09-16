import { MotionConfig } from 'motion/react'
import { toast } from 'sonner'
import CareerCard from '../components/live/CareerCard'
import CountdownDisplay from '../components/live/CountdownDisplay'
import LiveControls from '../components/live/LiveControls'
import LiveEmptyState from '../components/live/LiveEmptyState'
import LiveTeamPanel from '../components/live/LiveTeamPanel'
import LiveTurnStats from '../components/live/LiveTurnStats'
import ResultBanner from '../components/live/ResultBanner'
import StandingsStrip from '../components/live/StandingsStrip'
import SwapModal from '../components/live/SwapModal'
import TimerRing from '../components/live/TimerRing'
import WordDisplay from '../components/live/WordDisplay'
import { presentPlayers } from '../engine/rotation'
import { remainingMs } from '../engine/timer'
import type { Player } from '../engine/types'
import { useAbsentIds, useCurrentTeam, useStandings } from '../hooks/useGameView'
import { useHotkeys } from '../hooks/useHotkeys'
import { useNow } from '../hooks/useNow'
import { useGameStore } from '../store/useGameStore'

export type ScreenMode = 'control' | 'projector'

function undoWithToast() {
  const theLabel = useGameStore.getState().undo()
  if (theLabel === null) {
    toast('Nothing to undo in this turn')
  } else {
    toast.success('Undone: ' + theLabel)
  }
}

export default function LiveScreen({ mode }: { mode: ScreenMode }) {
  const theGame = useGameStore((theState) => theState.game)
  const theSettings = useGameStore((theState) => theState.settings)
  const theTeam = useCurrentTeam()
  const theStandings = useStandings()
  const theAbsentIds = useAbsentIds()
  const theTurn = theGame.turn
  const theIsControl = mode === 'control'
  const theRunning = theTurn !== null && theTurn.end === null && theTurn.pausedAt === null
  const theNow = useNow(theRunning)

  let theTurnEnded = false
  if (theTurn !== null && theTurn.end !== null) {
    theTurnEnded = true
  }
  let theCanSwap = false
  let thePlayers: Player[] = []
  if (theTeam !== null) {
    thePlayers = presentPlayers(theTeam, theAbsentIds)
    theCanSwap = thePlayers.length > 1
  }

  useHotkeys(
    {
      Enter: () => useGameStore.getState().markCorrect(Date.now()),
      s: () => useGameStore.getState().skipWord(Date.now()),
      Space: () => useGameStore.getState().togglePause(Date.now()),
      Escape: () => useGameStore.getState().endTurn(Date.now()),
      g: () => {
        if (theCanSwap) {
          useGameStore.getState().openSwap(Date.now())
        }
      },
      n: () => {
        if (theTurnEnded) {
          useGameStore.getState().nextTeam(Date.now())
        }
      },
    },
    theIsControl && theGame.phase === 'live' && theTurn !== null,
  )

  if (theGame.phase !== 'live' || theTurn === null || theTeam === null) {
    return <LiveEmptyState phase={theGame.phase} projector={!theIsControl} />
  }

  const theTotalMs = theSettings.turnSeconds * 1000
  let theClock = theNow
  if (theTurn.pausedAt !== null) {
    theClock = theTurn.pausedAt
  } else if (theTurn.end !== null) {
    theClock = theTurn.end.at
  }
  const theMsLeft = Math.min(theTotalMs, remainingMs(theTurn.startedAt, null, theClock, theSettings.turnSeconds))
  const theCounting = theClock < theTurn.startedAt
  const thePaused = theTurn.pausedAt !== null
  const theSkipsLeft = Math.max(0, theSettings.skipsPerTurn - theTurn.skipsUsed)

  let theTotalPoints = 0
  for (let n = 0; n < theStandings.length; n++) {
    if (theStandings[n].teamId === theTeam.id) {
      theTotalPoints = theStandings[n].points
    }
  }
  let theTurnPoints = 0
  for (let n = 0; n < theGame.history.length; n++) {
    if (theGame.history[n].turnId === theTurn.turnId) {
      theTurnPoints = theTurnPoints + theGame.history[n].points
    }
  }

  let theStage = <WordDisplay word={theTurn.word.word} />
  if (theCounting) {
    theStage = (
      <CountdownDisplay secondsLeft={Math.ceil((theTurn.startedAt - theClock) / 1000)} teamName={theTeam.name} guesser={theTurn.guesser} />
    )
  }

  let theStatus = <CareerCard />
  if (thePaused && !theTurnEnded) {
    let thePausedText = 'Paused'
    if (theTurn.swapOpen) {
      thePausedText = 'Paused, swapping guesser'
    }
    theStatus = (
      <div className="display bg-gold px-10 pt-2 pb-1 text-[clamp(40px,6vh,68px)] text-gold-ink" role="status">
        {thePausedText}
      </div>
    )
  }

  let theCenter = <LiveTurnStats turnPoints={theTurnPoints} skipsLeft={theSkipsLeft} size="lg" />
  let thePanelStats = null
  if (theIsControl) {
    thePanelStats = <LiveTurnStats turnPoints={theTurnPoints} skipsLeft={theSkipsLeft} size="sm" />
    theCenter = (
      <LiveControls
        paused={thePaused}
        counting={theCounting}
        skipsLeft={theSkipsLeft}
        onCorrect={() => useGameStore.getState().markCorrect(Date.now())}
        onSkip={() => useGameStore.getState().skipWord(Date.now())}
        onPause={() => useGameStore.getState().togglePause(Date.now())}
        onEnd={() => useGameStore.getState().endTurn(Date.now())}
        onUndo={undoWithToast}
      />
    )
  }

  let theBanner = null
  if (theTurn.end !== null) {
    theBanner = (
      <ResultBanner
        key={theTurn.turnId}
        end={theTurn.end}
        revealWord={theSettings.revealOnTimeUp}
        autoAdvance={theSettings.autoAdvance}
        showNextButton={theIsControl}
        onNext={() => useGameStore.getState().nextTeam(Date.now())}
      />
    )
  }

  let theSwapModal = null
  if (theIsControl) {
    theSwapModal = (
      <SwapModal
        open={theTurn.swapOpen && !theTurnEnded}
        players={thePlayers}
        currentId={theTurn.guesserId}
        onPick={(thePlayerId) => useGameStore.getState().swapGuesser(thePlayerId, Date.now())}
        onClose={() => useGameStore.getState().closeSwap(Date.now())}
      />
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <section className="relative flex h-full flex-col overflow-hidden bg-bg" style={{ ['--timer-ring' as string]: 'clamp(280px, 38vh, 420px)' }} aria-label="Live turn">
        <StandingsStrip standings={theStandings} currentTeamId={theTeam.id} round={theGame.round} roundsPerGame={theSettings.roundsPerGame} />
        <div className="relative flex min-h-0 flex-1 flex-col items-center">
          <div className="flex h-[clamp(56px,9vh,96px)] shrink-0 items-center justify-center">{theStatus}</div>
          <div className="min-h-0 w-full flex-1 px-6 pb-[2vh]">{theStage}</div>
        </div>
        <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-6 bg-surface-3 py-4 pl-6">
          <TimerRing msLeft={theMsLeft} totalMs={theTotalMs} paused={thePaused} />
          <div className="flex items-center justify-center">{theCenter}</div>
          <LiveTeamPanel
            teamName={theTeam.name}
            teamColor={theTeam.color}
            totalPoints={theTotalPoints}
            stats={thePanelStats}
            guesser={theTurn.guesser}
            showSwap={theIsControl && theCanSwap}
            onSwap={() => useGameStore.getState().openSwap(Date.now())}
          />
        </div>
        {theBanner}
        {theSwapModal}
      </section>
    </MotionConfig>
  )
}
