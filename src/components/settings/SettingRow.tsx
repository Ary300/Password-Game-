import type { ReactNode } from 'react'

type SettingRowProps = {
  label: string
  note?: string
  children: ReactNode
}

export default function SettingRow({ label, note, children }: SettingRowProps) {
  let theNote = null
  if (note !== undefined) {
    theNote = <span className="label block">{note}</span>
  }
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <span className="block font-semibold">{label}</span>
        {theNote}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
