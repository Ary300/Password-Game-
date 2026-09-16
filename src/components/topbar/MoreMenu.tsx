import { MoreHorizontal } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import type { ReactNode } from 'react'

export type MoreMenuItem = {
  label: string
  icon: ReactNode
  hint: string
  onSelect: () => void
}

type MoreMenuProps = {
  items: MoreMenuItem[]
  className?: string
}

// Narrow windows fold the less-used top bar tools in here so the screen links never have to disappear.
export default function MoreMenu({ items, className = '' }: MoreMenuProps) {
  const theRows = []
  for (let n = 0; n < items.length; n++) {
    const theItem = items[n]
    let theHint = null
    if (theItem.hint.length > 0) {
      theHint = <kbd className="keycap ml-auto px-1.5 py-0.5 text-xs">{theItem.hint}</kbd>
    }
    theRows.push(
      <DropdownMenu.Item
        key={theItem.label}
        onSelect={theItem.onSelect}
        className="flex h-11 cursor-pointer items-center gap-3 px-3 text-base font-bold text-text outline-none select-none data-[highlighted]:bg-surface-3"
      >
        {theItem.icon}
        <span>{theItem.label}</span>
        {theHint}
      </DropdownMenu.Item>,
    )
  }
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={'inline-flex h-10 w-10 items-center justify-center text-muted transition-colors hover:bg-surface-2 hover:text-text data-[state=open]:bg-surface-2 data-[state=open]:text-text ' + className}
        title="More tools"
        aria-label="More tools"
      >
        <MoreHorizontal size={20} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-60 border-t-4 border-crimson bg-surface-2 py-1">
          {theRows}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
