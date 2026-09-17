import { Check, ChevronDown } from 'lucide-react'
import { Select } from 'radix-ui'

export type SelectOption = {
  value: string
  label: string
  hint?: string
}

type SelectMenuProps = {
  label: string
  value: string
  options: SelectOption[]
  onChange: (theValue: string) => void
  placeholder?: string
  size?: 'md' | 'lg'
  defaultOpen?: boolean
  onOpenChange?: (theOpen: boolean) => void
  returnFocus?: boolean
}

export default function SelectMenu({ label, value, options, onChange, placeholder = 'Choose', size = 'md', defaultOpen, onOpenChange, returnFocus = true }: SelectMenuProps) {
  const theItems = []
  for (let n = 0; n < options.length; n++) {
    const theOption = options[n]
    let theHint = null
    if (theOption.hint !== undefined) {
      theHint = <span className="ml-auto pl-4 text-sm text-muted">{theOption.hint}</span>
    }
    theItems.push(
      <Select.Item
        key={theOption.value}
        value={theOption.value}
        className="relative flex cursor-pointer items-center py-2.5 pr-3 pl-9 text-lg outline-none select-none data-[highlighted]:bg-crimson data-[highlighted]:text-white"
      >
        <Select.ItemIndicator className="absolute left-2.5">
          <Check size={18} />
        </Select.ItemIndicator>
        <Select.ItemText>{theOption.label}</Select.ItemText>
        {theHint}
      </Select.Item>,
    )
  }
  let theTrigger = 'h-11 text-base'
  if (size === 'lg') {
    theTrigger = 'h-14 text-xl'
  }
  // A picker opened by a hotkey hands focus back to the page, or the next hotkey lands on the trigger instead.
  function onCloseAutoFocus(theEvent: Event) {
    if (!returnFocus) {
      theEvent.preventDefault()
    }
  }
  return (
    <Select.Root value={value} onValueChange={onChange} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <Select.Trigger
        aria-label={label}
        className={theTrigger + ' inline-flex w-full items-center justify-between gap-2 border-b-4 border-surface-3 bg-surface-2 px-4 font-bold text-text hover:bg-surface-3'}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown size={20} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content onCloseAutoFocus={onCloseAutoFocus} position="popper" sideOffset={6} className="z-[60] max-h-[60vh] min-w-[var(--radix-select-trigger-width)] overflow-hidden border-t-4 border-crimson bg-surface-2 p-1">
          <Select.Viewport>{theItems}</Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
