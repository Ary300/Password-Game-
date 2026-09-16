import type { TurnOutcome } from '../../engine/types'

export default function OutcomeChip({ outcome }: { outcome: TurnOutcome }) {
  let theLabel = 'Correct'
  let theBlock = 'bg-good'
  let theText = 'text-good'
  if (outcome === 'skip') {
    theLabel = 'Skip'
    theBlock = 'bg-faint'
    theText = 'text-muted'
  }
  if (outcome === 'timeup') {
    theLabel = 'Time up'
    theBlock = 'bg-bad'
    theText = 'text-bad'
  }
  if (outcome === 'adjust') {
    theLabel = 'Score edit'
    theBlock = 'bg-gold'
    theText = 'text-gold'
  }
  return (
    <span className={'flex items-center gap-2 text-base font-bold whitespace-nowrap ' + theText}>
      <span aria-hidden="true" className={'h-3 w-3 shrink-0 ' + theBlock} />
      {theLabel}
    </span>
  )
}
