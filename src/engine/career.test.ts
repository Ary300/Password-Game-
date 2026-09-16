import { describe, expect, it } from 'vitest'
import { commitGameToClass, liveCareer, playerStatsFor, reviseCommittedGame } from './career'
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

function game(theClassId: string, theHistory: TurnResult[], theLog: GameState['turnsLog']): GameState {
  return {
    id: 'g',
    phase: 'podium',
    mode: 'class',
    classId: theClassId,
    round: 1,
    currentTeamIndex: 0,
    usedWords: [],
    history: theHistory,
    turnsLog: theLog,
    turn: null,
    handoffEndsAt: null,
    handoffHeld: false,
    poolWarning: [],
    committed: true,
    createdAt: 0,
  }
}

describe('reviseCommittedGame', () => {
  it('swaps the old game numbers for the edited ones', () => {
    const theClass = makeClass('P2', 'Ana')
    const theId = theClass.students[0].id
    const theLog = [{ turnId: 't1', round: 1, teamId: 'a', guesserId: theId, at: 0 }]
    const theOld = game(theClass.id, [result(theId, 'correct', 3000), result(theId, 'correct', 4000)], theLog)
    const theSaved = commitGameToClass(theClass, { ...theOld, committed: false })
    expect(theSaved.students[0].career.correct).toBe(2)
    const theNew = game(theClass.id, [result(theId, 'correct', 3000), result(theId, 'timeup', 4000)], theLog)
    const theRevised = reviseCommittedGame(theSaved, theOld, theNew)
    expect(theRevised.students[0].career.correct).toBe(1)
    expect(theRevised.students[0].career.turns).toBe(1)
    expect(theRevised.totals).toEqual({ games: 1, turns: 1, correct: 1 })
  })
})

describe('playerStatsFor', () => {
  it('lists every player with turns, correct, skips, and best time, best first', () => {
    const theTeams = [
      { id: 'a', name: 'A', color: '#f00', players: [{ id: 'p1', name: 'Ana' }, { id: 'p2', name: 'Ben' }], pickedGuesserId: null },
      { id: 'b', name: 'B', color: '#0f0', players: [{ id: 'p3', name: 'Cy' }], pickedGuesserId: null },
    ]
    const theLog = [
      { turnId: 't1', round: 1, teamId: 'a', guesserId: 'p1', at: 0 },
      { turnId: 't2', round: 1, teamId: 'b', guesserId: 'p3', at: 0 },
    ]
    const theGame = game('c', [result('p3', 'correct', 5000), result('p3', 'correct', 2500), result('p1', 'skip', 0)], theLog)
    const theRows = playerStatsFor(theTeams, theGame)
    expect(theRows.length).toBe(3)
    expect(theRows[0].name).toBe('Cy')
    expect(theRows[0].correct).toBe(2)
    expect(theRows[0].bestMs).toBe(2500)
    expect(theRows[1].name).toBe('Ana')
    expect(theRows[1].skips).toBe(1)
    expect(theRows[1].turns).toBe(1)
    expect(theRows[2].name).toBe('Ben')
    expect(theRows[2].turns).toBe(0)
  })
})
