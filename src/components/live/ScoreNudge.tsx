import type { MouseEvent } from 'react'
import { nudgeScore } from './nudgeScore'

type ScoreNudgeProps = {
  teamId: string
  teamName: string
  direction: 'row' | 'column'
}

function blurThen(theAction: () => void) {
  return (theEvent: MouseEvent<HTMLButtonElement>) => {
    theEvent.currentTarget.blur()
    theAction()
  }
}

export default function ScoreNudge({ teamId, teamName, direction }: ScoreNudgeProps) {
  const theButton =
    'inline-flex h-8 w-9 items-center justify-center bg-surface-2 text-lg font-black text-muted transition-colors hover:bg-surface-3 hover:text-text focus-visible:outline-2 focus-visible:outline-gold'
  let theLayout = 'flex shrink-0 gap-1'
  if (direction === 'column') {
    theLayout = 'flex shrink-0 flex-col gap-1'
  }
  return (
    <div className={theLayout} role="group" aria-label={'Correct ' + teamName + ' score'}>
      <button type="button" className={theButton} onClick={blurThen(() => nudgeScore(teamId, 1))} title={'Add a point to ' + teamName} aria-label={'Add a point to ' + teamName}>
        +1
      </button>
      <button type="button" className={theButton} onClick={blurThen(() => nudgeScore(teamId, -1))} title={'Take a point from ' + teamName} aria-label={'Take a point from ' + teamName}>
        −1
      </button>
    </div>
  )
}
