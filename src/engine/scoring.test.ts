import { describe, expect, it } from 'vitest'
import { computeStandings, pointsForCorrect } from './scoring'
import type { Team, TurnResult } from './types'

function team(theId: string): Team {
  return { id: theId, name: theId, color: '#fff', players: [], pickedGuesserId: null }
}

function row(theTeamId: string, theOutcome: TurnResult['outcome'], thePoints: number, theRound: number): TurnResult {
  return {
    id: 'r' + String(Math.random()),
    turnId: theTeamId + String(theRound),
    round: theRound,
    teamId: theTeamId,
    guesserId: null,
    guesser: '',
    swappedFrom: [],
    word: 'x',
    outcome: theOutcome,
    secondsLeft: 0,
    elapsedMs: 0,
    points: thePoints,
    at: 0,
    note: '',
  }
}

describe('pointsForCorrect', () => {
  it('returns the base points without a bonus', () => {
    expect(pointsForCorrect(1, false, 19)).toBe(1)
    expect(pointsForCorrect(3, false, 0)).toBe(3)
  })
  it('adds one point per full 5 seconds left', () => {
    expect(pointsForCorrect(1, true, 20)).toBe(5)
    expect(pointsForCorrect(1, true, 9)).toBe(2)
    expect(pointsForCorrect(1, true, 4)).toBe(1)
  })
})

describe('computeStandings', () => {
  it('ranks by points, then correct, then fewest skips', () => {
    const theTeams = [team('a'), team('b'), team('c'), team('d')]
    const theHistory = [
      row('a', 'correct', 2, 1),
      row('b', 'correct', 1, 1),
      row('b', 'correct', 1, 2),
      row('c', 'correct', 1, 1),
      row('c', 'correct', 1, 2),
      row('c', 'skip', 0, 2),
      row('d', 'adjust', 2, 1),
    ]
    const theRows = computeStandings(theTeams, theHistory)
    expect(theRows[0].teamId).toBe('b')
    expect(theRows[1].teamId).toBe('c')
    expect(theRows[2].teamId).toBe('a')
    expect(theRows[3].teamId).toBe('d')
    expect(theRows[0].rank).toBe(1)
    expect(theRows[1].rank).toBe(2)
  })
  it('gives tied teams the same rank and skips the next rank', () => {
    const theTeams = [team('a'), team('b'), team('c')]
    const theHistory = [row('a', 'correct', 1, 1), row('b', 'correct', 1, 1)]
    const theRows = computeStandings(theTeams, theHistory)
    expect(theRows[0].rank).toBe(1)
    expect(theRows[1].rank).toBe(1)
    expect(theRows[2].rank).toBe(3)
  })
  it('counts turns once per round and ignores adjustments', () => {
    const theTeams = [team('a')]
    const theHistory = [row('a', 'skip', 0, 1), row('a', 'correct', 1, 1), row('a', 'timeup', 0, 2), row('a', 'adjust', 5, 2)]
    const theRows = computeStandings(theTeams, theHistory)
    expect(theRows[0].turns).toBe(2)
    expect(theRows[0].points).toBe(6)
  })
})
