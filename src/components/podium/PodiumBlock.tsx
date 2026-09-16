import { motion, useReducedMotion } from 'motion/react'
import type { Standing } from '../../engine/types'

type PodiumBlockProps = {
  standing: Standing
  delay: number
  large: boolean
}

// Heights follow the shared rank, so two teams tied for first stand equally tall.
function heightShare(num: number): number {
  if (num === 1) {
    return 1
  }
  if (num === 2) {
    return 0.7
  }
  return 0.48
}

export default function PodiumBlock({ standing, delay, large }: PodiumBlockProps) {
  const theReduced = useReducedMotion()
  const theFirst = standing.rank === 1
  const theHeight = 'calc((100% - var(--podium-label)) * ' + String(heightShare(standing.rank)) + ')'

  // The numeral scales with its own block, so a short third-place block on a small screen never clips its rank.
  let theBlockTone = 'bg-surface-3 text-text border-t-8'
  let theBlockStyle = { height: theHeight, borderTopColor: standing.color }
  if (theFirst) {
    theBlockTone = 'bg-gold mesh text-gold-ink'
    theBlockStyle = { height: theHeight, borderTopColor: 'transparent' }
  }

  let theNameSize = 'text-[clamp(1.75rem,5.5vh,3.75rem)]'
  let thePointsSize = 'text-[clamp(1.5rem,4.4vh,3rem)]'
  if (large) {
    theNameSize = 'text-[clamp(3.5rem,7vh,4.5rem)]'
    thePointsSize = 'text-[clamp(2.75rem,5.5vh,3.75rem)]'
  }

  let thePointsLabel = ' pts'
  if (standing.points === 1 || standing.points === -1) {
    thePointsLabel = ' pt'
  }

  let theInitial: { y: string } | false = { y: '110%' }
  if (theReduced === true) {
    theInitial = false
  }

  return (
    <motion.div className="flex h-full min-w-0 flex-col justify-end" initial={theInitial} animate={{ y: '0%' }} transition={{ delay: delay, type: 'spring', stiffness: 130, damping: 21 }}>
      <div className="flex h-[var(--podium-label)] shrink-0 flex-col items-center justify-end px-2 pb-2 text-center xl:pb-3">
        <span className={'display block max-w-full truncate pb-1 ' + theNameSize}>{standing.name}</span>
        <span className={'display tabular text-gold ' + thePointsSize}>
          {standing.points}
          <span className="text-[0.6em] text-muted">{thePointsLabel}</span>
        </span>
      </div>
      <div className={'flex items-start justify-center overflow-hidden [container-type:size] ' + theBlockTone} style={theBlockStyle}>
        <span className="display tabular pt-[0.1em] text-[min(78cqh,60cqw)]">{standing.rank}</span>
      </div>
    </motion.div>
  )
}
