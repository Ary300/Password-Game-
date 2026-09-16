import { AMBER_AT_SECONDS, RED_AT_SECONDS } from './defaults'

export type TimerTone = 'normal' | 'amber' | 'red'

export function remainingMs(theStartedAt: number, thePausedAt: number | null, theNow: number, turnSeconds: number): number {
  let theClock = theNow
  if (thePausedAt !== null) {
    theClock = thePausedAt
  }
  const theElapsed = theClock - theStartedAt
  return Math.max(0, turnSeconds * 1000 - theElapsed)
}

export function secondsLeftFromMs(theMs: number): number {
  return Math.ceil(theMs / 1000)
}

// Resuming shifts the start forward by the paused span so the clock picks up where it stopped.
export function resumedStartedAt(theStartedAt: number, thePausedAt: number, theNow: number): number {
  return theStartedAt + (theNow - thePausedAt)
}

export function timerTone(theSecondsLeft: number): TimerTone {
  if (theSecondsLeft <= RED_AT_SECONDS) {
    return 'red'
  }
  if (theSecondsLeft <= AMBER_AT_SECONDS) {
    return 'amber'
  }
  return 'normal'
}

export function formatSeconds(theSecondsLeft: number): string {
  if (theSecondsLeft < 60) {
    return String(theSecondsLeft)
  }
  const theMinutes = Math.floor(theSecondsLeft / 60)
  const theSeconds = theSecondsLeft % 60
  let theSecondsText = String(theSeconds)
  if (theSeconds < 10) {
    theSecondsText = '0' + theSecondsText
  }
  return String(theMinutes) + ':' + theSecondsText
}
