import type { ReactNode } from 'react'

export default function Kbd({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={
        'inline-flex min-w-8 items-center justify-center border-2 border-line border-b-4 bg-surface-2 px-2 py-0.5 text-sm font-bold text-text ' +
        className
      }
    >
      {children}
    </kbd>
  )
}
