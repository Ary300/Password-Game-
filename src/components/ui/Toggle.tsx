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
        className="relative h-7 w-12 shrink-0 cursor-pointer rounded-full border border-line bg-surface-3 transition data-[state=checked]:border-crimson data-[state=checked]:bg-crimson"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-text shadow transition data-[state=checked]:translate-x-6 data-[state=checked]:bg-white" />
      </Switch.Root>
    </div>
  )
}
