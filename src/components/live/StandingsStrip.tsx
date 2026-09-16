import type { Standing } from '../../engine/types'
import RoundLabel from './RoundLabel'

type StandingsStripProps = {
  standings: Standing[]
  currentTeamId: string
  round: number
  roundsPerGame: number
  showRound: boolean
}

export default function StandingsStrip({ standings, currentTeamId, round, roundsPerGame, showRound }: StandingsStripProps) {
  const theSegments = []
  for (let n = 0; n < standings.length; n++) {
    const theRow = standings[n]
    let theFill = 'bg-surface'
    if (theRow.teamId === currentTeamId) {
      theFill = 'bg-surface-3'
    }
    theSegments.push(
      <li key={theRow.teamId} className={'flex min-w-0 flex-1 basis-0 items-center gap-[clamp(4px,0.8vw,12px)] overflow-hidden border-t-8 px-[clamp(6px,1vw,16px)] py-2 ' + theFill} style={{ borderColor: theRow.color }}>
        <span className="display tabular shrink-0 text-[clamp(16px,min(2.6vh,1.6vw),28px)] text-muted">{theRow.rank}</span>
        <span className="display min-w-0 flex-1 truncate pb-0.5 text-[clamp(16px,min(3vh,1.9vw),34px)]">{theRow.name}</span>
        <span className="display tabular shrink-0 text-[clamp(20px,min(4vh,2.4vw),46px)] text-gold">{theRow.points}</span>
      </li>,
    )
  }
  // The control window already carries the round in the top bar, so only the projector repeats it here.
  let theRound = null
  if (showRound) {
    theRound = (
      <div className="flex shrink-0 items-center border-t-8 border-surface-3 px-5">
        <RoundLabel round={round} roundsPerGame={roundsPerGame} className="display text-[clamp(22px,3vh,34px)] text-gold" />
      </div>
    )
  }
  return (
    <div className="flex shrink-0 items-stretch gap-1 bg-bg">
      {theRound}
      <ol className="flex min-w-0 flex-1 gap-1" aria-label="Standings">
        {theSegments}
      </ol>
    </div>
  )
}
