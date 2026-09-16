import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { countSyllablesHeuristic } from '../src/engine/syllables.ts'
import { WORD_CATEGORIES } from '../src/engine/wordTypes.ts'
import type { WordEntry, WordTier } from '../src/engine/wordTypes.ts'
import { buildBlocklist, parseWordFile, rejectReason } from './wordFilters.ts'
import { REASON_INFLECTION, isRedundantInflection, parseIrregularForms } from './wordInflections.ts'
import type { InflectionContext } from './wordInflections.ts'
import type { FilterContext } from './wordFilters.ts'
import {
  BAD_WORDS_URL,
  CMUDICT_URL,
  FIRST_NAMES_URL,
  FREQUENCY_URL,
  GOOGLE_COMMON_URL,
  GOOGLE_URL,
  SURNAMES_URL,
  fetchCached,
  loadWordnet,
  parseCmudict,
  parseFrequencyRanks,
  parseLineList,
  toSet,
} from './wordSources.ts'
import {
  buildCountTable,
  printCountTable,
  printList,
  printReasonCounts,
  printWrapped,
  randomSample,
  syllableBucket,
} from './wordReport.ts'

// Ranks are line numbers in the OpenSubtitles en_full list, counted before
// any filtering. Past rank 100,000 a word appears fewer than about 43 times in
// the whole corpus and the survivors are mostly obscure.
const MAX_FREQUENCY_RANK = 100000
// Final thresholds, chosen by sampling the words at each boundary: roughly
// the top 5,000 raw ranks are words every 14-year-old knows, and by 20,000
// words are familiar but no longer instant.
const EASY_MAX_RANK = 5000
const MEDIUM_MAX_RANK = 20000
const TIERS: WordTier[] = ['easy', 'medium', 'hard']
const GENERAL_CATEGORY = 'general'
const SYLLABLE_BUCKETS = ['1', '2', '3', '4', '5+']
const REQUIRED_SYLLABLE_BUCKETS = ['1', '2', '3', '4']
const SAMPLE_SIZE = 60

const theScriptDir = import.meta.dirname
const theRootDir = join(theScriptDir, '..')
const theCacheDir = join(theScriptDir, '.cache')
const theWordsDir = join(theRootDir, 'words')
const theOutputPath = join(theRootDir, 'src', 'data', 'words.json')

type SourceWord = { word: string; category: string }
type ParsedSource = { words: SourceWord[]; duplicates: string[] }

function isKnownCategory(theName: string): boolean {
  for (let n = 0; n < WORD_CATEGORIES.length; n++) {
    if (WORD_CATEGORIES[n] === theName) {
      return true
    }
  }
  return false
}

function parseSource(theText: string): ParsedSource {
  const theLines = theText.split('\n')
  const theWords: SourceWord[] = []
  const theDuplicates: string[] = []
  const theSeen = new Set<string>()
  let theCategory = ''
  for (let n = 0; n < theLines.length; n++) {
    const theLine = theLines[n].trim()
    if (theLine === '') {
      continue
    }
    if (theLine.startsWith('#')) {
      theCategory = theLine.slice(1).trim()
      if (!isKnownCategory(theCategory)) {
        throw new Error(`source.txt line ${n + 1}: unknown category "${theCategory}"`)
      }
      continue
    }
    if (theCategory === '') {
      throw new Error(`source.txt line ${n + 1}: word "${theLine}" appears before any category heading`)
    }
    // The game shows words verbatim, so anything with spaces, hyphens or
    // capitals is a mistake in the list rather than something to normalise.
    if (!/^[a-z]+$/.test(theLine)) {
      throw new Error(`source.txt line ${n + 1}: "${theLine}" is not a single lowercase word`)
    }
    if (theSeen.has(theLine)) {
      theDuplicates.push(`${theLine} (${theCategory}, line ${n + 1})`)
      continue
    }
    theSeen.add(theLine)
    theWords.push({ word: theLine, category: theCategory })
  }
  return { words: theWords, duplicates: theDuplicates }
}

function tierForRank(theRank: number | undefined): WordTier {
  if (theRank === undefined) {
    return 'hard'
  }
  if (theRank < EASY_MAX_RANK) {
    return 'easy'
  }
  if (theRank < MEDIUM_MAX_RANK) {
    return 'medium'
  }
  return 'hard'
}

function readWordFile(theName: string): string[] {
  return parseWordFile(readFileSync(join(theWordsDir, theName), 'utf8'))
}

