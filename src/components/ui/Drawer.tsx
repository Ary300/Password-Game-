import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import type { ReactNode } from 'react'

type DrawerProps = {
  open: boolean
  onOpenChange: (theOpen: boolean) => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export default function Drawer({ open, onOpenChange, title, children, footer }: DrawerProps) {
  let theFooter = null
  if (footer !== undefined) {
    theFooter = <div className="border-t border-line p-5">{footer}</div>
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[520px] flex-col border-l border-line bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="text-2xl font-extrabold tracking-tight">{title}</Dialog.Title>
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
            <Dialog.Close className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-text" aria-label="Close">
              <X size={22} />
            </Dialog.Close>
          </div>
          <div className="scroll-area flex-1 px-5 py-4">{children}</div>
          {theFooter}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
