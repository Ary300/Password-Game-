import { endsWithSibilant } from './wordFilters.ts'
import type { WordnetSenses } from './wordSources.ts'

export const REASON_INFLECTION = 'inflection of a more common kept word'

// A form with two or more noun meanings is a word in its own right
// ("painting", "building", "saw"), so it stays even when its base is kept.
const OWN_NOUN_SENSES = 2

export type InflectionContext = {
  kept: Set<string>
  ranks: Map<string, number>
  wordnet: Map<string, WordnetSenses>
  irregular: Map<string, string>
}

// Lines in irregular-forms.txt read "form base".
export function parseIrregularForms(theLines: string[]): Map<string, string> {
  const theForms = new Map<string, string>()
  for (let n = 0; n < theLines.length; n++) {
    const theParts = theLines[n].split(/\s+/)
    if (theParts.length !== 2) {
      throw new Error(`irregular-forms.txt: "${theLines[n]}" should be "form base"`)
    }
    theForms.set(theParts[0], theParts[1])
  }
  return theForms
}

// Adds the stem as written, with a silent e restored ("hoped"), and with a
// doubled final consonant undone ("planned", "bigger").
function pushStemBases(theBases: string[], theStem: string): void {
  theBases.push(theStem)
  theBases.push(theStem + 'e')
  const theLength = theStem.length
  if (theLength > 2 && theStem[theLength - 1] === theStem[theLength - 2]) {
    theBases.push(theStem.slice(0, theLength - 1))
  }
}

function pushSuffixBases(theBases: string[], theWord: string, theSuffix: string): void {
  if (!theWord.endsWith(theSuffix)) {
    return
  }
  const theStem = theWord.slice(0, theWord.length - theSuffix.length)
  // "happier" and "carried" turn a final y into i.
  if (theStem.endsWith('i')) {
    theBases.push(theStem.slice(0, theStem.length - 1) + 'y')
  }
  pushStemBases(theBases, theStem)
}

export function pluralBases(theWord: string): string[] {
  const theBases: string[] = []
  if (theWord.endsWith('ies')) {
    theBases.push(theWord.slice(0, theWord.length - 3) + 'y')
  }
  if (theWord.endsWith('es') && endsWithSibilant(theWord.slice(0, theWord.length - 2))) {
    theBases.push(theWord.slice(0, theWord.length - 2))
  }
  // "glass", "cactus" and "axis" end in s without being plurals.
  if (theWord.endsWith('s') && !/(ss|us|is)$/.test(theWord)) {
    theBases.push(theWord.slice(0, theWord.length - 1))
  }
  return theBases
}

export function verbFormBases(theWord: string): string[] {
  const theBases: string[] = []
  pushSuffixBases(theBases, theWord, 'ed')
  pushSuffixBases(theBases, theWord, 'ing')
  return theBases
}

export function comparativeBases(theWord: string): string[] {
  const theBases: string[] = []
  pushSuffixBases(theBases, theWord, 'er')
  pushSuffixBases(theBases, theWord, 'est')
  return theBases
}

function rankOrLast(theRanks: Map<string, number>, theWord: string): number {
  const theRank = theRanks.get(theWord)
  if (theRank === undefined) {
    return Number.MAX_SAFE_INTEGER
  }
  return theRank
}

type PartOfSpeech = 'noun' | 'verb' | 'adjective'

function sensesAs(theContext: InflectionContext, theWord: string, thePart: PartOfSpeech): number {
  const theSenses = theContext.wordnet.get(theWord)
  if (theSenses === undefined) {
    return 0
  }
  if (thePart === 'noun') {
    return theSenses.nouns
  }
  if (thePart === 'verb') {
    return theSenses.verbs
  }
  return theSenses.adjectives
}

// The base has to be the right part of speech, otherwise "feed" would look
// like "fee" + d and "rider" like a comparative.
function hasCommonerBase(theWord: string, theBases: string[], theBasePart: PartOfSpeech, theContext: InflectionContext): boolean {
  const theWordRank = rankOrLast(theContext.ranks, theWord)
  for (let n = 0; n < theBases.length; n++) {
    const theBase = theBases[n]
    if (theBase === theWord || theBase.length < 3 || !theContext.kept.has(theBase)) {
      continue
    }
    if (sensesAs(theContext, theBase, theBasePart) === 0) {
      continue
    }
    if (rankOrLast(theContext.ranks, theBase) <= theWordRank) {
      return true
    }
  }
  return false
}

function isRedundantPlural(theWord: string, theContext: InflectionContext): boolean {
  const theBases = pluralBases(theWord)
  for (let n = 0; n < theBases.length; n++) {
    // Only a noun base makes this a plural; "news" is not the plural of "new".
    if (hasCommonerBase(theWord, [theBases[n]], 'noun', theContext)) {
      return true
    }
  }
  return false
}

// WordNet lists some inflections as lemmas of their own ("planned", "crabs",
// "older"). The base is the better game word, so the form goes unless people
// use it more than the base ("interesting", "stairs") or it names something
// by itself ("painting", "wedding").
export function isRedundantInflection(theWord: string, theContext: InflectionContext): boolean {
  if (isRedundantPlural(theWord, theContext)) {
    return true
  }
  const theNouns = sensesAs(theContext, theWord, 'noun')
  if (theNouns >= OWN_NOUN_SENSES) {
    return false
  }
  const theIrregularBase = theContext.irregular.get(theWord)
  if (theIrregularBase !== undefined) {
    const theBases = [theIrregularBase]
    if (hasCommonerBase(theWord, theBases, 'verb', theContext) || hasCommonerBase(theWord, theBases, 'noun', theContext)) {
      return true
    }
  }
  if (hasCommonerBase(theWord, verbFormBases(theWord), 'verb', theContext)) {
    return true
  }
  // Any noun sense at all marks an -er word as a doer ("rider", "closer"),
  // which is a different word from the adjective's comparative.
  if (theNouns > 0) {
    return false
  }
  return hasCommonerBase(theWord, comparativeBases(theWord), 'adjective', theContext)
}