async function loadContext(): Promise<FilterContext> {
  const theCmudict = parseCmudict(await fetchCached(CMUDICT_URL, join(theCacheDir, 'cmudict.dict')))
  const theBadWords = parseLineList(await fetchCached(BAD_WORDS_URL, join(theCacheDir, 'ldnoobw-en.txt')))
  const theFirstNames = parseLineList(await fetchCached(FIRST_NAMES_URL, join(theCacheDir, 'first-names.txt')))
  const theSurnames = parseLineList(await fetchCached(SURNAMES_URL, join(theCacheDir, 'surnames.txt')))
  const theGoogleCommon = parseLineList(await fetchCached(GOOGLE_COMMON_URL, join(theCacheDir, 'google-10000.txt')))
  return {
    cmudict: theCmudict,
    wordnet: await loadWordnet(theCacheDir),
    stopwords: toSet(readWordFile('stopwords.txt')),
    blocklist: buildBlocklist([theBadWords, readWordFile('blocklist.txt')]),
    properNouns: toSet(readWordFile('proper-nouns.txt')),
    firstNames: toSet(theFirstNames),
    surnames: toSet(theSurnames),
    googleCommon: toSet(theGoogleCommon),
  }
}

// Frequency order first, then the web list for technical and school words
// that dialogue rarely uses, then curated words that neither list has.
function collectCandidates(theRanks: Map<string, number>, theGoogleWords: string[], theSource: ParsedSource): string[] {
  const theCandidates = Array.from(theRanks.keys())
  const theSeen = toSet(theCandidates)
  for (let n = 0; n < theGoogleWords.length; n++) {
    if (!theSeen.has(theGoogleWords[n])) {
      theSeen.add(theGoogleWords[n])
      theCandidates.push(theGoogleWords[n])
    }
  }
  for (let n = 0; n < theSource.words.length; n++) {
    if (!theSeen.has(theSource.words[n].word)) {
      theSeen.add(theSource.words[n].word)
      theCandidates.push(theSource.words[n].word)
    }
  }
  return theCandidates
}

function countReason(theReasons: Map<string, number>, theReason: string): void {
  theReasons.set(theReason, (theReasons.get(theReason) ?? 0) + 1)
}

function compareByWord(theA: WordEntry, theB: WordEntry): number {
  if (theA.word < theB.word) {
    return -1
  }
  if (theA.word > theB.word) {
    return 1
  }
  return 0
}

// Arrays instead of objects keep 30,000 entries to a few hundred KB; the
// app decodes them once in src/data/wordData.ts.
function writeCompactJson(theEntries: WordEntry[]): void {
  const theCategories: string[] = []
  for (let n = 0; n < WORD_CATEGORIES.length; n++) {
    theCategories.push(WORD_CATEGORIES[n])
  }
  const theRows: (string | number)[][] = []
  for (let n = 0; n < theEntries.length; n++) {
    const theEntry = theEntries[n]
    theRows.push([theEntry.word, theEntry.syllables, TIERS.indexOf(theEntry.tier), theCategories.indexOf(theEntry.category)])
  }
  const theJson = { categories: theCategories, tiers: TIERS, words: theRows }
  writeFileSync(theOutputPath, JSON.stringify(theJson) + '\n')
}

