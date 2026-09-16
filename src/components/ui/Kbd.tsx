import type { ReactNode } from 'react'

export default function Kbd({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={
        'keycap px-2 py-1 text-sm text-muted ' +
        className
      }
    >
      {children}
    </kbd>
  )
}
