import { ToggleGroup } from 'radix-ui'

export type SegmentOption = {
  value: string
  label: string
}

type SegmentedProps = {
  label: string
  value: string
  options: SegmentOption[]
  onChange: (theValue: string) => void
}

export default function Segmented({ label, value, options, onChange }: SegmentedProps) {
  const theItems = []
  for (let n = 0; n < options.length; n++) {
    const theOption = options[n]
    theItems.push(
      <ToggleGroup.Item
        key={theOption.value}
        value={theOption.value}
        className="h-9 flex-1 rounded-lg px-3 text-sm font-semibold text-muted transition hover:text-text data-[state=on]:bg-crimson data-[state=on]:text-white"
      >
        {theOption.label}
      </ToggleGroup.Item>,
    )
  }
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(theNext) => {
        if (theNext.length > 0) {
          onChange(theNext)
        }
      }}
      aria-label={label}
      className="flex w-full gap-1 rounded-xl border border-line bg-surface-2 p-1"
    >
      {theItems}
    </ToggleGroup.Root>
  )
}
