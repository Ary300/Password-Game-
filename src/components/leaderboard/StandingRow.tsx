import { motion } from 'motion/react'
import type { Standing } from '../../engine/types'
import { STANDING_GRID } from './grids'
import ScoreCell from './ScoreCell'

type StandingRowProps = {
  standing: Standing
  maxPoints: number
  tied: boolean
  striped: boolean
}

export default function StandingRow({ standing, maxPoints, tied, striped }: StandingRowProps) {
  let theShare = 0
  if (maxPoints > 0 && standing.points > 0) {
    theShare = (standing.points / maxPoints) * 100
  }

  let theBand = 'bg-surface'
  if (striped) {
    theBand = 'bg-surface-2'
  }
  let theRankTone = 'text-text'
  if (standing.rank === 1 && standing.points > 0) {
    theRankTone = 'text-gold'
  }

  let theTiedLabel = null
  if (tied) {
    theTiedLabel = <span className="label block pt-1">Tied</span>
  }

  return (
    <motion.li
      layout
      transition={{ type: 'spring', stiffness: 420, damping: 40 }}
      className={'border-l-8 py-3 pr-5 pl-3 ' + theBand + ' ' + STANDING_GRID}
      style={{ borderLeftColor: standing.color }}
    >
      <div className="text-center">
        <span className={'display tabular block text-7xl ' + theRankTone}>{standing.rank}</span>
        {theTiedLabel}
      </div>
      <div className="min-w-0">
        <span className="display block truncate pb-1 text-5xl">{standing.name}</span>
        <div className="mt-2 h-2.5 bg-bg" aria-hidden="true">
          <motion.div
            className="h-full"
            style={{ backgroundColor: standing.color }}
            initial={{ width: 0 }}
            animate={{ width: String(theShare) + '%' }}
            transition={{ type: 'spring', stiffness: 160, damping: 26 }}
          />
        </div>
      </div>
      <ScoreCell teamId={standing.teamId} teamName={standing.name} points={standing.points} />
      <span className="display tabular text-right text-4xl">{standing.correct}</span>
      <span className="display tabular text-right text-4xl text-muted">{standing.skipped}</span>
      <span className="display tabular text-right text-4xl text-muted">{standing.turns}</span>
    </motion.li>
  )
}
