import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onOpenChange: (theOpen: boolean) => void
  title: string
  description?: string
  children: ReactNode
  width?: string
}

export default function Modal({ open, onOpenChange, title, description, children, width = 'max-w-xl' }: ModalProps) {
  let theDescription = <Dialog.Description className="sr-only">{title}</Dialog.Description>
  if (description !== undefined) {
    theDescription = <Dialog.Description className="mt-1 text-muted">{description}</Dialog.Description>
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
        <Dialog.Content
          className={
            'fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden border-t-8 border-crimson bg-surface p-7 ' +
            width
          }
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="display text-4xl">{title}</Dialog.Title>
              {theDescription}
            </div>
            <Dialog.Close className="p-2 text-muted hover:bg-surface-2 hover:text-text" aria-label="Close">
              <X size={22} />
            </Dialog.Close>
          </div>
          <div className="scroll-area max-h-[calc(90vh-120px)]">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
