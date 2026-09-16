import { X } from 'lucide-react'
import type { Student } from '../../engine/types'

type StudentTileProps = {
  student: Student
  onToggleAbsent: () => void
  onRemove: () => void
}

export default function StudentTile({ student, onToggleAbsent, onRemove }: StudentTileProps) {
  let theNameStyle = 'block truncate text-base font-semibold text-text'
  let theMark = 'bg-good'
  let theStatus = 'Here'
  let theStatusStyle = 'text-good'
  if (student.absent) {
    theNameStyle = 'block truncate text-base font-semibold text-faint line-through'
    theMark = 'border-2 border-faint'
    theStatus = 'Absent'
    theStatusStyle = 'text-faint'
  }

  // Present is the normal case, so only an absence earns a word; the square already marks who is here.
  let theStatusTag = null
  if (student.absent) {
    theStatusTag = <span className={'shrink-0 text-sm font-bold ' + theStatusStyle}>{theStatus}</span>
  }

  let theCareer = 'No turns yet'
  if (student.career.turns > 0) {
    let theTurnWord = ' turns'
    if (student.career.turns === 1) {
      theTurnWord = ' turn'
    }
    theCareer = String(student.career.correct) + ' correct in ' + String(student.career.turns) + theTurnWord
  }

  return (
    <li className="group relative flex items-center border-b-2 border-surface-2">
      <button
        type="button"
        onClick={onToggleAbsent}
        aria-pressed={!student.absent}
        aria-label={student.name + ', ' + theStatus + '. Toggle attendance'}
        className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-9 pl-1 text-left hover:bg-surface"
      >
        <span aria-hidden="true" className={'h-3 w-3 shrink-0 ' + theMark} />
        <span className="min-w-0 flex-1">
          <span className={theNameStyle}>{student.name}</span>
          <span className="tabular block truncate text-sm text-muted">{theCareer}</span>
        </span>
        {theStatusTag}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={'Remove ' + student.name + ' from class'}
        title="Remove from class"
        className="absolute top-1/2 right-0 -translate-y-1/2 p-1.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-crimson hover:text-white focus-visible:opacity-100"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </li>
  )
}
