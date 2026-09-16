import type { Standing } from '../../engine/types'

export default function TeamUpStandings({ standings, currentTeamId }: { standings: Standing[]; currentTeamId: string }) {
  const theRows = []
  for (let n = 0; n < standings.length; n++) {
    const theRow = standings[n]
    let theFill = 'bg-surface'
    if (theRow.teamId === currentTeamId) {
      theFill = 'bg-surface-3'
    }
    theRows.push(
      <li key={theRow.teamId} className={'flex items-center gap-4 border-l-8 py-[1.2vh] pr-4 pl-4 ' + theFill} style={{ borderColor: theRow.color }}>
        <span className="display tabular w-7 shrink-0 text-[clamp(26px,3.4vh,38px)] text-muted">{theRow.rank}</span>
        <span className="min-w-0 flex-1">
          <span className="display block truncate pb-0.5 text-[clamp(30px,4.4vh,50px)]">{theRow.name}</span>
          <span className="tabular label block">{theRow.correct} correct</span>
        </span>
        <span className="display tabular text-[clamp(44px,6.6vh,76px)] text-gold">{theRow.points}</span>
      </li>,
    )
  }
  return (
    <aside className="flex h-full min-h-0 flex-col" aria-label="Standings">
      <h2 className="label pb-2 text-base">Standings</h2>
      <ol className="scroll-area flex min-h-0 flex-col gap-1">{theRows}</ol>
    </aside>
  )
}
