import type { Standing } from '../../engine/types'
import RoundLabel from './RoundLabel'

type StandingsStripProps = {
  standings: Standing[]
  currentTeamId: string
  round: number
  roundsPerGame: number
}

export default function StandingsStrip({ standings, currentTeamId, round, roundsPerGame }: StandingsStripProps) {
  const theSegments = []
  for (let n = 0; n < standings.length; n++) {
    const theRow = standings[n]
    let theFill = 'bg-surface'
    if (theRow.teamId === currentTeamId) {
      theFill = 'bg-surface-3'
    }
    theSegments.push(
      <li key={theRow.teamId} className={'flex min-w-0 flex-1 items-center gap-3 border-t-8 px-4 py-2 ' + theFill} style={{ borderColor: theRow.color }}>
        <span className="tabular label shrink-0">{theRow.rank}</span>
        <span className="display min-w-0 flex-1 truncate pb-0.5 text-[clamp(22px,3vh,34px)]">{theRow.name}</span>
        <span className="display tabular text-[clamp(28px,4vh,46px)] text-gold">{theRow.points}</span>
      </li>,
    )
  }
  return (
    <div className="flex shrink-0 items-stretch gap-1 bg-bg">
      <div className="flex shrink-0 items-center border-t-8 border-surface-3 px-4">
        <RoundLabel round={round} roundsPerGame={roundsPerGame} className="label" />
      </div>
      <ol className="flex min-w-0 flex-1 gap-1" aria-label="Standings">
        {theSegments}
      </ol>
    </div>
  )
}
