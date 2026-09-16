import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const CMUDICT_URL = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict'
// OpenSubtitles 2018 counts. Spoken dialogue tracks what a teenager hears and
// says better than web text, which over-ranks words like "homepage".
export const FREQUENCY_URL = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt'
export const GOOGLE_URL = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt'
export const GOOGLE_COMMON_URL =
  'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt'
export const WORDNET_BASE_URL = 'https://raw.githubusercontent.com/moos/wordnet-db/master/dict/'
export const FIRST_NAMES_URL = 'https://raw.githubusercontent.com/dominictarr/random-name/master/first-names.txt'
export const SURNAMES_URL = 'https://raw.githubusercontent.com/dominictarr/random-name/master/names.txt'
export const BAD_WORDS_URL =
  'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en'

export const WORDNET_PARTS = ['noun', 'verb', 'adj', 'adv']

// How WordNet writes a lemma across all of its synsets. A lemma that only
// ever appears capitalised ("Texas") is a proper noun even though the index
// files store it lowercased.
export type WordnetSenses = {
  lowercase: number
  capitalised: number
  tagged: number
  nouns: number
  verbs: number
  adjectives: number
}

export async function fetchCached(theUrl: string, theCachePath: string): Promise<string> {
  if (existsSync(theCachePath)) {
    return readFileSync(theCachePath, 'utf8')
  }
  console.log(`Downloading ${theUrl}`)
  const theResponse = await fetch(theUrl)
  if (!theResponse.ok) {
    throw new Error(`Download failed (${theResponse.status}) for ${theUrl}`)
  }
  const theText = await theResponse.text()
  writeFileSync(theCachePath, theText)
  return theText
}

export function parseCmudict(theText: string): Map<string, number> {
  const theLines = theText.split('\n')
  const theSyllables = new Map<string, number>()
  for (let n = 0; n < theLines.length; n++) {
    const theLine = theLines[n]
    if (theLine === '' || theLine.startsWith(';;;')) {
      continue
    }
    // Some entries carry a trailing "# comment" that would otherwise be
    // read as phonemes.
    const theHashIndex = theLine.indexOf('#')
    let theEntry = theLine
    if (theHashIndex !== -1) {
      theEntry = theLine.slice(0, theHashIndex)
    }
    const theTokens = theEntry.trim().split(/\s+/)
    const theHeadword = theTokens[0]
    // Variant pronunciations look like "word(2)". The first listed one is
    // the common reading, which is the one a class will say out loud.
    if (theHeadword.indexOf('(') !== -1) {
      continue
    }
    let theCount = 0
    for (let i = 1; i < theTokens.length; i++) {
      const theLastChar = theTokens[i].charAt(theTokens[i].length - 1)
      if (theLastChar >= '0' && theLastChar <= '2') {
        theCount++
      }
    }
    theSyllables.set(theHeadword, theCount)
  }
  return theSyllables
}

// Lines look like "word count", already sorted from most to least frequent.
// Only the first maxRank lines are read because the tail of the subtitle
// corpus is mostly typos and one-off names.
export function parseFrequencyRanks(theText: string, theMaxRank: number): Map<string, number> {
  const theRanks = new Map<string, number>()
  let theStart = 0
  let theRank = 0
  while (theStart < theText.length && theRank < theMaxRank) {
    let theEnd = theText.indexOf('\n', theStart)
    if (theEnd === -1) {
      theEnd = theText.length
    }
    const theLine = theText.slice(theStart, theEnd)
    const theSpace = theLine.indexOf(' ')
    let theWord = theLine.trim()
    if (theSpace !== -1) {
      theWord = theLine.slice(0, theSpace)
    }
    if (theWord !== '' && !theRanks.has(theWord)) {
      theRanks.set(theWord, theRank)
    }
    theRank++
    theStart = theEnd + 1
  }
  return theRanks
}

export function parseLineList(theText: string): string[] {
  const theLines = theText.split('\n')
  const theWords: string[] = []
  for (let n = 0; n < theLines.length; n++) {
    const theWord = theLines[n].trim().toLowerCase()
    if (theWord !== '') {
      theWords.push(theWord)
    }
  }
  return theWords
}

export function toSet(theWords: string[]): Set<string> {
  const theSet = new Set<string>()
  for (let n = 0; n < theWords.length; n++) {
    theSet.add(theWords[n])
  }
  return theSet
}

function sensesFor(theMap: Map<string, WordnetSenses>, theWord: string): WordnetSenses {
  let theSenses = theMap.get(theWord)
  if (theSenses === undefined) {
    theSenses = { lowercase: 0, capitalised: 0, tagged: 0, nouns: 0, verbs: 0, adjectives: 0 }
    theMap.set(theWord, theSenses)
  }
  return theSenses
}

// data.* line: "offset lexfile pos wordCountHex word lexIdHex word lexIdHex ... | gloss"
export function addWordnetData(theMap: Map<string, WordnetSenses>, theText: string, thePart: string): void {
  const theLines = theText.split('\n')
  for (let n = 0; n < theLines.length; n++) {
    const theLine = theLines[n]
    // The licence header lines start with two spaces.
    if (theLine === '' || theLine.startsWith(' ')) {
      continue
    }
    const theTokens = theLine.split(' ')
    const theWordCount = parseInt(theTokens[3], 16)
    for (let i = 0; i < theWordCount; i++) {
      let theLemma = theTokens[4 + i * 2]
      // Adjectives can carry a position marker such as "galore(ip)".
      const theParen = theLemma.indexOf('(')
      if (theParen !== -1) {
        theLemma = theLemma.slice(0, theParen)
      }
      const theLower = theLemma.toLowerCase()
      const theSenses = sensesFor(theMap, theLower)
      if (theLemma === theLower) {
        theSenses.lowercase++
        if (thePart === 'noun') {
          theSenses.nouns++
        } else if (thePart === 'verb') {
          theSenses.verbs++
        } else if (thePart === 'adj') {
          theSenses.adjectives++
        }
      } else {
        theSenses.capitalised++
      }
    }
  }
}

// index.* line: "lemma pos synsetCount pointerCount [pointers] senseCount taggedSenseCount offsets".
// The tagged count says how often the word turned up in hand-tagged text,
// which is a rough signal that a lowercase sense is in everyday use.
export function addWordnetIndex(theMap: Map<string, WordnetSenses>, theText: string): void {
  const theLines = theText.split('\n')
  for (let n = 0; n < theLines.length; n++) {
    const theLine = theLines[n]
    if (theLine === '' || theLine.startsWith(' ')) {
      continue
    }
    const theTokens = theLine.split(' ')
    const thePointerCount = parseInt(theTokens[3], 10)
    const theTagged = parseInt(theTokens[4 + thePointerCount + 1], 10)
    const theSenses = sensesFor(theMap, theTokens[0])
    theSenses.tagged = theSenses.tagged + theTagged
  }
}

export async function loadWordnet(theCacheDir: string): Promise<Map<string, WordnetSenses>> {
  const theMap = new Map<string, WordnetSenses>()
  for (let n = 0; n < WORDNET_PARTS.length; n++) {
    const thePart = WORDNET_PARTS[n]
    const theData = await fetchCached(WORDNET_BASE_URL + 'data.' + thePart, join(theCacheDir, 'wordnet-data.' + thePart))
    addWordnetData(theMap, theData, thePart)
    const theIndex = await fetchCached(WORDNET_BASE_URL + 'index.' + thePart, join(theCacheDir, 'wordnet-index.' + thePart))
    addWordnetIndex(theMap, theIndex)
  }
  return theMap
}
