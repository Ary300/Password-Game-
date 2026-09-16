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
  // Sized to the ring's inner circle: the digits and caption together must fit a square inscribed in it,
  // so wider readouts like 1:05 get a smaller scale.
  let theScale = 0.5
  if (theText.length === 1) {
    theScale = 0.52
  }
  if (theText.length === 3) {
    theScale = 0.32
  }
  if (theText.length > 3) {
    theScale = 0.26
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
      <div className="absolute inset-[16%] flex flex-col items-center justify-center overflow-hidden">
        <span className="display tabular block leading-[0.8]" style={{ fontSize: 'calc(var(--timer-ring) * ' + String(theScale) + ')', color: theNumberColor }}>
          {theText}
        </span>
        <span className="label mt-[0.6em] leading-none" style={{ fontSize: 'calc(var(--timer-ring) * 0.055)' }}>
          {theCaption}
        </span>
      </div>
    </div>
  )
}
