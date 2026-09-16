import { describe, expect, it } from 'vitest'
import { commitGameToClass, liveCareer } from './career'
import { makeClass } from './roster'
import type { GameState, TurnResult } from './types'

function result(theGuesserId: string, theOutcome: TurnResult['outcome'], theElapsed: number): TurnResult {
  return {
    id: 'r' + String(Math.random()),
    turnId: 't1',
    round: 1,
    teamId: 'a',
    guesserId: theGuesserId,
    guesser: 'Ana',
    swappedFrom: [],
    word: 'cat',
    outcome: theOutcome,
    secondsLeft: 10,
    elapsedMs: theElapsed,
    points: 1,
    at: 0,
    note: '',
  }
}

describe('career stats', () => {
  it('adds the live game on top of saved career and commits once', () => {
    const theClass = makeClass('P1', 'Ana')
    const theId = theClass.students[0].id
    theClass.students[0] = { ...theClass.students[0], career: { correct: 13, turns: 5, skips: 0, bestMs: 5000 } }
    const theGame: GameState = {
      id: 'g',
      phase: 'live',
      mode: 'class',
      classId: theClass.id,
      round: 1,
      currentTeamIndex: 0,
      usedWords: [],
      history: [result(theId, 'correct', 3400), result(theId, 'skip', 0)],
      turnsLog: [{ turnId: 't1', round: 1, teamId: 'a', guesserId: theId, at: 0 }],
      turn: null,
      handoffEndsAt: null,
      handoffHeld: false,
      poolWarning: [],
      committed: false,
      createdAt: 0,
    }
    const theLive = liveCareer(theClass.students[0], theGame)
    expect(theLive.correct).toBe(14)
    expect(theLive.bestMs).toBe(3400)
    const theSaved = commitGameToClass(theClass, theGame)
    expect(theSaved.students[0].career.correct).toBe(14)
    expect(theSaved.totals).toEqual({ games: 1, turns: 1, correct: 1 })
  })
})
