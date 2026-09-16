import type { Player } from '../../engine/types'

export default function StillToGuess({ players, teamColor }: { players: Player[]; teamColor: string }) {
  let theList = <span className="text-xl font-bold">Everyone has guessed once.</span>
  if (players.length > 0) {
    const theChips = []
    for (let n = 0; n < players.length; n++) {
      theChips.push(
        <li key={players[n].id} className="border-b-4 bg-surface-2 px-3 py-1 text-xl font-bold" style={{ borderColor: teamColor }}>
          {players[n].name}
        </li>,
      )
    }
    theList = <ul className="flex min-w-0 flex-wrap gap-1.5 overflow-hidden" style={{ maxHeight: '5.75rem' }}>{theChips}</ul>
  }
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="label w-28 shrink-0 text-base">Still to guess</span>
      {theList}
    </div>
  )
}
