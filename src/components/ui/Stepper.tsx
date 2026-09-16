import { Minus, Plus } from 'lucide-react'

type StepperProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  format?: (num: number) => string
  onChange: (num: number) => void
  size?: 'md' | 'lg'
}

export default function Stepper({ label, value, min, max, step = 1, format, onChange, size = 'md' }: StepperProps) {
  let theText = String(value)
  if (format !== undefined) {
    theText = format(value)
  }
  let theButton = 'h-10 w-10'
  let theValue = 'min-w-16 text-2xl'
  if (size === 'lg') {
    theButton = 'h-14 w-14'
    theValue = 'min-w-24 text-4xl'
  }
  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={label}>
      <button
        type="button"
        className={theButton + ' inline-flex items-center justify-center bg-surface-2 text-text transition-colors hover:bg-crimson hover:text-white disabled:opacity-30'}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label={'Decrease ' + label}
      >
        <Minus size={20} />
      </button>
      <output className={theValue + ' tabular font-display text-center font-black'} aria-live="polite">
        {theText}
      </output>
      <button
        type="button"
        className={theButton + ' inline-flex items-center justify-center bg-surface-2 text-text transition-colors hover:bg-crimson hover:text-white disabled:opacity-30'}
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label={'Increase ' + label}
      >
        <Plus size={20} />
      </button>
    </div>
  )
}
