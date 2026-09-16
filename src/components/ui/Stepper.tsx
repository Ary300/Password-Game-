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
    <div className="inline-flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        className={theButton + ' inline-flex items-center justify-center rounded-xl border border-line bg-surface-2 text-text transition hover:bg-surface-3 disabled:opacity-30'}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label={'Decrease ' + label}
      >
        <Minus size={20} />
      </button>
      <output className={theValue + ' tabular text-center font-extrabold'} aria-live="polite">
        {theText}
      </output>
      <button
        type="button"
        className={theButton + ' inline-flex items-center justify-center rounded-xl border border-line bg-surface-2 text-text transition hover:bg-surface-3 disabled:opacity-30'}
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label={'Increase ' + label}
      >
        <Plus size={20} />
      </button>
    </div>
  )
}
