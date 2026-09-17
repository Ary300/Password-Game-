import { MotionConfig } from 'motion/react'
import { toast } from 'sonner'
import CareerCard from '../components/live/CareerCard'
import CountdownDisplay from '../components/live/CountdownDisplay'
import EndGameButton from '../components/live/EndGameButton'
import LiveControls from '../components/live/LiveControls'
import LiveEmptyState from '../components/live/LiveEmptyState'
import LiveTeamPanel from '../components/live/LiveTeamPanel'
import LiveTurnStats from '../components/live/LiveTurnStats'
import ResultBanner from '../components/live/ResultBanner'
import ScoreNudge from '../components/live/ScoreNudge'
import { nudgeScore } from '../components/live/nudgeScore'
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
import { useGameStore, turnSecondsOf } from '../store/useGameStore'

export type ScreenMode = 'control' | 'projector'

function nudgeCurrentTeam(num: number) {
  const theTurn = useGameStore.getState().game.turn
  if (theTurn !== null) {
    nudgeScore(theTurn.teamId, num)
  }
}

// The banner hides the team panel, so the line names the team for a class reading the projector.
function pointsLine(theTeamName: string, thePoints: number, theBonus: number): string {
  let theVerb = ' scored '
  if (thePoints < 0) {
    theVerb = ' lost '
  }
  let theNoun = ' points this turn'
  if (Math.abs(thePoints) === 1) {
    theNoun = ' point this turn'
  }
  let theText = theTeamName + theVerb + String(Math.abs(thePoints)) + theNoun
  if (theBonus > 0) {
    theText = theText + ', ' + String(theBonus) + ' from time bonus'
  }
  return theText
}

// One toast slot for undo: stacked toasts at laptop height cover the banner's Undo and Next team buttons.
const UNDO_TOAST_ID = 'undo'

function undoWithToast() {
  const theLabel = useGameStore.getState().undo()
  if (theLabel === null) {
    toast('Nothing to undo in this turn', { id: UNDO_TOAST_ID })
    return
  }
  const theGame = useGameStore.getState().game
  if (theGame.phase === 'live' && theGame.turn !== null && theGame.turn.pausedAt !== null) {
    toast.success('Undone: ' + theLabel + '. Clock paused.', { id: UNDO_TOAST_ID })
  } else {
    toast.success('Undone: ' + theLabel, { id: UNDO_TOAST_ID })
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
      '+': () => nudgeCurrentTeam(1),
      '=': () => nudgeCurrentTeam(1),
      '-': () => nudgeCurrentTeam(-1),
    },
    theIsControl && theGame.phase === 'live' && theTurn !== null,
  )

  if (theGame.phase !== 'live' || theTurn === null || theTeam === null) {
    return <LiveEmptyState phase={theGame.phase} projector={!theIsControl} />
  }

  const theTotalMs = turnSecondsOf(theTurn, theSettings) * 1000
  let theClock = theNow
  if (theTurn.pausedAt !== null) {
    theClock = theTurn.pausedAt
  } else if (theTurn.end !== null) {
    theClock = theTurn.end.at
  }
  const theMsLeft = Math.min(theTotalMs, remainingMs(theTurn.startedAt, null, theClock, turnSecondsOf(theTurn, theSettings)))
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
  let theBonusPoints = 0
  for (let n = 0; n < theGame.history.length; n++) {
    const theRow = theGame.history[n]
    if (theRow.turnId === theTurn.turnId) {
      theTurnPoints = theTurnPoints + theRow.points
      if (theRow.outcome === 'correct') {
        theBonusPoints = theBonusPoints + Math.max(0, theRow.points - theSettings.pointsPerCorrect)
      }
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
      <div className="display bg-gold px-10 pt-1.5 pb-0.5 text-[clamp(28px,5.5vh,68px)] leading-none text-gold-ink" role="status">
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
        showPeek={theIsControl}
        pointsText={pointsLine(theTeam.name, theTurnPoints, theBonusPoints)}
        onNext={() => useGameStore.getState().nextTeam(Date.now())}
        onUndo={undoWithToast}
      />
    )
  }

  let theSwapModal = null
  let theEndGame = null
  let theScoreControl = null
  if (theIsControl) {
    theEndGame = <EndGameButton className="absolute top-3 right-4 z-10" />
    theScoreControl = <ScoreNudge teamId={theTeam.id} teamName={theTeam.name} direction="row" />
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
      <section className="relative flex h-full flex-col overflow-hidden bg-bg" style={{ ['--timer-ring' as string]: 'clamp(150px, min(38vh, 24vw), 420px)' }} aria-label="Live turn">
        <StandingsStrip standings={theStandings} currentTeamId={theTeam.id} round={theGame.round} roundsPerGame={theSettings.roundsPerGame} showRound={!theIsControl} />
        <div className="relative flex min-h-0 flex-1 flex-col items-center">
          {theEndGame}
          <div className="flex h-[clamp(48px,9vh,96px)] shrink-0 items-center justify-center overflow-hidden">{theStatus}</div>
          <div className="min-h-0 w-full flex-1 px-6 pb-[2vh]">{theStage}</div>
        </div>
        <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-8 border-t-8 bg-surface py-5 pl-8 max-[899px]:gap-4 max-[899px]:pl-4" style={{ borderColor: theTeam.color }}>
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
            scoreControl={theScoreControl}
          />
        </div>
        {theBanner}
        {theSwapModal}
      </section>
    </MotionConfig>
  )
}
