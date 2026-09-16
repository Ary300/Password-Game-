import { describe, expect, it } from 'vitest'
import { buildPool, filterPool, matchesFilters, pickWord, widenFilters } from './pickWord'
import type { WordFilters } from './types'
import type { WordEntry } from './wordTypes'
import { WORD_CATEGORIES } from './wordTypes'

function entry(theWord: string, theSyllables: number, theTier: WordEntry['tier'], theCategory: string): WordEntry {
  return { word: theWord, syllables: theSyllables, letters: theWord.length, tier: theTier, category: theCategory }
}

function allCats(): string[] {
  const theList: string[] = []
  for (let n = 0; n < WORD_CATEGORIES.length; n++) {
    theList.push(WORD_CATEGORIES[n])
  }
  return theList
}

function filters(theOverrides: Partial<WordFilters>): WordFilters {
  return {
    syllables: 'any',
    syllableMin: 1,
    syllableMax: 4,
    lengthMin: 0,
    lengthMax: 0,
    difficulty: 'mixed',
    categories: allCats(),
    ...theOverrides,
  }
}

const theList = [
  entry('cat', 1, 'easy', 'animals'),
  entry('banana', 3, 'easy', 'food'),
  entry('telescope', 3, 'medium', 'objects'),
  entry('hippopotamus', 5, 'hard', 'animals'),
  entry('run', 1, 'easy', 'actions'),
  entry('bespoke', 2, 'medium', 'custom'),
]

describe('matchesFilters', () => {
  it('filters by syllables', () => {
    expect(matchesFilters(theList[0], filters({ syllables: '1' }))).toBe(true)
    expect(matchesFilters(theList[1], filters({ syllables: '1' }))).toBe(false)
    expect(matchesFilters(theList[3], filters({ syllables: '4+' }))).toBe(true)
    expect(matchesFilters(theList[1], filters({ syllables: 'custom', syllableMin: 2, syllableMax: 3 }))).toBe(true)
  })
  it('filters by length', () => {
    expect(matchesFilters(theList[0], filters({ lengthMin: 4 }))).toBe(false)
    expect(matchesFilters(theList[2], filters({ lengthMax: 5 }))).toBe(false)
    expect(matchesFilters(theList[2], filters({ lengthMin: 5, lengthMax: 9 }))).toBe(true)
  })
  it('filters by difficulty and category', () => {
    expect(matchesFilters(theList[3], filters({ difficulty: 'hard' }))).toBe(true)
    expect(matchesFilters(theList[0], filters({ difficulty: 'hard' }))).toBe(false)
    expect(matchesFilters(theList[0], filters({ categories: ['food'] }))).toBe(false)
    expect(matchesFilters(theList[1], filters({ categories: ['food'] }))).toBe(true)
  })
  it('always keeps custom words in play', () => {
    expect(matchesFilters(theList[5], filters({ categories: ['food'] }))).toBe(true)
  })
})

describe('filterPool', () => {
  it('drops words already used this game', () => {
    const thePool = filterPool(theList, filters({}), ['cat', 'run'])
    expect(thePool.length).toBe(4)
  })
})

describe('widenFilters', () => {
  it('loosens categories, then difficulty, then length, then syllables', () => {
    const theStep1 = widenFilters(filters({ categories: ['food'], difficulty: 'easy', lengthMin: 3, syllables: '1' }))
    expect(theStep1?.step).toBe('all categories')
    const theStep2 = widenFilters(theStep1!.filters)
    expect(theStep2?.step).toBe('mixed difficulty')
    const theStep3 = widenFilters(theStep2!.filters)
    expect(theStep3?.step).toBe('any word length')
    const theStep4 = widenFilters(theStep3!.filters)
    expect(theStep4?.step).toBe('any syllable count')
    expect(widenFilters(theStep4!.filters)).toBeNull()
  })
})

describe('buildPool', () => {
  it('widens when the pool is too small and reports the steps', () => {
    const theResult = buildPool(theList, filters({ categories: ['food'] }), [])
    expect(theResult.widened.length).toBeGreaterThan(0)
    expect(theResult.widened[0]).toBe('all categories')
  })
})

describe('pickWord', () => {
  it('picks by the random value and never repeats a used word', () => {
    const thePool = filterPool(theList, filters({}), ['cat'])
    const theWord = pickWord(thePool, () => 0)
    expect(theWord?.word).toBe('banana')
    expect(pickWord([], () => 0.5)).toBeNull()
  })
})
