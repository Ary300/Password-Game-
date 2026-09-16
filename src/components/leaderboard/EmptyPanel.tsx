import type { ReactNode } from 'react'

type EmptyPanelProps = {
  title: string
  body: string
  action?: ReactNode
}

export default function EmptyPanel({ title, body, action }: EmptyPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 items-center bg-surface px-10 py-8">
      <div className="max-w-3xl border-l-8 border-crimson pl-8">
        <h2 className="display text-6xl">{title}</h2>
        <p className="mt-4 text-xl text-muted">{body}</p>
        <div className="mt-8 flex">{action}</div>
      </div>
    </div>
  )
}
