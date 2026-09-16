import { describe, expect, it } from 'vitest'
import { computeClassStandings, resetClassTotals, topGuessers } from './classBoard'
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

describe('topGuessers and resetClassTotals', () => {
  it('ranks students by career correct and resets totals on request', () => {
    const theClass = makeClass('P3', 'Ana\nBen\nCy')
    theClass.students[0] = { ...theClass.students[0], career: { correct: 3, turns: 4, skips: 0, bestMs: null } }
    theClass.students[1] = { ...theClass.students[1], career: { correct: 9, turns: 4, skips: 0, bestMs: null } }
    const theWithTotals = { ...theClass, totals: { games: 2, turns: 8, correct: 12 } }
    const theTop = topGuessers(theWithTotals, null, 3)
    expect(theTop.length).toBe(2)
    expect(theTop[0].name).toBe('Ben')
    expect(theTop[1].name).toBe('Ana')
    const theReset = resetClassTotals(theWithTotals, false)
    expect(theReset.totals).toEqual({ games: 0, turns: 0, correct: 0 })
    expect(theReset.students[1].career.correct).toBe(9)
    expect(resetClassTotals(theWithTotals, true).students[1].career.correct).toBe(0)
  })
})
