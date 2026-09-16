import { DropdownMenu } from 'radix-ui'
import type { Player, Team } from '../../engine/types'

type MoveStudentMenuProps = {
  player: Player
  currentTeamId: string
  teams: Team[]
  onMove: (theTeamId: string) => void
}

export default function MoveStudentMenu({ player, currentTeamId, teams, onMove }: MoveStudentMenuProps) {
  const theItems = []
  for (let n = 0; n < teams.length; n++) {
    if (teams[n].id === currentTeamId) {
      continue
    }
    const theTeamId = teams[n].id
    theItems.push(
      <DropdownMenu.Item
        key={theTeamId}
        onSelect={() => onMove(theTeamId)}
        className="flex cursor-pointer items-center gap-3 border-l-8 px-3 py-2 text-base font-semibold outline-none select-none data-[highlighted]:bg-crimson data-[highlighted]:text-white"
        style={{ borderLeftColor: teams[n].color }}
      >
        {teams[n].name}
      </DropdownMenu.Item>,
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="max-w-full truncate rounded-sm bg-surface-3 px-2 py-1 text-sm font-semibold text-text transition-colors hover:bg-line data-[state=open]:bg-crimson data-[state=open]:text-white"
        aria-label={'Move ' + player.name + ' to another team'}
      >
        {player.name}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content sideOffset={4} align="start" className="z-[60] flex min-w-48 flex-col gap-0.5 border-t-4 border-crimson bg-surface-2 p-1">
          <DropdownMenu.Label className="label px-3 pt-1 pb-1.5">Move {player.name} to</DropdownMenu.Label>
          {theItems}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
