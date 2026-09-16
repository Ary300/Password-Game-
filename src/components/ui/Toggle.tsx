import { Switch } from 'radix-ui'
import { useId } from 'react'

type ToggleProps = {
  label: string
  description?: string
  checked: boolean
  onChange: (theValue: boolean) => void
}

export default function Toggle({ label, description, checked, onChange }: ToggleProps) {
  const theId = useId()
  let theDescription = null
  if (description !== undefined) {
    theDescription = <span className="block text-sm text-muted">{description}</span>
  }
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label htmlFor={theId} className="cursor-pointer">
        <span className="block font-semibold">{label}</span>
        {theDescription}
      </label>
      <Switch.Root
        id={theId}
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-8 w-14 shrink-0 cursor-pointer bg-surface-3 transition-colors data-[state=checked]:bg-crimson"
      >
        <Switch.Thumb className="block h-6 w-6 translate-x-1 bg-faint transition data-[state=checked]:translate-x-7 data-[state=checked]:bg-white" />
      </Switch.Root>
    </div>
  )
}
