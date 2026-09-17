import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { comparePlayerPlace, playerStatsFor } from '../../engine/career'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import EmptyPanel from './EmptyPanel'
import { PLAYER_GRID } from './grids'
import PlayerRow from './PlayerRow'

export default function PlayersTab() {
  const theNavigate = useNavigate()
  const theTeams = useGameStore((theState) => theState.teams)
  const theGame = useGameStore((theState) => theState.game)
  const theStats = useMemo(() => playerStatsFor(theTeams, theGame), [theTeams, theGame])

  if (theStats.length === 0) {
    return (
      <EmptyPanel
        title="No named players"
        body="Add student names to teams, or play a class game, to see turns, correct guesses, skips, and best times for each player."
        action={
          <Button variant="primary" size="lg" onClick={() => theNavigate('/')}>
            Go to Setup
          </Button>
        }
      />
    )
  }

  const theRows = []
  let theRank = 0
  for (let n = 0; n < theStats.length; n++) {
    const theStat = theStats[n]
    // Players level on correct and best time share a place, the same way tied teams do.
    if (n === 0 || comparePlayerPlace(theStats[n - 1], theStat) !== 0) {
      theRank = n + 1
    }
    theRows.push(<PlayerRow key={theStat.playerId} stat={theStat} rank={theRank} striped={n % 2 === 1} />)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-2 text-sm text-muted">This game only. Each student's lifetime totals are on Setup, under Classes.</p>
      <div className={'label border-l-8 border-transparent pr-5 pb-2 pl-3 ' + PLAYER_GRID}>
        <span className="text-center">Place</span>
        <span>Player</span>
        <span>Team</span>
        <span className="text-right">Turns</span>
        <span className="text-right">Correct</span>
        <span className="text-right">Skips</span>
        <span className="text-right">Best time</span>
      </div>
      <ol className="scroll-area flex min-h-0 flex-1 flex-col" aria-label="Player stats this game">
        {theRows}
      </ol>
    </div>
  )
}
