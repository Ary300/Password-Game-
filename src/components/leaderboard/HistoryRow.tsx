import { Pencil } from 'lucide-react'
import type { Team, TurnResult } from '../../engine/types'
import { HISTORY_GRID } from './grids'
import OutcomeChip from './OutcomeChip'

type HistoryRowProps = {
  row: TurnResult
  team: Team | null
  onEdit: (theRow: TurnResult) => void
}

export default function HistoryRow({ row, team, onEdit }: HistoryRowProps) {
  let theTeamName = 'Removed team'
  let theTeamColor = 'var(--faint)'
  if (team !== null) {
    theTeamName = team.name
    theTeamColor = team.color
  }

  let thePoints = String(row.points)
  let thePointsTone = 'text-faint'
  if (row.points > 0) {
    thePoints = '+' + String(row.points)
    thePointsTone = 'text-gold'
  }
  if (row.points < 0) {
    thePointsTone = 'text-bad'
  }

  const theTeamCell = (
    <span className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden="true" className="h-3 w-3 shrink-0" style={{ backgroundColor: theTeamColor }} />
      <span className="truncate text-base font-bold">{theTeamName}</span>
    </span>
  )

  let theEditLabel = 'Change or remove ' + row.word + ' for ' + theTeamName
  if (row.outcome === 'adjust') {
    theEditLabel = 'Remove score edit for ' + theTeamName
  }
  const theEditButton = (
    <button
      type="button"
      onClick={() => onEdit(row)}
      aria-label={theEditLabel}
      title="Change or remove this row"
      className="flex h-10 w-10 items-center justify-center justify-self-end text-muted transition-colors hover:bg-surface-3 hover:text-text"
    >
      <Pencil size={18} aria-hidden="true" />
    </button>
  )

  if (row.outcome === 'adjust') {
    return (
      <li className={'border-b border-line py-2 pr-2 pl-3 ' + HISTORY_GRID}>
        {theTeamCell}
        <span className="col-span-2 truncate text-base text-gold">{row.note}</span>
        <OutcomeChip outcome={row.outcome} />
        <span aria-hidden="true" />
        <span className={'display tabular text-right text-3xl ' + thePointsTone}>{thePoints}</span>
        {theEditButton}
      </li>
    )
  }

  let theSwapped = null
  if (row.swappedFrom.length > 0) {
    theSwapped = <span className="label block truncate">Swapped from {row.swappedFrom.join(', ')}</span>
  }
  let theGuesser = row.guesser
  if (theGuesser.trim() === '') {
    theGuesser = 'Whole team'
  }

  let theWordTone = 'text-text'
  if (row.outcome === 'skip') {
    theWordTone = 'text-muted line-through decoration-2'
  }
  if (row.outcome === 'timeup') {
    theWordTone = 'text-muted'
  }

  let theNote = null
  if (row.note.length > 0) {
    theNote = <span className="label block truncate" title={row.note}>{row.note}</span>
  }

  return (
    <li className={'border-b border-line py-2 pr-2 pl-3 ' + HISTORY_GRID}>
      {theTeamCell}
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-base">{theGuesser}</span>
        {theSwapped}
      </span>
      <span className={'display truncate pt-0.5 pb-[0.2em] text-3xl ' + theWordTone}>{row.word}</span>
      <span className="min-w-0 leading-tight">
        <OutcomeChip outcome={row.outcome} />
        {theNote}
      </span>
      <span className="tabular text-right text-base text-muted">{row.secondsLeft} s</span>
      <span className={'display tabular text-right text-3xl ' + thePointsTone}>{thePoints}</span>
      {theEditButton}
    </li>
  )
}
