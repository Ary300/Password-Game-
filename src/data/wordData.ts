import theWordsJson from './words.json'
import type { WordEntry, WordTier } from '../engine/wordTypes'

// words.json stores each word as [word, syllables, tierIndex, categoryIndex]
// so the bundle stays small with 20,000+ words. See scripts/build-words.ts.
type CompactWordFile = { categories: string[]; tiers: string[]; words: (string | number)[][] }

function toTier(theName: string): WordTier {
  if (theName === 'easy' || theName === 'medium' || theName === 'hard') {
    return theName
  }
  throw new Error(`words.json has an unknown tier "${theName}"`)
}

function decodeWords(theFile: CompactWordFile): WordEntry[] {
  const theTiers: WordTier[] = []
  for (let n = 0; n < theFile.tiers.length; n++) {
    theTiers.push(toTier(theFile.tiers[n]))
  }
  const theEntries: WordEntry[] = []
  for (let n = 0; n < theFile.words.length; n++) {
    const theRow = theFile.words[n]
    const theWord = String(theRow[0])
    theEntries.push({
      word: theWord,
      syllables: Number(theRow[1]),
      letters: theWord.length,
      tier: theTiers[Number(theRow[2])],
      category: theFile.categories[Number(theRow[3])],
    })
  }
  return theEntries
}

export const BUILT_IN_WORDS: WordEntry[] = decodeWords(theWordsJson as CompactWordFile)

function buildKnownWords(): string[] {
  const theList: string[] = []
  for (let n = 0; n < BUILT_IN_WORDS.length; n++) {
    theList.push(BUILT_IN_WORDS[n].word)
  }
  return theList
}

export const KNOWN_WORDS: string[] = buildKnownWords()
