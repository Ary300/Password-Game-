import type { ShortcutGroupData } from '../ShortcutsOverlay'
import Kbd from '../ui/Kbd'

type ShortcutGroupProps = {
  group: ShortcutGroupData
}

export default function ShortcutGroup({ group }: ShortcutGroupProps) {
  const theRows = []
  for (let n = 0; n < group.shortcuts.length; n++) {
    const theShortcut = group.shortcuts[n]
    const theKeys = []
    for (let i = 0; i < theShortcut.keys.length; i++) {
      theKeys.push(<Kbd key={theShortcut.keys[i]}>{theShortcut.keys[i]}</Kbd>)
    }
    theRows.push(
      <tr key={theShortcut.action} className="border-b border-line/60 last:border-b-0">
        <td className="w-px py-1.5 pr-5 whitespace-nowrap">
          <span className="flex gap-1">{theKeys}</span>
        </td>
        <td className="py-1.5 text-base font-semibold">{theShortcut.action}</td>
      </tr>,
    )
  }

  return (
    <section>
      <h3 className="display text-2xl">{group.title}</h3>
      <div className="mt-1.5 h-1 bg-crimson" aria-hidden="true" />
      <table className="w-full">
        <tbody>{theRows}</tbody>
      </table>
    </section>
  )
}
