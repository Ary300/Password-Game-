import { formatSeconds, secondsLeftFromMs, timerTone } from '../../engine/timer'
import ProgressRing from './ProgressRing'

type TimerRingProps = {
  msLeft: number
  totalMs: number
  paused: boolean
}

export default function TimerRing({ msLeft, totalMs, paused }: TimerRingProps) {
  const theSeconds = secondsLeftFromMs(msLeft)
  const theTone = timerTone(theSeconds)
  let theColor = 'var(--gold)'
  let theNumberColor = 'var(--text)'
  let thePulse = ''
  if (theTone === 'amber') {
    theColor = 'var(--warn)'
    theNumberColor = 'var(--warn)'
  }
  if (theTone === 'red') {
    theColor = 'var(--bad)'
    theNumberColor = 'var(--bad)'
    if (!paused && msLeft > 0) {
      thePulse = ' animate-pulse-red'
    }
  }
  const theText = formatSeconds(theSeconds)
  // Two digits get the 200px-plus size; minute readouts like 1:05 shrink so they stay inside the ring.
  let theScale = 0.72
  if (theText.length === 3) {
    theScale = 0.5
  }
  if (theText.length > 3) {
    theScale = 0.4
  }
  let theCaption = 'seconds'
  if (paused) {
    theCaption = 'Paused'
  }
  let theFraction = 0
  if (totalMs > 0) {
    theFraction = msLeft / totalMs
  }
  return (
    <div
      className={'relative shrink-0' + thePulse}
      style={{ width: 'var(--timer-ring)', height: 'var(--timer-ring)' }}
      role="timer"
      aria-label={String(theSeconds) + ' seconds left'}
    >
      <ProgressRing fraction={theFraction} color={theColor} strokeWidth={9} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display tabular" style={{ fontSize: 'calc(var(--timer-ring) * ' + String(theScale) + ')', color: theNumberColor }}>
          {theText}
        </span>
        <span className="label mt-2 text-lg">{theCaption}</span>
      </div>
    </div>
  )
}
