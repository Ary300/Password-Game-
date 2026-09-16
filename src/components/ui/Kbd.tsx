import type { ReactNode } from 'react'

export default function Kbd({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={
        'inline-flex min-w-7 items-center justify-center rounded-md border border-line border-b-2 bg-surface-2 px-1.5 py-0.5 text-xs font-bold text-text ' +
        className
      }
    >
      {children}
    </kbd>
  )
}
