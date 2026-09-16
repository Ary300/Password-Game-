import type { MouseEvent } from 'react'
import { useNow } from '../../hooks/useNow'
import Button from '../ui/Button'

type HandoffPanelProps = {
  endsAt: number | null
  held: boolean
  handoffSeconds: number
  projector: boolean
  onStart: () => void
  onHold: (theHeld: boolean) => void
  onSkipTeam: () => void
}

function blurThen(theAction: () => void) {
  return (theEvent: MouseEvent<HTMLButtonElement>) => {
    theEvent.currentTarget.blur()
    theAction()
  }
}

export default function HandoffPanel({ endsAt, held, handoffSeconds, projector, onStart, onHold, onSkipTeam }: HandoffPanelProps) {
  const theNow = useNow(endsAt !== null)
  let theClock = null
  let theHeadline = ''
  if (projector) {
    theHeadline = 'Waiting for the teacher'
  }
  if (held) {
    theHeadline = 'On hold'
  }
  if (endsAt !== null) {
    const theMsLeft = Math.max(0, endsAt - theNow)
    let theFraction = 0
    if (handoffSeconds > 0) {
      theFraction = Math.min(1, theMsLeft / (handoffSeconds * 1000))
    }
    theHeadline = 'Starts in'
    theClock = (
      <div className="flex items-end gap-5">
        <span className="display tabular pt-[0.08em] text-[clamp(96px,15vh,190px)] text-gold [@media(max-height:700px)]:text-[64px]">{Math.ceil(theMsLeft / 1000)}</span>
        <div className="mb-4 h-4 w-[clamp(100px,12vw,320px)] bg-surface-3 [@media(max-height:700px)]:mb-2 [@media(max-height:700px)]:w-20">
          <div className="h-full origin-left bg-gold" style={{ transform: 'scaleX(' + String(theFraction) + ')' }} />
        </div>
      </div>
    )
  }
  let theActions = null
  if (!projector) {
    let theHoldButton = null
    if (endsAt !== null) {
      theHoldButton = (
        <Button size="lg" hotkey="H" onClick={blurThen(() => onHold(true))}>
          Hold
        </Button>
      )
    } else if (held) {
      theHoldButton = (
        <Button size="lg" hotkey="H" onClick={blurThen(() => onHold(false))}>
          Auto start
        </Button>
      )
    }
    let theStartLabel = 'Start turn'
    if (endsAt !== null) {
      theStartLabel = 'Start now'
    }
    theActions = (
      <div className="flex flex-wrap items-end gap-1.5">
        <Button variant="primary" size="xl" hotkey="Space" onClick={blurThen(onStart)} className="[@media(max-height:700px)]:h-14 [@media(max-height:700px)]:px-5 [@media(max-height:700px)]:text-3xl">
          {theStartLabel}
        </Button>
        {theHoldButton}
        <Button size="lg" hotkey="X" onClick={blurThen(onSkipTeam)}>
          Skip team
        </Button>
      </div>
    )
  }
  let theStatus = null
  if (theHeadline.length > 0) {
    let theHeadlineClass = 'label text-xl'
    if (projector && theClock === null) {
      theHeadlineClass = 'display text-[clamp(48px,7vh,84px)]'
    }
    theStatus = (
      <div>
        <p className={theHeadlineClass}>{theHeadline}</p>
        {theClock}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-3 max-[1199px]:gap-x-4 max-[1199px]:[&_kbd]:hidden">
      {theStatus}
      {theActions}
    </div>
  )
}
