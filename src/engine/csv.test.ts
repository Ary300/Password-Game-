import { describe, expect, it } from 'vitest'
import { resultsToCsv } from './csv'

describe('resultsToCsv', () => {
  it('writes standings then history and quotes commas', () => {
    const theCsv = resultsToCsv(
      [{ rank: 1, teamId: 'a', name: 'Red, Hot', color: '#f00', points: 3, correct: 2, skipped: 1, turns: 2 }],
      [{ id: 'a', name: 'Red, Hot', color: '#f00', players: [], pickedGuesserId: null }],
      [
        {
          id: 'r1',
          turnId: 't1',
          round: 1,
          teamId: 'a',
          guesserId: null,
          guesser: 'Ana',
          swappedFrom: ['Ben'],
          word: 'cat',
          outcome: 'correct',
          secondsLeft: 12,
          elapsedMs: 3400,
          points: 1,
          at: 0,
          note: '',
        },
      ],
    )
    const theLines = theCsv.split('\n')
    expect(theLines[0]).toBe('Rank,Team,Points,Correct,Skipped,Turns')
    expect(theLines[1]).toBe('1,"Red, Hot",3,2,1,2')
    expect(theLines[4]).toBe('1,"Red, Hot",Ana,Ben,cat,correct,12,3.4,1,')
  })
})
