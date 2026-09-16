import { describe, expect, it } from 'vitest'
import { formatSeconds, remainingMs, resumedStartedAt, secondsLeftFromMs, timerTone } from './timer'

describe('remainingMs', () => {
  it('counts down from the start timestamp', () => {
    expect(remainingMs(1000, null, 6000, 20)).toBe(15000)
  })
  it('never goes below zero', () => {
    expect(remainingMs(1000, null, 60000, 20)).toBe(0)
  })
  it('freezes while paused', () => {
    expect(remainingMs(1000, 4000, 9000, 20)).toBe(17000)
  })
  it('resumes without losing the paused span', () => {
    const theStart = resumedStartedAt(1000, 4000, 9000)
    expect(remainingMs(theStart, null, 9000, 20)).toBe(17000)
  })
})

describe('timer display', () => {
  it('rounds up so the clock shows 20 at the start and 1 right before the end', () => {
    expect(secondsLeftFromMs(20000)).toBe(20)
    expect(secondsLeftFromMs(19999)).toBe(20)
    expect(secondsLeftFromMs(1)).toBe(1)
    expect(secondsLeftFromMs(0)).toBe(0)
  })
  it('changes tone at 10 and 5 seconds', () => {
    expect(timerTone(11)).toBe('normal')
    expect(timerTone(10)).toBe('amber')
    expect(timerTone(5)).toBe('red')
  })
  it('formats minutes for long turns', () => {
    expect(formatSeconds(59)).toBe('59')
    expect(formatSeconds(120)).toBe('2:00')
    expect(formatSeconds(65)).toBe('1:05')
  })
})
