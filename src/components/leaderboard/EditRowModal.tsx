import { useState } from 'react'
import { toast } from 'sonner'
import { outcomeLabel, reviseRow } from '../../engine/scoring'
import type { EditableOutcome } from '../../engine/scoring'
import type { TurnResult } from '../../engine/types'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Segmented from '../ui/Segmented'

type EditRowModalProps = {
  row: TurnResult | null
  teamName: string
  onClose: () => void
}

const theOutcomeOptions = [
  { value: 'correct', label: 'Correct' },
  { value: 'skip', label: 'Skip' },
  { value: 'timeup', label: 'Time up' },
]

function asEditable(theValue: string): EditableOutcome {
  if (theValue === 'correct' || theValue === 'skip') {
    return theValue
  }
  return 'timeup'
}

export default function EditRowModal({ row, teamName, onClose }: EditRowModalProps) {
  const theSettings = useGameStore((theState) => theState.settings)
  const theCommitted = useGameStore((theState) => theState.game.committed && theState.game.classId !== null)
  const updateHistoryRow = useGameStore((theState) => theState.updateHistoryRow)
  const removeHistoryRow = useGameStore((theState) => theState.removeHistoryRow)
  const [theRowId, setTheRowId] = useState('')
  const [theChoice, setTheChoice] = useState<EditableOutcome>('correct')
  const [theConfirmRemove, setTheConfirmRemove] = useState(false)

  // The draft resets whenever a different row opens, without an effect.
  if (row !== null && row.id !== theRowId) {
    setTheRowId(row.id)
    setTheChoice(asEditable(row.outcome))
    setTheConfirmRemove(false)
  }

  if (row === null) {
    if (theRowId !== '') {
      setTheRowId('')
    }
    return null
  }
  const theRow = row
  const theIsAdjust = theRow.outcome === 'adjust'

  let theTitle = 'Change ' + theRow.word
  let theDescription = teamName + ', round ' + String(theRow.round) + '. Points recount from the seconds left when it happened.'
  if (theIsAdjust) {
    theTitle = 'Remove score edit'
    theDescription = teamName + ': ' + theRow.note
  }
  if (theCommitted) {
    theDescription = theDescription + ' Career and class totals update too.'
  }

  function save() {
    updateHistoryRow(theRow.id, theChoice)
    toast.success(theRow.word + ' changed to ' + outcomeLabel(theChoice))
    onClose()
  }

  function remove() {
    if (!theConfirmRemove) {
      setTheConfirmRemove(true)
      return
    }
    removeHistoryRow(theRow.id)
    let theWhat = theRow.word
    if (theIsAdjust) {
      theWhat = 'Score edit'
    }
    toast.success(theWhat + ' removed from ' + teamName)
    onClose()
  }

  let theRemoveLabel = 'Remove row'
  if (theConfirmRemove) {
    theRemoveLabel = 'Click again to remove'
  }

  let theOutcomePicker = null
  let theSaveButton = null
  if (!theIsAdjust) {
    const thePreview = reviseRow(theRow, theChoice, theSettings.pointsPerCorrect, theSettings.timeBonus)
    let thePointsWord = ' points'
    if (thePreview.points === 1) {
      thePointsWord = ' point'
    }
    theOutcomePicker = (
      <div className="mb-6">
        <p className="label mb-2">Outcome</p>
        <Segmented label="Outcome" value={theChoice} options={theOutcomeOptions} onChange={(theValue) => setTheChoice(asEditable(theValue))} />
        <p className="mt-3 text-lg">
          Worth <span className="display tabular text-3xl text-gold">{thePreview.points}</span>
          {thePointsWord}, {theRow.secondsLeft} s left
        </p>
      </div>
    )
    theSaveButton = (
      <Button variant="primary" size="lg" onClick={save} disabled={theChoice === theRow.outcome}>
        Save
      </Button>
    )
  }

  return (
    <Modal open={true} onOpenChange={(theOpen) => { if (!theOpen) { onClose() } }} title={theTitle} description={theDescription} width="max-w-lg">
      {theOutcomePicker}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="danger" size="lg" onClick={remove}>
          {theRemoveLabel}
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancel
          </Button>
          {theSaveButton}
        </div>
      </div>
    </Modal>
  )
}
