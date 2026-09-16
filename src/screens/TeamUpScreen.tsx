import { useState } from 'react'
import { MotionConfig } from 'motion/react'
import LiveEmptyState from '../components/live/LiveEmptyState'
import RoundLabel from '../components/live/RoundLabel'
import GuesserPicker from '../components/teamup/GuesserPicker'
import HandoffPanel from '../components/teamup/HandoffPanel'
import StillToGuess from '../components/teamup/StillToGuess'
import TeamBanner from '../components/teamup/TeamBanner'
import TeamUpStandings from '../components/teamup/TeamUpStandings'
import { playerName, playersYetToGuess, presentPlayers, resolveGuesserId } from '../engine/rotation'
import { useAbsentIds, useCurrentTeam, useStandings } from '../hooks/useGameView'
import { useHotkeys } from '../hooks/useHotkeys'
import { useGameStore } from '../store/useGameStore'

export type ScreenMode = 'control' | 'projector'

function startTurnNow() {
  useGameStore.getState().startTurn(Date.now())
}

// H only pauses a running hand-off or resumes a held one; in manual hand-off mode it must not start a countdown.
function toggleHold() {
  const theState = useGameStore.getState()
  if (theState.game.handoffEndsAt !== null) {
    theState.holdHandoff(true, Date.now())
  } else if (theState.game.handoffHeld) {
    theState.holdHandoff(false, Date.now())
  }
}

export default function TeamUpScreen({ mode }: { mode: ScreenMode }) {
  const theGame = useGameStore((theState) => theState.game)
  const theSettings = useGameStore((theState) => theState.settings)
  const theTeam = useCurrentTeam()
  const theStandings = useStandings()
  const theAbsentIds = useAbsentIds()
  const [thePickerOpens, setThePickerOpens] = useState(0)
  const theIsControl = mode === 'control'

  let theHasPlayers = false
  if (theTeam !== null) {
    theHasPlayers = presentPlayers(theTeam, theAbsentIds).length > 0
  }

  useHotkeys(
    {
      Space: startTurnNow,
      Enter: startTurnNow,
      n: startTurnNow,
      h: toggleHold,
      x: () => useGameStore.getState().skipTeam(Date.now()),
      g: () => {
        if (theHasPlayers) {
          setThePickerOpens(thePickerOpens + 1)
        }
      },
    },
    theIsControl && theGame.phase === 'teamup',
  )

  if (theGame.phase !== 'teamup' || theTeam === null) {
    return <LiveEmptyState phase={theGame.phase} projector={!theIsControl} />
  }

  const theGuesserId = resolveGuesserId(theTeam, theGame.turnsLog, theAbsentIds)
  const theGuesserName = playerName(theTeam, theGuesserId)

  let theGuesserLine = <p className="display pt-[0.06em] text-[clamp(48px,9vh,120px)]">Guesser, turn around</p>
  if (theGuesserName.length > 0) {
    theGuesserLine = (
      <p className="display pt-[0.06em] text-[clamp(48px,9vh,120px)]">
        {theGuesserName} <span className="text-muted">is guessing</span>
      </p>
    )
  }

  let theRoster = null
  if (theHasPlayers) {
    let thePicker = null
    if (theIsControl) {
      thePicker = (
        <GuesserPicker
          team={theTeam}
          turnsLog={theGame.turnsLog}
          absentIds={theAbsentIds}
          value={theGuesserId}
          openCount={thePickerOpens}
          onPick={(thePlayerId) => useGameStore.getState().pickGuesser(theTeam.id, thePlayerId)}
        />
      )
    }
    theRoster = (
      <div className="flex flex-col gap-3">
        {thePicker}
        <StillToGuess players={playersYetToGuess(theTeam, theGame.turnsLog, theAbsentIds)} teamColor={theTeam.color} />
      </div>
    )
  }

  let theWarning = null
  if (theGame.poolWarning.length > 0) {
    theWarning = (
      <p className="text-lg font-semibold text-warn" role="status">
        Word pool ran low, widened to: {theGame.poolWarning.join(', ')}
      </p>
    )
  }

  // The control window shows the round in the top bar; the projector has no top bar, so it keeps its own.
  let theRoundLabel = null
  if (!theIsControl) {
    theRoundLabel = <RoundLabel round={theGame.round} roundsPerGame={theSettings.roundsPerGame} className="display text-[clamp(28px,4vh,44px)] text-gold" />
  }

  return (
    <MotionConfig reducedMotion="user">
      <section
        className="grid h-full grid-cols-[minmax(0,1fr)_clamp(300px,27vw,480px)] gap-[clamp(20px,3vw,56px)] overflow-hidden bg-bg p-[clamp(20px,4vh,48px)]"
        aria-label="Team up"
      >
        <div className="flex min-h-0 min-w-0 flex-col justify-between gap-[3vh]">
          <div className="flex flex-col gap-[2.4vh]">
            {theRoundLabel}
            <TeamBanner key={theTeam.id + '-' + String(theGame.turnsLog.length)} teamName={theTeam.name} teamColor={theTeam.color} />
            {theGuesserLine}
            {theRoster}
          </div>
          <div className="flex flex-col gap-3 border-t-4 border-surface-3 pt-[3vh]">
            <HandoffPanel
              endsAt={theGame.handoffEndsAt}
              held={theGame.handoffHeld}
              handoffSeconds={theSettings.handoffSeconds}
              projector={!theIsControl}
              onStart={startTurnNow}
              onHold={(theHeld) => useGameStore.getState().holdHandoff(theHeld, Date.now())}
              onSkipTeam={() => useGameStore.getState().skipTeam(Date.now())}
            />
            {theWarning}
          </div>
        </div>
        <TeamUpStandings standings={theStandings} currentTeamId={theTeam.id} control={theIsControl} />
      </section>
    </MotionConfig>
  )
}
