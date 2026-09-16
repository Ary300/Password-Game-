import { describe, expect, it } from 'vitest'
import { combineWordLists, parseCustomWords } from './wordList'
import type { WordEntry } from './wordTypes'

const theBuiltIn: WordEntry[] = [
  { word: 'cat', syllables: 1, letters: 3, tier: 'easy', category: 'animals' },
  { word: 'photosynthesis', syllables: 5, letters: 14, tier: 'hard', category: 'nature' },
]

describe('custom word lists', () => {
  it('parses one word per line and skips blanks and repeats', () => {
    const theWords = parseCustomWords('Mitochondria\n\nmitochondria\nice cream')
    expect(theWords.length).toBe(2)
    expect(theWords[0].word).toBe('mitochondria')
    expect(theWords[1].letters).toBe(8)
    expect(theWords[0].category).toBe('custom')
  })
  it('adds to the built-in list without duplicates', () => {
    const theList = combineWordLists(theBuiltIn, 'cat\nosmosis', 'add')
    expect(theList.length).toBe(3)
    expect(theList[0].category).toBe('custom')
  })
  it('replaces the built-in list when asked, unless the custom list is empty', () => {
    expect(combineWordLists(theBuiltIn, 'osmosis', 'replace').length).toBe(1)
    expect(combineWordLists(theBuiltIn, '', 'replace').length).toBe(2)
  })
})
