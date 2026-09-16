import { MAX_TEAMS, MIN_TEAMS } from '../../engine/defaults'
import { absentIds } from '../../engine/roster'
import { findClass, useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import Stepper from '../ui/Stepper'
import TeamEditorRow from './TeamEditorRow'
import { playersText, teamsComeFromClass } from './setupHelpers'

export default function QuickTeamsPanel({ onOpenClasses }: { onOpenClasses: () => void }) {
  const theTeams = useGameStore((theState) => theState.teams)
  const theLastTeams = useGameStore((theState) => theState.lastTeams)
  const theClasses = useGameStore((theState) => theState.classes)
  const theActiveClassId = useGameStore((theState) => theState.activeClassId)
  const setTeamCount = useGameStore((theState) => theState.setTeamCount)
  const loadLastTeams = useGameStore((theState) => theState.loadLastTeams)
  const startGame = useGameStore((theState) => theState.startGame)

  const theClass = findClass(theClasses, theActiveClassId)
  const theFromClass = teamsComeFromClass(theTeams, theClass)
  const theAbsentIds = absentIds(theClass)

  const theRows = []
  for (let n = 0; n < theTeams.length; n++) {
    // The key includes the roster so loading or splitting teams resets each row's unsaved draft.
    theRows.push(<TeamEditorRow key={theTeams[n].id + '|' + playersText(theTeams[n])} team={theTeams[n]} index={n} lockedPlayers={theFromClass} hiddenIds={theAbsentIds} />)
  }

  let theClassNote = null
  if (theFromClass && theClass !== null) {
    theClassNote = (
      <div className="mb-1 flex items-center justify-between gap-3 border-l-8 border-gold bg-surface-2 py-2 pr-2 pl-4">
        <span>
          Teams from <strong className="font-bold">{theClass.name}</strong>. Career stats count.
        </span>
        <Button variant="ghost" size="sm" onClick={onOpenClasses}>
          Move students
        </Button>
      </div>
    )
  }

  let theLoadHint: string | undefined = undefined
  if (theLastTeams.length < MIN_TEAMS) {
    theLoadHint = 'Play one game first'
  }

  function handleStart() {
    // Flushes a focused player list so names typed right before Start are not lost.
    if (document.activeElement instanceof HTMLTextAreaElement) {
      document.activeElement.blur()
    }
    if (theFromClass) {
      startGame('class')
    } else {
      startGame('quick')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-4">
        <div className="flex items-center gap-3">
          <span className="label text-base">Teams</span>
          <Stepper label="team count" value={theTeams.length} min={MIN_TEAMS} max={MAX_TEAMS} onChange={setTeamCount} />
        </div>
        <Button variant="ghost" size="md" className="ml-auto" onClick={loadLastTeams} disabled={theLastTeams.length < MIN_TEAMS} title={theLoadHint}>
          Load last game's teams
        </Button>
      </div>
      {theClassNote}
      <ol className="scroll-area flex min-h-0 flex-1 flex-col gap-1">{theRows}</ol>
      <div className="mt-4 flex items-center justify-between gap-4 border-t-4 border-surface-2 pt-4">
        <p className="label">Names are optional.</p>
        <Button variant="primary" size="lg" className="shrink-0" onClick={handleStart}>
          Start with these teams
        </Button>
      </div>
    </div>
  )
}
