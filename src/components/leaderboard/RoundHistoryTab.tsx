import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Team, TurnResult } from '../../engine/types'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import EditRowModal from './EditRowModal'
import EmptyPanel from './EmptyPanel'
import { HISTORY_GRID } from './grids'
import HistoryRow from './HistoryRow'

type RoundGroup = {
  round: number
  rows: TurnResult[]
}

function findTeam(theTeams: Team[], theTeamId: string): Team | null {
  for (let n = 0; n < theTeams.length; n++) {
    if (theTeams[n].id === theTeamId) {
      return theTeams[n]
    }
  }
  return null
}

// History is stored oldest first, so walking it backwards gives newest-first rounds without re-sorting.
function groupNewestFirst(theHistory: TurnResult[]): RoundGroup[] {
  const theGroups: RoundGroup[] = []
  for (let n = theHistory.length - 1; n >= 0; n--) {
    const theRow = theHistory[n]
    const theLast = theGroups[theGroups.length - 1]
    if (theLast === undefined || theLast.round !== theRow.round) {
      theGroups.push({ round: theRow.round, rows: [theRow] })
    } else {
      theLast.rows.push(theRow)
    }
  }
  return theGroups
}

export default function RoundHistoryTab() {
  const theNavigate = useNavigate()
  const theTeams = useGameStore((theState) => theState.teams)
  const theHistory = useGameStore((theState) => theState.game.history)
  const [theEditingId, setTheEditingId] = useState<string | null>(null)

  if (theHistory.length === 0) {
    return (
      <EmptyPanel
        title="Nothing logged yet"
        body="Guesses, skips, and score edits land here as teams play."
        action={
          <Button variant="primary" size="lg" onClick={() => theNavigate('/')}>
            Start a game
          </Button>
        }
      />
    )
  }

  // Looked up by id so the modal always shows the stored row, even right after it changes.
  let theEditingRow: TurnResult | null = null
  let theEditingTeam = ''
  for (let n = 0; n < theHistory.length; n++) {
    if (theHistory[n].id === theEditingId) {
      theEditingRow = theHistory[n]
      const theTeam = findTeam(theTeams, theHistory[n].teamId)
      if (theTeam !== null) {
        theEditingTeam = theTeam.name
      }
    }
  }

  const theGroups = groupNewestFirst(theHistory)
  const theSections = []
  for (let n = 0; n < theGroups.length; n++) {
    const theGroup = theGroups[n]
    let theCorrect = 0
    let thePoints = 0
    const theItems = []
    for (let i = 0; i < theGroup.rows.length; i++) {
      const theRow = theGroup.rows[i]
      if (theRow.outcome === 'correct') {
        theCorrect = theCorrect + 1
      }
      thePoints = thePoints + theRow.points
      theItems.push(<HistoryRow key={theRow.id} row={theRow} team={findTeam(theTeams, theRow.teamId)} onEdit={(theClicked) => setTheEditingId(theClicked.id)} />)
    }
    let thePointWord = 'points'
    if (thePoints === 1 || thePoints === -1) {
      thePointWord = 'point'
    }
    theSections.push(
      <section key={'round-' + String(theGroup.round) + '-' + String(n)} aria-label={'Round ' + String(theGroup.round)}>
        <header className="sticky top-0 z-10 flex items-end justify-between bg-surface-3 py-2 pr-4 pl-3">
          <h3 className="display text-4xl">Round {theGroup.round}</h3>
          <span className="label tabular">
            {theCorrect} correct, {thePoints} {thePointWord}
          </span>
        </header>
        <ul>{theItems}</ul>
      </section>,
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={'label border-b-2 border-surface-3 pr-2 pb-2 pl-3 ' + HISTORY_GRID}>
        <span>Team</span>
        <span>Guesser</span>
        <span>Word</span>
        <span>Outcome</span>
        <span className="text-right">Time left</span>
        <span className="text-right">Points</span>
        <span className="sr-only">Change</span>
      </div>
      <div className="scroll-area flex min-h-0 flex-1 flex-col gap-5 bg-surface">{theSections}</div>
      <EditRowModal row={theEditingRow} teamName={theEditingTeam} onClose={() => setTheEditingId(null)} />
    </div>
  )
}
