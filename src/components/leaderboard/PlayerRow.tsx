import type { PlayerStat } from '../../engine/career'
import { PLAYER_GRID } from './grids'

type PlayerRowProps = {
  stat: PlayerStat
  rank: number
  striped: boolean
}

export default function PlayerRow({ stat, rank, striped }: PlayerRowProps) {
  let theBand = 'bg-surface'
  if (striped) {
    theBand = 'bg-surface-2'
  }
  let theBest = 'None'
  let theBestTone = 'text-faint'
  if (stat.bestMs !== null) {
    theBest = (stat.bestMs / 1000).toFixed(1) + ' s'
    theBestTone = 'text-gold'
  }
  let theRankTone = 'text-muted'
  if (rank === 1 && stat.correct > 0) {
    theRankTone = 'text-gold'
  }
  let theNameTone = 'text-text'
  let thePlace = String(rank)
  // A player still waiting for a first turn has no place yet.
  if (stat.turns === 0 && stat.correct === 0) {
    theNameTone = 'text-muted'
    thePlace = ''
  }
  return (
    <li className={'border-l-8 py-2 pr-5 pl-3 ' + theBand + ' ' + PLAYER_GRID} style={{ borderLeftColor: stat.teamColor }}>
      <span className={'display tabular text-center text-4xl ' + theRankTone}>{thePlace}</span>
      <span className={'display truncate pb-[0.2em] text-4xl ' + theNameTone}>{stat.name}</span>
      <span className="truncate text-base font-bold text-muted">{stat.teamName}</span>
      <span className="display tabular text-right text-4xl text-muted">{stat.turns}</span>
      <span className="display tabular text-right text-4xl">{stat.correct}</span>
      <span className="display tabular text-right text-4xl text-muted">{stat.skips}</span>
      <span className={'display tabular text-right text-3xl ' + theBestTone}>{theBest}</span>
    </li>
  )
}
