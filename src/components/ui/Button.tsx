import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger' | 'good'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  hotkey?: string
}

// Flat slabs with a hard bottom edge read like scoreboard keys; no glows or soft shadows.
const theVariants: Record<ButtonVariant, string> = {
  primary: 'bg-crimson text-white hover:bg-crimson-deep border-b-4 border-crimson-deep',
  gold: 'bg-gold text-gold-ink hover:brightness-95 border-b-4 border-[#b8921c]',
  secondary: 'bg-surface-2 text-text hover:bg-surface-3 border-b-4 border-surface-3',
  ghost: 'bg-transparent text-muted hover:text-text hover:bg-surface-2',
  danger: 'bg-transparent text-crimson-text hover:bg-crimson hover:text-white border-2 border-crimson',
  good: 'bg-good text-gold-ink hover:brightness-95 border-b-4 border-[#23a26c]',
}

// Key caps use fixed sizes per button size so every hint reads at the same weight across screens.
const theKeySizes: Record<ButtonSize, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-1.5 py-0.5',
  lg: 'text-sm px-2 py-1',
  xl: 'text-lg px-2.5 py-1',
}

const theSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-2',
  md: 'h-11 px-4 text-base gap-2.5',
  lg: 'h-14 px-5 text-2xl gap-3 font-display font-black',
  xl: 'h-24 px-8 text-5xl gap-4 font-display font-black',
}

export default function Button({ variant = 'secondary', size = 'md', icon, hotkey, className = '', children, type = 'button', ...theRest }: ButtonProps) {
  let theHotkey = null
  if (hotkey !== undefined) {
    theHotkey = (
      <kbd className={'keycap ml-auto ' + theKeySizes[size]}>
        {hotkey}
      </kbd>
    )
  }
  return (
    <button
      type={type}
      className={
        'inline-flex select-none items-center justify-center font-bold whitespace-nowrap transition-colors active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-35 ' +
        theVariants[variant] +
        ' ' +
        theSizes[size] +
        ' ' +
        className
      }
      {...theRest}
    >
      {icon}
      <span>{children}</span>
      {theHotkey}
    </button>
  )
}
