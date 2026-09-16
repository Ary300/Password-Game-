import { Trash2 } from 'lucide-react'
import type { ClassRoom } from '../../engine/types'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

type DeleteClassModalProps = {
  open: boolean
  onOpenChange: (theOpen: boolean) => void
  classRoom: ClassRoom
  onConfirm: () => void
}

export default function DeleteClassModal({ open, onOpenChange, classRoom, onConfirm }: DeleteClassModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={'Delete ' + classRoom.name + '?'}
      description={'This removes ' + String(classRoom.students.length) + ' students and their career stats. You cannot undo it.'}
      width="max-w-md"
    >
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" size="md" onClick={() => onOpenChange(false)}>
          Keep class
        </Button>
        <Button variant="primary" size="md" icon={<Trash2 size={18} aria-hidden="true" />} onClick={onConfirm}>
          Delete class
        </Button>
      </div>
    </Modal>
  )
}
