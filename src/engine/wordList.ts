import { normalizeWord } from './clueCheck'
import { countSyllablesHeuristic } from './syllables'
import type { CustomWordMode } from './types'
import type { WordEntry } from './wordTypes'

export function parseCustomWords(theText: string): WordEntry[] {
  const theLines = theText.split(/[\n,]/)
  const theEntries: WordEntry[] = []
  const theSeen: string[] = []
  for (let n = 0; n < theLines.length; n++) {
    const theWord = theLines[n].trim().toLowerCase()
    if (theWord.length === 0 || theSeen.indexOf(theWord) !== -1) {
      continue
    }
    theSeen.push(theWord)
    theEntries.push({
      word: theWord,
      syllables: countSyllablesHeuristic(theWord),
      letters: normalizeWord(theWord).length,
      tier: 'medium',
      category: 'custom',
    })
  }
  return theEntries
}

// Custom words win over a built-in duplicate so the teacher's version is the one that shows.
export function combineWordLists(theBuiltIn: WordEntry[], theCustomText: string, theMode: CustomWordMode): WordEntry[] {
  const theCustom = parseCustomWords(theCustomText)
  if (theMode === 'replace' && theCustom.length > 0) {
    return theCustom
  }
  const theCombined: WordEntry[] = []
  const theCustomWords: string[] = []
  for (let n = 0; n < theCustom.length; n++) {
    theCombined.push(theCustom[n])
    theCustomWords.push(theCustom[n].word)
  }
  for (let n = 0; n < theBuiltIn.length; n++) {
    if (theCustomWords.indexOf(theBuiltIn[n].word) === -1) {
      theCombined.push(theBuiltIn[n])
    }
  }
  return theCombined
}
