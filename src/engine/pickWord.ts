import { MIN_POOL_SIZE } from './defaults'
import type { WordFilters } from './types'
import type { WordEntry } from './wordTypes'
import { WORD_CATEGORIES } from './wordTypes'

function syllableRange(theFilters: WordFilters): { min: number; max: number } {
  if (theFilters.syllables === '1') {
    return { min: 1, max: 1 }
  }
  if (theFilters.syllables === '2') {
    return { min: 2, max: 2 }
  }
  if (theFilters.syllables === '3') {
    return { min: 3, max: 3 }
  }
  if (theFilters.syllables === '4+') {
    return { min: 4, max: 99 }
  }
  if (theFilters.syllables === 'custom') {
    return { min: theFilters.syllableMin, max: theFilters.syllableMax }
  }
  return { min: 1, max: 99 }
}

export function matchesFilters(theEntry: WordEntry, theFilters: WordFilters): boolean {
  // The teacher typed custom words on purpose, so no filter should hide them.
  if (theEntry.category === 'custom') {
    return true
  }
  const theRange = syllableRange(theFilters)
  if (theEntry.syllables < theRange.min || theEntry.syllables > theRange.max) {
    return false
  }
  if (theFilters.lengthMin > 0 && theEntry.letters < theFilters.lengthMin) {
    return false
  }
  if (theFilters.lengthMax > 0 && theEntry.letters > theFilters.lengthMax) {
    return false
  }
  if (theFilters.difficulty !== 'mixed' && theEntry.tier !== theFilters.difficulty) {
    return false
  }
  if (theFilters.categories.indexOf(theEntry.category) === -1) {
    return false
  }
  return true
}

export function filterPool(theList: WordEntry[], theFilters: WordFilters, theUsedWords: string[]): WordEntry[] {
  const thePool: WordEntry[] = []
  for (let n = 0; n < theList.length; n++) {
    const theEntry = theList[n]
    if (theUsedWords.indexOf(theEntry.word) !== -1) {
      continue
    }
    if (matchesFilters(theEntry, theFilters)) {
      thePool.push(theEntry)
    }
  }
  return thePool
}

// Loosens one filter at a time, in the order a teacher would least mind losing.
export function widenFilters(theFilters: WordFilters): { filters: WordFilters; step: string } | null {
  if (theFilters.categories.length < WORD_CATEGORIES.length) {
    const theAll: string[] = []
    for (let n = 0; n < WORD_CATEGORIES.length; n++) {
      theAll.push(WORD_CATEGORIES[n])
    }
    return { filters: { ...theFilters, categories: theAll }, step: 'all categories' }
  }
  if (theFilters.difficulty !== 'mixed') {
    return { filters: { ...theFilters, difficulty: 'mixed' }, step: 'mixed difficulty' }
  }
  if (theFilters.lengthMin > 0 || theFilters.lengthMax > 0) {
    return { filters: { ...theFilters, lengthMin: 0, lengthMax: 0 }, step: 'any word length' }
  }
  if (theFilters.syllables !== 'any') {
    return { filters: { ...theFilters, syllables: 'any' }, step: 'any syllable count' }
  }
  return null
}

export type PoolResult = {
  pool: WordEntry[]
  filters: WordFilters
  widened: string[]
}

// Widens until at least MIN_POOL_SIZE words remain, and reports each step so the TeamUp screen can explain it.
export function buildPool(theList: WordEntry[], theFilters: WordFilters, theUsedWords: string[]): PoolResult {
  let theCurrent = theFilters
  let thePool = filterPool(theList, theCurrent, theUsedWords)
  const theWidened: string[] = []
  for (let n = 0; n < 4; n++) {
    if (thePool.length >= MIN_POOL_SIZE) {
      break
    }
    const theNext = widenFilters(theCurrent)
    if (theNext === null) {
      break
    }
    theCurrent = theNext.filters
    theWidened.push(theNext.step)
    thePool = filterPool(theList, theCurrent, theUsedWords)
  }
  return { pool: thePool, filters: theCurrent, widened: theWidened }
}

export function pickWord(thePool: WordEntry[], theRandom: () => number): WordEntry | null {
  if (thePool.length === 0) {
    return null
  }
  const theIndex = Math.floor(theRandom() * thePool.length)
  return thePool[Math.min(theIndex, thePool.length - 1)]
}
