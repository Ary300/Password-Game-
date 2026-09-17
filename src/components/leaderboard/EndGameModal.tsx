import Button from '../ui/Button'
import Modal from '../ui/Modal'

type EndGameModalProps = {
  open: boolean
  classGame: boolean
  onOpenChange: (theOpen: boolean) => void
  onConfirm: () => void
}

export default function EndGameModal({ open, classGame, onOpenChange, onConfirm }: EndGameModalProps) {
  let theDescription = 'Scores lock and the podium goes up.'
  if (classGame) {
    theDescription = "Scores lock, the podium goes up, and this game's totals count toward the class board."
  }
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="End the game now?" description={theDescription} width="max-w-lg">
      <div className="mt-2 flex justify-end gap-3">
        <Button variant="secondary" size="lg" onClick={() => onOpenChange(false)} autoFocus>
          Keep playing
        </Button>
        <Button variant="primary" size="lg" onClick={onConfirm}>
          End game
        </Button>
      </div>
    </Modal>
  )
}
