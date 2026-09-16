import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger' | 'good'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  hotkey?: string
}

const theVariants: Record<ButtonVariant, string> = {
  primary: 'bg-crimson text-white hover:bg-crimson-deep shadow-[0_2px_0_0_var(--crimson-deep)]',
  gold: 'bg-gold text-gold-ink hover:brightness-95 shadow-[0_2px_0_0_#b8921c]',
  secondary: 'bg-surface-2 text-text hover:bg-surface-3 border border-line',
  ghost: 'bg-transparent text-muted hover:text-text hover:bg-surface-2',
  danger: 'bg-transparent text-crimson-text border border-crimson/60 hover:bg-crimson hover:text-white',
  good: 'bg-good text-gold-ink hover:brightness-95',
}

const theSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-base gap-2 rounded-xl',
  lg: 'h-14 px-6 text-lg gap-2.5 rounded-2xl',
  xl: 'h-20 px-8 text-2xl gap-3 rounded-2xl',
}

export default function Button({ variant = 'secondary', size = 'md', icon, hotkey, className = '', children, type = 'button', ...theRest }: ButtonProps) {
  let theHotkey = null
  if (hotkey !== undefined) {
    theHotkey = (
      <kbd className="ml-1 rounded-md border border-current/25 px-1.5 py-0.5 font-sans text-[0.7em] font-semibold opacity-70">{hotkey}</kbd>
    )
  }
  return (
    <button
      type={type}
      className={
        'inline-flex select-none items-center justify-center font-semibold whitespace-nowrap transition active:translate-y-px disabled:pointer-events-none disabled:opacity-40 ' +
        theVariants[variant] +
        ' ' +
        theSizes[size] +
        ' ' +
        className
      }
      {...theRest}
    >
      {icon}
      {children}
      {theHotkey}
    </button>
  )
}
