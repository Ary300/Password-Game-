import { guessCount, presentPlayers } from '../../engine/rotation'
import type { Team, TurnStart } from '../../engine/types'
import Kbd from '../ui/Kbd'
import SelectMenu from '../ui/SelectMenu'

type GuesserPickerProps = {
  team: Team
  turnsLog: TurnStart[]
  absentIds: string[]
  value: string | null
  openCount: number
  onPick: (thePlayerId: string) => void
}

// Radix returns focus to the trigger after a pick; releasing it lets Space start the turn right away.
function releaseFocus() {
  window.setTimeout(() => {
    const theActive = document.activeElement
    if (theActive instanceof HTMLElement) {
      theActive.blur()
    }
  }, 0)
}

export default function GuesserPicker({ team, turnsLog, absentIds, value, openCount, onPick }: GuesserPickerProps) {
  const thePlayers = presentPlayers(team, absentIds)
  const theOptions = []
  for (let n = 0; n < thePlayers.length; n++) {
    const theCount = guessCount(thePlayers[n].id, turnsLog)
    theOptions.push({ value: thePlayers[n].id, label: thePlayers[n].name, hint: 'guessed ' + String(theCount) + '×' })
  }
  let theValue = ''
  if (value !== null) {
    theValue = value
  }
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="label w-36 shrink-0 text-lg">Change guesser</span>
      <div className="w-[min(320px,100%)]">
        <SelectMenu
          key={openCount}
          label="Change guesser"
          value={theValue}
          options={theOptions}
          onChange={onPick}
          size="lg"
          defaultOpen={openCount > 0}
          onOpenChange={(theOpen) => {
            if (!theOpen) {
              releaseFocus()
            }
          }}
        />
      </div>
      <Kbd className="shrink-0">G</Kbd>
    </div>
  )
}
