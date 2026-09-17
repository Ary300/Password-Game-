import { RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import type { TopGuesser } from '../../engine/classBoard'
import type { ClassStanding } from '../../engine/types'
import { CLASS_GRID } from './grids'

type ClassBoardRowProps = {
  standing: ClassStanding
  share: number
  striped: boolean
  playingNow: boolean
  topGuessers: TopGuesser[]
  onReset: () => void
}

export default function ClassBoardRow({ standing, share, striped, playingNow, topGuessers, onReset }: ClassBoardRowProps) {
  const thePlayed = standing.turns > 0
  let theBand = 'bg-surface'
  if (striped) {
    theBand = 'bg-surface-2'
  }
  let theRule = 'border-surface-3'
  let theRankTone = 'text-text'
  let theAverageTone = 'text-gold'
  if (standing.rank === 1 && thePlayed) {
    theRule = 'border-gold'
    theRankTone = 'text-gold'
  }
  if (!thePlayed) {
    theAverageTone = 'text-faint'
  }
  let theLiveLabel = null
  if (playingNow) {
    theLiveLabel = <span className="shrink-0 bg-crimson px-2 py-0.5 text-sm font-bold text-white">Playing now</span>
  }

  const theNames = []
  for (let n = 0; n < topGuessers.length; n++) {
    const theGuesser = topGuessers[n]
    theNames.push(
      <li key={theGuesser.studentId} className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate font-bold">{theGuesser.name}</span>
        <span className="tabular text-gold">{theGuesser.correct}</span>
      </li>,
    )
  }
  let theTopList = <p className="label mt-1.5">No guesses yet</p>
  if (theNames.length > 0) {
    theTopList = (
      <div className="mt-1.5 flex min-w-0 items-baseline gap-3 text-base">
        <span className="label shrink-0">Top guessers</span>
        <ol className="flex min-w-0 flex-wrap gap-x-4" aria-label={'Top guessers in ' + standing.name}>
          {theNames}
        </ol>
      </div>
    )
  }

  return (
    <motion.li layout className={'border-l-8 py-3 pr-3 pl-3 ' + theBand + ' ' + theRule + ' ' + CLASS_GRID}>
      <span className={'display tabular text-center text-6xl xl:text-7xl ' + theRankTone}>{standing.rank}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-4">
          <span className="display truncate pb-[0.2em] text-[clamp(2rem,4.5vh,3rem)]">{standing.name}</span>
          {theLiveLabel}
        </div>
        <div className="mt-1 h-2.5 bg-bg" aria-hidden="true">
          <motion.div className="h-full bg-crimson" initial={{ width: 0 }} animate={{ width: String(share) + '%' }} transition={{ type: 'spring', stiffness: 160, damping: 26 }} />
        </div>
        {theTopList}
      </div>
      <span className={'display tabular text-right text-5xl xl:text-6xl ' + theAverageTone}>{standing.average.toFixed(2)}</span>
      <span className="display tabular text-right text-4xl">{standing.games}</span>
      <span className="display tabular text-right text-4xl text-muted">{standing.turns}</span>
      <span className="display tabular text-right text-4xl text-muted">{standing.correct}</span>
      <button
        type="button"
        onClick={onReset}
        aria-label={'Reset totals for ' + standing.name}
        title="Reset this class"
        className="flex h-11 w-11 items-center justify-center justify-self-end text-muted transition-colors hover:bg-surface-3 hover:text-text"
      >
        <RotateCcw size={20} aria-hidden="true" />
      </button>
    </motion.li>
  )
}