async function main(): Promise<number> {
  mkdirSync(theCacheDir, { recursive: true })
  const theSource = parseSource(readFileSync(join(theWordsDir, 'source.txt'), 'utf8'))
  const theCurated = new Map<string, string>()
  for (let n = 0; n < theSource.words.length; n++) {
    theCurated.set(theSource.words[n].word, theSource.words[n].category)
  }
  const theContext = await loadContext()
  const theRanks = parseFrequencyRanks(await fetchCached(FREQUENCY_URL, join(theCacheDir, 'en_full.txt')), MAX_FREQUENCY_RANK)
  const theGoogleWords = parseLineList(await fetchCached(GOOGLE_URL, join(theCacheDir, 'google-20k.txt')))
  const theCandidates = collectCandidates(theRanks, theGoogleWords, theSource)

  const theReasons = new Map<string, number>()
  const theBlockedCurated: string[] = []
  const theFirstPass: string[] = []
  for (let n = 0; n < theCandidates.length; n++) {
    const theWord = theCandidates[n]
    const theCategory = theCurated.get(theWord)
    const theReason = rejectReason(theWord, theCategory !== undefined, theContext)
    if (theReason === '') {
      theFirstPass.push(theWord)
      continue
    }
    countReason(theReasons, theReason)
    if (theCategory !== undefined) {
      theBlockedCurated.push(`${theWord} (${theCategory})`)
    }
  }

  // Inflections are judged against the whole first pass, so "crabs" can
  // see that "crab" survived.
  const theInflections: InflectionContext = {
    kept: toSet(theFirstPass),
    ranks: theRanks,
    wordnet: theContext.wordnet,
    irregular: parseIrregularForms(readWordFile('irregular-forms.txt')),
  }
  const theEntries: WordEntry[] = []
  const theHeuristicWords: string[] = []
  for (let n = 0; n < theFirstPass.length; n++) {
    const theWord = theFirstPass[n]
    const theCategory = theCurated.get(theWord)
    if (theCategory === undefined && isRedundantInflection(theWord, theInflections)) {
      countReason(theReasons, REASON_INFLECTION)
      continue
    }
    let theSyllables = theContext.cmudict.get(theWord)
    if (theSyllables === undefined) {
      theSyllables = countSyllablesHeuristic(theWord)
      theHeuristicWords.push(`${theWord} (${theCategory}, guessed ${theSyllables})`)
    }
    theEntries.push({
      word: theWord,
      syllables: theSyllables,
      letters: theWord.length,
      tier: tierForRank(theRanks.get(theWord)),
      category: theCategory ?? GENERAL_CATEGORY,
    })
  }
  theEntries.sort(compareByWord)
  writeCompactJson(theEntries)

  printList('DUPLICATES SKIPPED in source.txt, later occurrences dropped', theSource.duplicates)
  printList('CURATED WORDS BLOCKED by the school-safe filter', theBlockedCurated)
  printList('CHECK BY HAND, curated words missing from CMUdict, heuristic syllables used', theHeuristicWords)
  printReasonCounts(theReasons)
  return printSummary(theEntries)
}

function printSummary(theEntries: WordEntry[]): number {
  const theCategories: string[] = []
  for (let n = 0; n < WORD_CATEGORIES.length; n++) {
    theCategories.push(WORD_CATEGORIES[n])
  }
  const tierOf = function (theEntry: WordEntry): string {
    return theEntry.tier
  }
  const syllablesOf = function (theEntry: WordEntry): string {
    return syllableBucket(theEntry.syllables)
  }
  const categoryOf = function (theEntry: WordEntry): string {
    return theEntry.category
  }
  const theTierTable = buildCountTable(theEntries, theCategories, TIERS, categoryOf, tierOf)
  const theSyllableTable = buildCountTable(theEntries, theCategories, SYLLABLE_BUCKETS, categoryOf, syllablesOf)
  const theTierSyllableTable = buildCountTable(theEntries, TIERS, SYLLABLE_BUCKETS, tierOf, syllablesOf)
  printCountTable('Words per category and tier', theTierTable)
  printCountTable('Words per category and syllable count', theSyllableTable)
  printCountTable('Words per tier and syllable count', theTierSyllableTable)

  const theGeneralWords: string[] = []
  for (let n = 0; n < theEntries.length; n++) {
    if (theEntries[n].category === GENERAL_CATEGORY) {
      theGeneralWords.push(theEntries[n].word)
    }
  }
  printWrapped(`Random sample of ${SAMPLE_SIZE} general words`, randomSample(theGeneralWords, SAMPLE_SIZE))

  const theKilobytes = Math.round(statSync(theOutputPath).size / 1024)
  console.log('')
  console.log(`Wrote ${theEntries.length} words (${theKilobytes} KB) to ${theOutputPath}`)

  const theEmpty: string[] = []
  for (let n = 0; n < REQUIRED_SYLLABLE_BUCKETS.length; n++) {
    if (theSyllableTable.cells['all'][REQUIRED_SYLLABLE_BUCKETS[n]] === 0) {
      theEmpty.push(`no ${REQUIRED_SYLLABLE_BUCKETS[n]}-syllable words`)
    }
  }
  if (theEmpty.length > 0) {
    printList('EMPTY BUCKETS', theEmpty)
    return 1
  }
  return 0
}

main().then(
  function (theExitCode: number): void {
    process.exitCode = theExitCode
  },
  function (theError: unknown): void {
    console.error(theError)
    process.exitCode = 1
  },
)
