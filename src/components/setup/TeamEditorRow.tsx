import { useState } from 'react'
import type { Team } from '../../engine/types'
import { useGameStore } from '../../store/useGameStore'
import { playersText } from './setupHelpers'

type TeamEditorRowProps = {
  team: Team
  index: number
  lockedPlayers: boolean
  hiddenIds: string[]
}

export default function TeamEditorRow({ team, index, lockedPlayers, hiddenIds }: TeamEditorRowProps) {
  const renameTeam = useGameStore((theState) => theState.renameTeam)
  const setTeamPlayers = useGameStore((theState) => theState.setTeamPlayers)
  const theSaved = playersText(team)
  // Names are parsed only on blur because parsing while typing would eat the comma or newline the teacher just typed.
  const [theDraft, setTheDraft] = useState(theSaved)

  function commitPlayers() {
    if (theDraft !== theSaved) {
      setTeamPlayers(team.id, theDraft)
    }
  }

  let thePlayers = (
    <textarea
      value={theDraft}
      onChange={(theEvent) => setTheDraft(theEvent.target.value)}
      onBlur={commitPlayers}
      rows={2}
      placeholder="Player names, optional"
      aria-label={'Players on ' + team.name}
      className="scroll-area block h-full min-h-14 w-full resize-none border-b-4 border-surface-3 bg-surface-2 px-3 py-2 text-base leading-snug text-text placeholder:text-faint focus:border-gold focus:outline-none"
    />
  )
  if (lockedPlayers) {
    const theChips = []
    for (let n = 0; n < team.players.length; n++) {
      if (hiddenIds.indexOf(team.players[n].id) !== -1) {
        continue
      }
      theChips.push(
        <li key={team.players[n].id} className="rounded-sm bg-surface-3 px-2 py-0.5 text-sm font-semibold">
          {team.players[n].name}
        </li>,
      )
    }
    thePlayers = (
      <ul className="flex flex-wrap content-start gap-1" aria-label={'Players on ' + team.name}>
        {theChips}
      </ul>
    )
  }

  let theCount = 'No players'
  if (team.players.length === 1) {
    theCount = '1 player'
  } else if (team.players.length > 1) {
    theCount = String(team.players.length) + ' players'
  }

  return (
    <li className="flex max-h-32 min-h-[84px] flex-1 items-stretch gap-4 border-l-8 bg-surface py-3 pr-3 pl-3" style={{ borderLeftColor: team.color }}>
      <span aria-hidden="true" className="display w-10 shrink-0 pt-1 text-center text-5xl text-faint">
        {String(index + 1)}
      </span>
      <div className="flex w-[38%] min-w-0 shrink-0 flex-col gap-1">
        <input
          value={team.name}
          onChange={(theEvent) => renameTeam(team.id, theEvent.target.value)}
          aria-label={'Name of team ' + String(index + 1)}
          maxLength={28}
          className="display h-14 w-full border-b-4 border-surface-3 bg-transparent px-1 text-4xl text-text focus:border-gold focus:outline-none 2xl:text-5xl"
        />
        <span className="label px-1">{theCount}</span>
      </div>
      <div className="min-w-0 flex-1">{thePlayers}</div>
    </li>
  )
}
