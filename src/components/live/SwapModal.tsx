import type { Player } from '../../engine/types'
import Modal from '../ui/Modal'

type SwapModalProps = {
  open: boolean
  players: Player[]
  currentId: string | null
  onPick: (thePlayerId: string) => void
  onClose: () => void
}

export default function SwapModal({ open, players, currentId, onPick, onClose }: SwapModalProps) {
  const theButtons = []
  for (let n = 0; n < players.length; n++) {
    const thePlayer = players[n]
    let theClass = 'bg-surface-2 hover:bg-surface-3 border-surface-3'
    let theMark = null
    if (thePlayer.id === currentId) {
      theClass = 'bg-surface-3 border-gold'
      theMark = <span className="label ml-auto">Guessing now</span>
    }
    theButtons.push(
      <button
        key={thePlayer.id}
        type="button"
        onClick={() => onPick(thePlayer.id)}
        className={'flex h-16 items-center gap-3 border-l-8 px-5 text-left text-2xl font-extrabold transition-colors ' + theClass}
      >
        <span className="truncate">{thePlayer.name}</span>
        {theMark}
      </button>,
    )
  }
  return (
    <Modal
      open={open}
      onOpenChange={(theOpen) => {
        if (!theOpen) {
          onClose()
        }
      }}
      title="Swap guesser"
      description="Clock paused. It resumes when you pick."
      width="max-w-2xl"
    >
      <div className="grid grid-cols-2 gap-1.5">{theButtons}</div>
    </Modal>
  )
}
