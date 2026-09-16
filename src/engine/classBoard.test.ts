import { describe, expect, it } from 'vitest'
import { computeClassStandings } from './classBoard'
import { makeClass } from './roster'

describe('computeClassStandings', () => {
  it('ranks classes by average correct per turn and folds in the live game', () => {
    const theA = { ...makeClass('A', ''), totals: { games: 1, turns: 10, correct: 5 } }
    const theB = { ...makeClass('B', ''), totals: { games: 1, turns: 10, correct: 7 } }
    const theC = makeClass('C', '')
    const theRows = computeClassStandings([theA, theB, theC], { classId: theA.id, totals: { games: 0, turns: 10, correct: 10 } })
    expect(theRows[0].name).toBe('A')
    expect(theRows[0].average).toBeCloseTo(0.75)
    expect(theRows[1].name).toBe('B')
    expect(theRows[2].name).toBe('C')
    expect(theRows[2].rank).toBe(3)
  })
})
