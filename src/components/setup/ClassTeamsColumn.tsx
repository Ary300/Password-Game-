import { useState } from 'react'
import { MAX_TEAMS, MIN_TEAMS } from '../../engine/defaults'
import type { ClassRoom } from '../../engine/types'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import Stepper from '../ui/Stepper'
import MoveStudentMenu from './MoveStudentMenu'
import { countPresent, findStudent, teamsComeFromClass } from './setupHelpers'

export default function ClassTeamsColumn({ classRoom }: { classRoom: ClassRoom }) {
  const theTeams = useGameStore((theState) => theState.teams)
  const theTeamCount = useGameStore((theState) => theState.settings.teamCount)
  const splitClassIntoTeams = useGameStore((theState) => theState.splitClassIntoTeams)
  const movePlayer = useGameStore((theState) => theState.movePlayer)
  const startGame = useGameStore((theState) => theState.startGame)
  const [theSplitCount, setTheSplitCount] = useState(theTeamCount)

  const thePresent = countPresent(classRoom)
  const theFromClass = teamsComeFromClass(theTeams, classRoom)

  let theMaxSplit = Math.min(MAX_TEAMS, thePresent)
  if (theMaxSplit < MIN_TEAMS) {
    theMaxSplit = MIN_TEAMS
  }
  const theSplit = Math.min(theSplitCount, theMaxSplit)

  let theBody = (
    <div className="py-8">
      <p className="display text-4xl text-muted">No teams yet</p>
      <p className="mt-2 max-w-[36ch] text-muted">Split the students who are here. Tap any name afterward to move them.</p>
    </div>
  )
  if (theFromClass) {
    const theBlocks = []
    for (let n = 0; n < theTeams.length; n++) {
      const theTeam = theTeams[n]
      const theChips = []
      for (let i = 0; i < theTeam.players.length; i++) {
        const thePlayer = theTeam.players[i]
        const theStudent = findStudent(classRoom, thePlayer.id)
        // Marking someone absent after the split hides them here, matching how the game skips them.
        if (theStudent !== null && theStudent.absent) {
          continue
        }
        theChips.push(
          <li key={thePlayer.id} className="min-w-0">
            <MoveStudentMenu player={thePlayer} currentTeamId={theTeam.id} teams={theTeams} onMove={(theTeamId) => movePlayer(thePlayer.id, theTeamId)} />
          </li>,
        )
      }
      let theEmpty = null
      if (theChips.length === 0) {
        theEmpty = <li className="label">Nobody yet</li>
      }
      theBlocks.push(
        <li key={theTeam.id} className="border-l-8 bg-surface py-2 pr-2 pl-3" style={{ borderLeftColor: theTeam.color }}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="display truncate text-2xl">{theTeam.name}</span>
            <span className="label tabular">{theChips.length}</span>
          </div>
          <ul className="flex flex-wrap gap-1">
            {theChips}
            {theEmpty}
          </ul>
        </li>,
      )
    }
    theBody = <ol className="flex flex-col gap-1 pt-2">{theBlocks}</ol>
  }

  let theSplitLabel = 'Split into ' + String(theSplit)
  if (theFromClass) {
    theSplitLabel = 'Reshuffle'
  }

  return (
    <section className="flex min-h-0 flex-col" aria-labelledby="class-teams-title">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-b-4 border-surface-3 pb-2">
        <h3 id="class-teams-title" className="display text-3xl whitespace-nowrap">
          Teams
        </h3>
        <div className="flex items-center gap-2">
          <Stepper label="teams to split into" value={theSplit} min={MIN_TEAMS} max={theMaxSplit} onChange={setTheSplitCount} />
          <Button variant="secondary" size="md" onClick={() => splitClassIntoTeams(classRoom.id, theSplit)} disabled={thePresent < MIN_TEAMS}>
            {theSplitLabel}
          </Button>
        </div>
      </div>
      <div className="scroll-area min-h-0 flex-1 pr-1">{theBody}</div>
      <Button variant="primary" size="lg" className="mt-3 w-full" onClick={() => startGame('class')} disabled={!theFromClass}>
        Start class game
      </Button>
    </section>
  )
}
