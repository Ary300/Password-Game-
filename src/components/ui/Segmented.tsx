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
        className="h-10 flex-1 px-3 text-sm font-bold text-muted transition-colors hover:bg-surface-3 hover:text-text data-[state=on]:bg-crimson data-[state=on]:text-white"
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
      className="flex w-full gap-0.5 bg-surface-2"
    >
      {theItems}
    </ToggleGroup.Root>
  )
}
