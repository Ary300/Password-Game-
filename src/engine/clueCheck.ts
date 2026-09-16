export type ClueVerdict = {
  allowed: boolean
  reasons: string[]
  clue: string
  word: string
}

export function normalizeWord(theText: string): string {
  return theText.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const theSuffixes = ['ing', 'est', 'ed', 'er', 'es', 'ly', 's']

export function stripSuffix(theWord: string): string {
  for (let n = 0; n < theSuffixes.length; n++) {
    const theSuffix = theSuffixes[n]
    if (theWord.length > theSuffix.length + 2 && theWord.endsWith(theSuffix)) {
      const theStem = theWord.slice(0, theWord.length - theSuffix.length)
      return undoubleEnding(theStem, theSuffix)
    }
  }
  return theWord
}

// "running" strips to "runn"; dropping the doubled consonant lets it match "run".
function undoubleEnding(theStem: string, theSuffix: string): string {
  if (theSuffix === 's' || theSuffix === 'es' || theSuffix === 'ly' || theStem.length < 3) {
    return theStem
  }
  const theLast = theStem[theStem.length - 1]
  const thePrev = theStem[theStem.length - 2]
  if (theLast === thePrev && 'aeiouls'.indexOf(theLast) === -1) {
    return theStem.slice(0, theStem.length - 1)
  }
  return theStem
}

export function levenshtein(theA: string, theB: string): number {
  const theRows: number[][] = []
  for (let n = 0; n <= theA.length; n++) {
    theRows.push([n])
  }
  for (let i = 0; i <= theB.length; i++) {
    theRows[0][i] = i
  }
  for (let n = 1; n <= theA.length; n++) {
    for (let i = 1; i <= theB.length; i++) {
      let theCost = 1
      if (theA[n - 1] === theB[i - 1]) {
        theCost = 0
      }
      const theDelete = theRows[n - 1][i] + 1
      const theInsert = theRows[n][i - 1] + 1
      const theReplace = theRows[n - 1][i - 1] + theCost
      theRows[n][i] = Math.min(theDelete, theInsert, theReplace)
    }
  }
  return theRows[theA.length][theB.length]
}

// Finds a split of the word into two known parts, using the clue as one side, so "sun" flags "sunflower".
function isCompoundPart(theClue: string, theWord: string, theKnownWords: string[]): boolean {
  if (theClue.length < 3 || theWord.length <= theClue.length) {
    return false
  }
  let theRest = ''
  if (theWord.startsWith(theClue)) {
    theRest = theWord.slice(theClue.length)
  } else if (theWord.endsWith(theClue)) {
    theRest = theWord.slice(0, theWord.length - theClue.length)
  } else {
    return false
  }
  if (theRest.length < 3) {
    return false
  }
  if (theKnownWords.length === 0) {
    return true
  }
  return theKnownWords.indexOf(theRest) !== -1 || theKnownWords.indexOf(stripSuffix(theRest)) !== -1
}

export function checkClue(theClueText: string, theWordText: string, theCustomBanned: string[], theKnownWords: string[]): ClueVerdict {
  const theClue = normalizeWord(theClueText)
  const theWord = normalizeWord(theWordText)
  const theReasons: string[] = []
  if (theClue.length === 0) {
    return { allowed: true, reasons: [], clue: theClue, word: theWord }
  }
  if (theClue === theWord) {
    theReasons.push('The clue is the word itself.')
  }
  if (theClue !== theWord && theWord.length >= 4 && theClue.length >= 3) {
    if (theClue.indexOf(theWord) !== -1) {
      theReasons.push('The clue contains the word "' + theWord + '".')
    } else if (theWord.indexOf(theClue) !== -1 && !isCompoundPart(theClue, theWord, theKnownWords)) {
      theReasons.push('The word contains the clue "' + theClue + '".')
    }
  }
  const theClueStem = stripSuffix(theClue)
  const theWordStem = stripSuffix(theWord)
  if (theClue !== theWord && theClueStem === theWordStem) {
    theReasons.push('Same root word: "' + theClueStem + '".')
  }
  if (theClue !== theWord && theWord.length >= 5 && levenshtein(theClue, theWord) <= 2) {
    theReasons.push('Only a letter or two away from "' + theWord + '".')
  }
  if (isCompoundPart(theClue, theWord, theKnownWords)) {
    theReasons.push('"' + theClue + '" is part of the compound word "' + theWord + '".')
  }
  for (let n = 0; n < theCustomBanned.length; n++) {
    if (normalizeWord(theCustomBanned[n]) === theClue) {
      theReasons.push('"' + theClue + '" is on the class banned list.')
      break
    }
  }
  return { allowed: theReasons.length === 0, reasons: theReasons, clue: theClue, word: theWord }
}

export function parseBannedList(theText: string): string[] {
  const theLines = theText.split(/[\n,]/)
  const theList: string[] = []
  for (let n = 0; n < theLines.length; n++) {
    const theWord = normalizeWord(theLines[n])
    if (theWord.length > 0 && theList.indexOf(theWord) === -1) {
      theList.push(theWord)
    }
  }
  return theList
}
