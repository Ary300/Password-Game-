import { useState } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Toggle from '../ui/Toggle'

type ResetClassModalProps = {
  classTitle: string
  playingNow: boolean
  onCancel: () => void
  onConfirm: (theCareersToo: boolean) => void
}

export default function ResetClassModal({ classTitle, playingNow, onCancel, onConfirm }: ResetClassModalProps) {
  const [theCareersToo, setTheCareersToo] = useState(false)
  let theDescription = 'Games, turns, and correct guesses on the class board go back to zero. You cannot undo it.'
  if (playingNow) {
    theDescription = theDescription + ' The game in progress still counts when it ends.'
  }
  return (
    <Modal open={true} onOpenChange={(theOpen) => { if (!theOpen) { onCancel() } }} title={'Reset ' + classTitle + '?'} description={theDescription} width="max-w-lg">
      <Toggle
        label="Also clear student careers"
        description="Career correct, turns, skips, and best times, which also empties the top guessers list."
        checked={theCareersToo}
        onChange={setTheCareersToo}
      />
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" size="lg" onClick={onCancel}>
          Keep totals
        </Button>
        <Button variant="primary" size="lg" onClick={() => onConfirm(theCareersToo)}>
          Reset class
        </Button>
      </div>
    </Modal>
  )
}
