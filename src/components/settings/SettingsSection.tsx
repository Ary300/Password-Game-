import type { ReactNode } from 'react'

type SettingsSectionProps = {
  title: string
  children: ReactNode
}

export default function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="pt-2 pb-7">
      <h3 className="display text-[28px] text-text">{title}</h3>
      <div className="mt-2 mb-2 h-1 bg-crimson" aria-hidden="true" />
      <div className="flex flex-col">{children}</div>
    </section>
  )
}
