import { motion, useReducedMotion } from 'motion/react'
import type { Standing } from '../../engine/types'

type WinnerLineProps = {
  standings: Standing[]
  final: boolean
  delay: number
  large: boolean
}

function joinNames(theNames: string[]): string {
  if (theNames.length <= 2) {
    return theNames.join(' and ')
  }
  return theNames.slice(0, theNames.length - 1).join(', ') + ', and ' + theNames[theNames.length - 1]
}

export default function WinnerLine({ standings, final, delay, large }: WinnerLineProps) {
  const theReduced = useReducedMotion()
  const theNames: string[] = []
  let theColor = 'var(--gold)'
  for (let n = 0; n < standings.length; n++) {
    if (standings[n].rank === 1) {
      theNames.push(standings[n].name)
      theColor = standings[n].color
    }
  }

  let theHeadline = ''
  let theDetail = ''
  if (theNames.length === 1) {
    theHeadline = theNames[0] + ' takes it'
    if (!final) {
      theHeadline = theNames[0] + ' in front'
    }
  }
  if (theNames.length > 1) {
    theColor = 'var(--gold)'
    theDetail = joinNames(theNames) + ' share first'
    theHeadline = "It's a tie"
    if (!final) {
      theHeadline = 'Tied for first'
    }
  }

  let theHeadlineSize = 'text-[clamp(2.75rem,10vh,6rem)]'
  if (large) {
    theHeadlineSize = 'text-[clamp(5rem,13vh,8rem)]'
  }

  let theInitial: { opacity: number; x: number } | false = { opacity: 0, x: -40 }
  if (theReduced === true) {
    theInitial = false
  }

  let theDetailLine = null
  if (theDetail !== '') {
    theDetailLine = <p className="display truncate pb-[0.2em] text-2xl text-muted xl:text-3xl">{theDetail}</p>
  }

  return (
    <motion.div
      className="varsity-cut flex items-end gap-6 border-l-8 bg-surface-2 py-2 pr-20 pl-6 xl:py-3"
      style={{ borderLeftColor: theColor }}
      initial={theInitial}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay, type: 'spring', stiffness: 200, damping: 22 }}
    >
      <h1 className={'display truncate pt-1 pb-[0.16em] ' + theHeadlineSize} style={{ color: theColor }}>
        {theHeadline}
      </h1>
      {theDetailLine}
    </motion.div>
  )
}
