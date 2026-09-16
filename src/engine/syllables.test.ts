import { describe, expect, it } from 'vitest'
import { countSyllablesHeuristic } from './syllables.ts'

describe('countSyllablesHeuristic', () => {
  it('counts a single vowel group', () => {
    expect(countSyllablesHeuristic('cat')).toBe(1)
    expect(countSyllablesHeuristic('dog')).toBe(1)
  })

  it('treats a double vowel as one group', () => {
    expect(countSyllablesHeuristic('tree')).toBe(1)
    expect(countSyllablesHeuristic('boot')).toBe(1)
  })

  it('drops a trailing silent e', () => {
    expect(countSyllablesHeuristic('cake')).toBe(1)
    expect(countSyllablesHeuristic('home')).toBe(1)
  })

  it('keeps the e in consonant plus le endings', () => {
    expect(countSyllablesHeuristic('table')).toBe(2)
    expect(countSyllablesHeuristic('apple')).toBe(2)
    expect(countSyllablesHeuristic('purple')).toBe(2)
  })

  it('counts multiple vowel groups', () => {
    expect(countSyllablesHeuristic('banana')).toBe(3)
    expect(countSyllablesHeuristic('elephant')).toBe(3)
    expect(countSyllablesHeuristic('computer')).toBe(3)
  })

  it('never returns less than one', () => {
    expect(countSyllablesHeuristic('the')).toBe(1)
    expect(countSyllablesHeuristic('')).toBe(1)
  })

  it('ignores letter case', () => {
    expect(countSyllablesHeuristic('Banana')).toBe(3)
    expect(countSyllablesHeuristic('CAKE')).toBe(1)
  })
})
