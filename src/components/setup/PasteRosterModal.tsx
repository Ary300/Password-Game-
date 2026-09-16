import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { MAX_TEAMS, MIN_TEAMS } from '../../engine/defaults'
import { parseRoster } from '../../engine/roster'
import { defaultTeamName } from '../../engine/teamColors'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

type PasteRosterModalProps = {
  open: boolean
  onOpenChange: (theOpen: boolean) => void
}

export default function PasteRosterModal({ open, onOpenChange }: PasteRosterModalProps) {
  const setTeamsFromRoster = useGameStore((theState) => theState.setTeamsFromRoster)
  const [theText, setTheText] = useState('')
  const theListId = useId()
  const theRoster = parseRoster(theText, MAX_TEAMS)

  const thePreview = []
  for (let n = 0; n < theRoster.teams.length; n++) {
    let theName = theRoster.teams[n].name
    if (theName.length === 0) {
      theName = defaultTeamName(n)
    }
    let theCount = 'no players'
    if (theRoster.teams[n].players.length === 1) {
      theCount = '1 player'
    } else if (theRoster.teams[n].players.length > 1) {
      theCount = String(theRoster.teams[n].players.length) + ' players'
    }
    thePreview.push(
      <li key={String(n)} className="flex items-baseline justify-between gap-3 border-b-2 border-surface-2 py-1">
        <span className="truncate font-semibold">{theName}</span>
        <span className="label tabular shrink-0">{theCount}</span>
      </li>,
    )
  }

  let theSummary = 'Nothing pasted yet'
  if (theRoster.teams.length === 1) {
    theSummary = '1 team, a second empty team is added'
  } else if (theRoster.teams.length > 1) {
    theSummary = String(theRoster.teams.length) + ' teams'
  }

  let theIgnoredNote = null
  if (theRoster.ignored > 0) {
    let theLineWord = ' lines'
    if (theRoster.ignored === 1) {
      theLineWord = ' line'
    }
    theIgnoredNote = (
      <p className="mt-2 text-sm font-semibold text-warn">
        Only {MAX_TEAMS} teams fit. The last {String(theRoster.ignored) + theLineWord} will be left out.
      </p>
    )
  }

  function handleOpenChange(theOpen: boolean) {
    if (!theOpen) {
      setTheText('')
    }
    onOpenChange(theOpen)
  }

  function handleSubmit(theEvent: FormEvent<HTMLFormElement>) {
    theEvent.preventDefault()
    if (theRoster.teams.length === 0) {
      return
    }
    setTeamsFromRoster(theText)
    handleOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Paste a roster"
      description={'One team per line, like Lions: Ana, Ben, Cy. This replaces the current ' + String(MIN_TEAMS) + ' to ' + String(MAX_TEAMS) + ' teams.'}
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor={theListId} className="label">
            Roster
          </label>
          <span className="label tabular" aria-live="polite">
            {theSummary}
          </span>
        </div>
        <textarea
          id={theListId}
          value={theText}
          onChange={(theEvent) => setTheText(theEvent.target.value)}
          rows={7}
          autoFocus
          spellCheck={false}
          placeholder={'Lions: Ana, Ben, Cy\nTigers: Dee, Eli, Fay\nBears'}
          className="scroll-area resize-none border-b-4 border-surface-3 bg-surface-2 px-3 py-2 text-base leading-relaxed text-text placeholder:text-faint focus:border-gold focus:outline-none"
        />
        {theIgnoredNote}
        <ol className="mt-1 max-h-48 overflow-y-auto" aria-label="Teams from this roster">
          {thePreview}
        </ol>
        <div className="mt-3 flex justify-end gap-3">
          <Button variant="secondary" size="md" onClick={() => handleOpenChange(false)}>
            Keep current teams
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={theRoster.teams.length === 0}>
            Use these teams
          </Button>
        </div>
      </form>
    </Modal>
  )
}
