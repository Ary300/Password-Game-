import type { Standing } from '../../engine/types'
import EndGameButton from '../live/EndGameButton'
import ScoreNudge from '../live/ScoreNudge'

type TeamUpStandingsProps = {
  standings: Standing[]
  currentTeamId: string
  control: boolean
}

export default function TeamUpStandings({ standings, currentTeamId, control }: TeamUpStandingsProps) {
  // Six or more teams share the column, so rows drop the correct count on short windows and shrink the type.
  let theNameSize = 'text-[clamp(34px,5vh,60px)]'
  let thePointsSize = 'text-[clamp(52px,8vh,96px)]'
  let theCorrectClass = 'tabular label block text-base'
  if (standings.length > 5) {
    theNameSize = 'text-[clamp(24px,3.6vh,48px)]'
    thePointsSize = 'text-[clamp(32px,5vh,72px)]'
    theCorrectClass = 'tabular label block text-sm [@media(max-height:820px)]:hidden'
  }
  const theRows = []
  for (let n = 0; n < standings.length; n++) {
    const theRow = standings[n]
    let theFill = 'bg-surface'
    if (theRow.teamId === currentTeamId) {
      theFill = 'bg-surface-3'
    }
    let theNudgeDirection: 'row' | 'column' = 'column'
    if (standings.length > 4) {
      theNudgeDirection = 'row'
    }
    let theNudge = null
    if (control) {
      theNudge = <ScoreNudge teamId={theRow.teamId} teamName={theRow.name} direction={theNudgeDirection} />
    }
    theRows.push(
      <li key={theRow.teamId} className={'flex max-h-[220px] min-h-0 flex-1 items-center gap-4 overflow-hidden border-l-8 py-[1vh] pr-4 pl-4 ' + theFill} style={{ borderColor: theRow.color }}>
        <span className="display tabular w-7 shrink-0 text-[clamp(28px,4vh,44px)] text-muted">{theRow.rank}</span>
        <span className="min-w-0 flex-1">
          <span className={'display block truncate pb-0.5 ' + theNameSize}>{theRow.name}</span>
          <span className={theCorrectClass}>{theRow.correct} correct</span>
        </span>
        <span className={'display tabular text-gold ' + thePointsSize}>{theRow.points}</span>
        {theNudge}
      </li>,
    )
  }
  let theEndGame = null
  if (control) {
    theEndGame = <EndGameButton />
  }
  return (
    <aside className="flex h-full min-h-0 flex-col" aria-label="Standings">
      <div className="flex items-start justify-between gap-3 pb-3">
        <h2 className="display text-[clamp(28px,4vh,44px)]">Standings</h2>
        {theEndGame}
      </div>
      <ol className="scroll-area flex min-h-0 flex-1 flex-col gap-1">{theRows}</ol>
    </aside>
  )
}
