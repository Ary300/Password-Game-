const VOWELS = 'aeiouy'

function isVowel(theLetter: string): boolean {
  return VOWELS.indexOf(theLetter) !== -1
}

// Rough vowel-group count. Only used for words CMUdict does not know,
// so it favours the common English cases over the odd ones.
export function countSyllablesHeuristic(theWord: string): number {
  const theLower = theWord.toLowerCase()
  let theCount = 0
  let thePreviousWasVowel = false
  for (let n = 0; n < theLower.length; n++) {
    const theIsVowel = isVowel(theLower[n])
    if (theIsVowel && !thePreviousWasVowel) {
      theCount++
    }
    thePreviousWasVowel = theIsVowel
  }
  // A trailing "e" is usually silent (cake, home), except in "-le" after a
  // consonant (table, little) where it carries its own syllable.
  if (theLower.length > 2 && theLower.endsWith('e')) {
    const theEndsInConsonantLe = theLower.endsWith('le') && !isVowel(theLower[theLower.length - 3])
    if (!theEndsInConsonantLe) {
      theCount--
    }
  }
  if (theCount < 1) {
    return 1
  }
  return theCount
}
