import type { Standing } from '../../engine/types'

type StandingsTableProps = {
  standings: Standing[]
  large: boolean
}

const ROWS_PER_COLUMN = 4

export default function StandingsTable({ standings, large }: StandingsTableProps) {
  let theNameSize = 'text-[clamp(1.5rem,3.3vh,1.875rem)]'
  let theRowHeight = 'h-[clamp(2.25rem,5vh,3rem)]'
  if (large) {
    theNameSize = 'text-[clamp(2.25rem,4.5vh,3rem)]'
    theRowHeight = 'h-[clamp(3rem,6vh,4rem)]'
  }
  // Two columns of teams leave no room for the stat line, and the names matter more.
  let theStatsClass = 'label tabular hidden whitespace-nowrap xl:inline'
  if (standings.length > ROWS_PER_COLUMN) {
    theStatsClass = 'hidden'
  }

  const theRows = []
  for (let n = 0; n < standings.length; n++) {
    const theRow = standings[n]
    let theTurnWord = 'turns'
    if (theRow.turns === 1) {
      theTurnWord = 'turn'
    }
    let theRankTone = 'text-muted'
    if (theRow.rank === 1) {
      theRankTone = 'text-gold'
    }
    theRows.push(
      <li
        key={theRow.teamId}
        className={'grid grid-cols-[2.5rem_minmax(0,1fr)_auto_3.5rem] items-center gap-x-4 border-b border-line border-l-8 pr-3 pl-2 ' + theRowHeight}
        style={{ borderLeftColor: theRow.color }}
      >
        <span className={'display tabular text-center ' + theNameSize + ' ' + theRankTone}>{theRow.rank}</span>
        <span className={'display truncate pb-0.5 ' + theNameSize}>{theRow.name}</span>
        <span className={theStatsClass}>
          {theRow.correct} correct, {theRow.skipped} skipped, {theRow.turns} {theTurnWord}
        </span>
        <span className={'display tabular text-right text-gold ' + theNameSize}>{theRow.points}</span>
      </li>,
    )
  }

  let theRowCount = standings.length
  if (theRowCount > ROWS_PER_COLUMN) {
    theRowCount = ROWS_PER_COLUMN
  }
  // Filling columns top to bottom keeps eight teams on screen without scrolling while rank still reads downward.
  const theGridStyle = { gridTemplateRows: 'repeat(' + String(theRowCount) + ', auto)' }

  return (
    <ol className="grid min-w-0 flex-1 auto-cols-fr grid-flow-col gap-x-6 bg-surface px-3 py-1" style={theGridStyle} aria-label="Full standings">
      {theRows}
    </ol>
  )
}
