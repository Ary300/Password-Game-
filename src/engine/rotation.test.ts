import { describe, expect, it } from 'vitest'
import { defaultGuesserId, nextTeamIndex, playersYetToGuess, resolveGuesserId } from './rotation'
import type { Team, TurnStart } from './types'

function team(): Team {
  return {
    id: 't',
    name: 'T',
    color: '#fff',
    players: [
      { id: 'ana', name: 'Ana' },
      { id: 'ben', name: 'Ben' },
      { id: 'cy', name: 'Cy' },
    ],
    pickedGuesserId: null,
  }
}

function start(theGuesserId: string, theAt: number): TurnStart {
  return { turnId: 'x' + String(theAt), round: 1, teamId: 't', guesserId: theGuesserId, at: theAt }
}

describe('guesser rotation', () => {
  it('cycles through every player before repeating', () => {
    const theLog: TurnStart[] = []
    const theOrder: string[] = []
    for (let n = 0; n < 6; n++) {
      const theId = defaultGuesserId(team(), theLog, [])
      theOrder.push(String(theId))
      theLog.push(start(String(theId), n))
    }
    expect(theOrder).toEqual(['ana', 'ben', 'cy', 'ana', 'ben', 'cy'])
  })
  it('skips absent students', () => {
    expect(defaultGuesserId(team(), [], ['ana'])).toBe('ben')
    expect(playersYetToGuess(team(), [start('ben', 1)], ['ana']).length).toBe(1)
  })
  it('prefers the fewest guesses even after a manual pick', () => {
    const theLog = [start('cy', 1), start('ana', 2)]
    expect(defaultGuesserId(team(), theLog, [])).toBe('ben')
  })
  it('honours a picked guesser who is present', () => {
    const theTeam = { ...team(), pickedGuesserId: 'cy' }
    expect(resolveGuesserId(theTeam, [], [])).toBe('cy')
    expect(resolveGuesserId(theTeam, [], ['cy'])).toBe('ana')
  })
  it('returns null for a team with no names', () => {
    expect(defaultGuesserId({ ...team(), players: [] }, [], [])).toBeNull()
  })
  it('wraps to the first team and reports a new round', () => {
    expect(nextTeamIndex(0, 3)).toEqual({ index: 1, wrapped: false })
    expect(nextTeamIndex(2, 3)).toEqual({ index: 0, wrapped: true })
  })
})
