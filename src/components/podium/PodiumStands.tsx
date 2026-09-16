import type { CSSProperties } from 'react'
import type { Standing } from '../../engine/types'
import PodiumBlock from './PodiumBlock'

type PodiumStandsProps = {
  standings: Standing[]
  large: boolean
}

// The blocks rise from third to first, so the winner is the last thing the room sees.
const STEP_SECONDS = 0.45
const START_SECONDS = 0.15

export default function PodiumStands({ standings, large }: PodiumStandsProps) {
  let theCount = standings.length
  if (theCount > 3) {
    theCount = 3
  }

  // Classic podium order puts second on the left, first in the middle, third on the right.
  const theSlots = [1, 0, 2]
  const theBlocks = []
  for (let n = 0; n < theSlots.length; n++) {
    const theIndex = theSlots[n]
    if (theIndex >= theCount) {
      continue
    }
    const theDelay = START_SECONDS + (theCount - 1 - theIndex) * STEP_SECONDS
    theBlocks.push(<PodiumBlock key={standings[theIndex].teamId} standing={standings[theIndex]} delay={theDelay} large={large} />)
  }

  let theColumns = 'grid-cols-3 max-w-[1200px]'
  if (theCount === 2) {
    theColumns = 'grid-cols-2 max-w-[820px]'
  }
  if (theCount === 1) {
    theColumns = 'grid-cols-1 max-w-[420px]'
  }

  let theLabel = 'clamp(4.5rem, 14vh, 8rem)'
  if (large) {
    theLabel = 'clamp(6rem, 16vh, 10rem)'
  }
  const theStyle = { '--podium-label': theLabel } as CSSProperties

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className={'mx-auto grid min-h-0 w-full flex-1 items-end gap-2 ' + theColumns} style={theStyle}>
        {theBlocks}
      </div>
      <div className="h-2 shrink-0 bg-surface-3" aria-hidden="true" />
    </div>
  )
}
