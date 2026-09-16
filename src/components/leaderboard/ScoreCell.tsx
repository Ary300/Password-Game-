import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { useGameStore } from '../../store/useGameStore'

type ScoreCellProps = {
  teamId: string
  teamName: string
  points: number
}

export default function ScoreCell({ teamId, teamName, points }: ScoreCellProps) {
  const editTeamScore = useGameStore((theState) => theState.editTeamScore)
  const [theEditing, setTheEditing] = useState(false)
  const [theDraft, setTheDraft] = useState('')

  function startEdit() {
    setTheDraft(String(points))
    setTheEditing(true)
  }

  function save() {
    const theValue = Number(theDraft.trim())
    if (theDraft.trim() === '' || !Number.isInteger(theValue)) {
      toast.error('Type a whole number to set ' + teamName + "'s score")
      return
    }
    setTheEditing(false)
    if (theValue === points) {
      return
    }
    editTeamScore(teamId, theValue, points)
    toast.success(teamName + ' set to ' + String(theValue) + '. Press U to undo.')
  }

  function onKey(theEvent: KeyboardEvent<HTMLInputElement>) {
    // Stops the leaderboard's own Escape from leaving the screen while the teacher only meant to cancel.
    if (theEvent.key === 'Escape') {
      theEvent.preventDefault()
      theEvent.stopPropagation()
      setTheEditing(false)
    }
    if (theEvent.key === 'Enter') {
      theEvent.preventDefault()
      save()
    }
  }

  if (theEditing) {
    return (
      <div className="flex flex-col items-end">
        <input
          type="number"
          step={1}
          inputMode="numeric"
          autoFocus
          onFocus={(theEvent) => theEvent.currentTarget.select()}
          value={theDraft}
          onChange={(theEvent) => setTheDraft(theEvent.target.value)}
          onKeyDown={onKey}
          onBlur={() => setTheEditing(false)}
          aria-label={'New score for ' + teamName}
          className="display tabular h-16 w-36 border-4 border-gold bg-bg px-3 text-right text-5xl text-gold outline-none"
        />
        <span className="label mt-1 whitespace-nowrap">Enter saves, Esc cancels</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      title={'Edit ' + teamName + "'s score"}
      aria-label={'Edit score for ' + teamName + ', now ' + String(points)}
      className="display tabular -my-2 px-3 py-2 text-right text-7xl text-gold transition-colors hover:bg-bg hover:shadow-[inset_0_-4px_0_0_var(--gold)]"
    >
      {points}
    </button>
  )
}
