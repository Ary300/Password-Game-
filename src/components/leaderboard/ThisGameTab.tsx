import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resultsToCsv } from '../../engine/csv'
import { useStandings } from '../../hooks/useGameView'
import { routeForPhase } from '../../hooks/usePhaseRoute'
import { downloadText } from '../../lib/download'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import EmptyPanel from './EmptyPanel'
import EndGameModal from './EndGameModal'
import { STANDING_GRID } from './grids'
import StandingRow from './StandingRow'

export default function ThisGameTab() {
  const theNavigate = useNavigate()
  const theStandings = useStandings()
  const theTeams = useGameStore((theState) => theState.teams)
  const theGame = useGameStore((theState) => theState.game)
  const endGame = useGameStore((theState) => theState.endGame)
  const [theConfirmOpen, setTheConfirmOpen] = useState(false)

  const theInProgress = theGame.phase === 'teamup' || theGame.phase === 'live'
  let theResumeButton = null
  if (theInProgress) {
    theResumeButton = (
      <Button variant="primary" size="lg" onClick={() => theNavigate(routeForPhase(theGame.phase))}>
        Resume game
      </Button>
    )
  }

  if (theGame.history.length === 0 && theGame.turnsLog.length === 0) {
    let theAction = (
      <Button variant="primary" size="lg" onClick={() => theNavigate('/')}>
        Start a game
      </Button>
    )
    if (theResumeButton !== null) {
      theAction = theResumeButton
    }
    return <EmptyPanel title="No scores yet" body="Points show up here after the first turn." action={theAction} />
  }

  function exportCsv() {
    downloadText('park-tudor-password-results.csv', resultsToCsv(theStandings, theTeams, theGame.history), 'text/csv')
  }

  function confirmEnd() {
    setTheConfirmOpen(false)
    endGame()
    // The phase router leaves the leaderboard alone, so the podium has to be opened by hand here.
    theNavigate('/podium')
  }

  let theMaxPoints = 0
  let theCorrectTotal = 0
  for (let n = 0; n < theStandings.length; n++) {
    if (theStandings[n].points > theMaxPoints) {
      theMaxPoints = theStandings[n].points
    }
    theCorrectTotal = theCorrectTotal + theStandings[n].correct
  }

  const theRows = []
  for (let n = 0; n < theStandings.length; n++) {
    const theStanding = theStandings[n]
    let theTied = false
    if (n > 0 && theStandings[n - 1].rank === theStanding.rank) {
      theTied = true
    }
    if (n < theStandings.length - 1 && theStandings[n + 1].rank === theStanding.rank) {
      theTied = true
    }
    theRows.push(<StandingRow key={theStanding.teamId} standing={theStanding} maxPoints={theMaxPoints} tied={theTied} striped={n % 2 === 1} />)
  }

  let theEndButton = null
  if (theInProgress) {
    theEndButton = (
      <Button variant="danger" size="lg" onClick={() => setTheConfirmOpen(true)}>
        End game
      </Button>
    )
  }
  let thePodiumButton = null
  if (theGame.phase === 'podium') {
    thePodiumButton = (
      <Button variant="gold" size="lg" onClick={() => theNavigate('/podium')}>
        View podium
      </Button>
    )
  }

  let theStatus = 'Final'
  if (theInProgress) {
    theStatus = 'Round ' + String(theGame.round)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <dl className="flex items-end gap-8">
          <div>
            <dt className="label">Game</dt>
            <dd className="display tabular mt-1 text-4xl">{theStatus}</dd>
          </div>
          <div>
            <dt className="label">Turns</dt>
            <dd className="display tabular mt-1 text-4xl">{theGame.turnsLog.length}</dd>
          </div>
          <div>
            <dt className="label">Words guessed</dt>
            <dd className="display tabular mt-1 text-4xl">{theCorrectTotal}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="lg" onClick={exportCsv}>
            Export CSV
          </Button>
          {theEndButton}
          {thePodiumButton}
          {theResumeButton}
        </div>
      </div>
      <div className={'label border-l-8 border-transparent pr-5 pb-2 pl-3 ' + STANDING_GRID}>
        <span className="text-center">Rank</span>
        <span>Team</span>
        <span className="text-right">Points, click to edit</span>
        <span className="text-right">Correct</span>
        <span className="text-right">Skipped</span>
        <span className="text-right">Turns</span>
      </div>
      <ol className="scroll-area flex min-h-0 flex-1 flex-col" aria-label="Team standings">
        {theRows}
      </ol>
      <EndGameModal open={theConfirmOpen} classGame={theGame.classId !== null} onOpenChange={setTheConfirmOpen} onConfirm={confirmEnd} />
    </div>
  )
}
