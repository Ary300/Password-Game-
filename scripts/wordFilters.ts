import type { WordnetSenses } from './wordSources.ts'

export type Blocklist = { exact: Set<string>; fragments: string[] }

export type FilterContext = {
  cmudict: Map<string, number>
  wordnet: Map<string, WordnetSenses>
  stopwords: Set<string>
  blocklist: Blocklist
  properNouns: Set<string>
  firstNames: Set<string>
  surnames: Set<string>
  googleCommon: Set<string>
}

// Reasons are reported in the build output so a surprising drop can be traced.
export const REASON_SHAPE = 'not 3+ lowercase letters'
export const REASON_NO_VOWEL = 'no vowel (abbreviation)'
export const REASON_STOPWORD = 'stopword'
export const REASON_BLOCKED = 'school-safe blocklist'
export const REASON_NO_CMUDICT = 'not in CMUdict'
export const REASON_NOT_WORDNET = 'no lowercase WordNet lemma'
export const REASON_PROPER_LIST = 'proper-nouns.txt'
export const REASON_NAME = 'person name'
export const REASON_MOSTLY_PROPER = 'mostly a proper noun in WordNet'

const INFLECTION_SUFFIXES = ['s', 'es', 'ed', 'ing']
const VOWELS = 'aeiouy'

// Plain lists skip blank lines and # comments. The blocklist keeps lines
// starting with * as substring fragments.
export function parseWordFile(theText: string): string[] {
  const theLines = theText.split('\n')
  const theWords: string[] = []
  for (let n = 0; n < theLines.length; n++) {
    const theLine = theLines[n].trim().toLowerCase()
    if (theLine === '' || theLine.startsWith('#')) {
      continue
    }
    theWords.push(theLine)
  }
  return theWords
}

export function buildBlocklist(theLists: string[][]): Blocklist {
  const theExact = new Set<string>()
  const theFragments: string[] = []
  for (let n = 0; n < theLists.length; n++) {
    const theList = theLists[n]
    for (let i = 0; i < theList.length; i++) {
      const theEntry = theList[i].trim().toLowerCase()
      if (theEntry.startsWith('*')) {
        theFragments.push(theEntry.slice(1))
        continue
      }
      // LDNOOBW mixes in phrases; a game word is always a single word.
      if (/^[a-z]+$/.test(theEntry)) {
        theExact.add(theEntry)
      }
    }
  }
  return { exact: theExact, fragments: theFragments }
}

export function endsWithSibilant(theBase: string): boolean {
  return /(s|x|z|ch|sh)$/.test(theBase)
}

// Only regular endings are expanded. Wider rules such as -er or -y wrongly
// block "butter" and "spicy", so irregular forms go in blocklist.txt by hand.
export function isBlocked(theWord: string, theBlocklist: Blocklist, theKnownWords: Map<string, number>): boolean {
  if (theBlocklist.exact.has(theWord)) {
    return true
  }
  for (let n = 0; n < theBlocklist.fragments.length; n++) {
    if (theWord.indexOf(theBlocklist.fragments[n]) !== -1) {
      return true
    }
  }
  for (let n = 0; n < INFLECTION_SUFFIXES.length; n++) {
    const theSuffix = INFLECTION_SUFFIXES[n]
    if (!theWord.endsWith(theSuffix) || theWord.length <= theSuffix.length + 2) {
      continue
    }
    const theBase = theWord.slice(0, theWord.length - theSuffix.length)
    const theBaseWithE = theBase + 'e'
    if (theSuffix === 'es' && !endsWithSibilant(theBase)) {
      continue
    }
    if (theSuffix === 's' || theSuffix === 'es') {
      if (theBlocklist.exact.has(theBase)) {
        return true
      }
      continue
    }
    // "spiced" is spice + d, so an innocent e-word wins over the blocked
    // stem "spic". "raped" has no innocent reading and stays blocked.
    const theEWordIsInnocent = theKnownWords.has(theBaseWithE) && !theBlocklist.exact.has(theBaseWithE)
    if (theBlocklist.exact.has(theBase) && !theEWordIsInnocent) {
      return true
    }
    if (theBlocklist.exact.has(theBaseWithE)) {
      return true
    }
  }
  return false
}

function hasVowel(theWord: string): boolean {
  for (let n = 0; n < theWord.length; n++) {
    if (VOWELS.indexOf(theWord[n]) !== -1) {
      return true
    }
  }
  return false
}

// Name lists include plenty of ordinary words ("rose", "hunter", "turner"),
// so a name is only dropped when WordNet agrees it is mainly a name, or when
// its single lowercase sense is obscure and the web list never uses it.
function isPersonName(theWord: string, theSenses: WordnetSenses, theContext: FilterContext): boolean {
  const theIsFirstName = theContext.firstNames.has(theWord)
  if (!theIsFirstName && !theContext.surnames.has(theWord)) {
    return false
  }
  if (theSenses.capitalised >= theSenses.lowercase) {
    return true
  }
  if (!theIsFirstName) {
    return false
  }
  return theSenses.lowercase === 1 && theSenses.tagged === 0 && !theContext.googleCommon.has(theWord)
}

// Returns the reason a candidate is rejected, or '' when it is kept. Curated
// words skip the dictionary and proper-noun checks because a person already
// chose them, but they still go through the school-safe blocklist.
export function rejectReason(theWord: string, theIsCurated: boolean, theContext: FilterContext): string {
  if (!/^[a-z]{3,}$/.test(theWord)) {
    return REASON_SHAPE
  }
  if (isBlocked(theWord, theContext.blocklist, theContext.cmudict)) {
    return REASON_BLOCKED
  }
  if (theIsCurated) {
    return ''
  }
  if (!hasVowel(theWord)) {
    return REASON_NO_VOWEL
  }
  if (theContext.stopwords.has(theWord)) {
    return REASON_STOPWORD
  }
  if (!theContext.cmudict.has(theWord)) {
    return REASON_NO_CMUDICT
  }
  const theSenses = theContext.wordnet.get(theWord)
  if (theSenses === undefined || theSenses.lowercase === 0) {
    return REASON_NOT_WORDNET
  }
  if (theContext.properNouns.has(theWord)) {
    return REASON_PROPER_LIST
  }
  if (isPersonName(theWord, theSenses, theContext)) {
    return REASON_NAME
  }
  // Nationalities, places and religions ("congo", "victorian") usually have
  // one rare lowercase sense next to several capitalised ones.
  if (theSenses.capitalised > theSenses.lowercase && theSenses.tagged === 0) {
    return REASON_MOSTLY_PROPER
  }
  return ''
}
