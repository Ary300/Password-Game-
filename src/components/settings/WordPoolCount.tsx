import { useMemo } from 'react'
import { MIN_POOL_SIZE, defaultSettings } from '../../engine/defaults'
import { buildPool, filterPool } from '../../engine/pickWord'
import { filtersFromSettings } from '../../store/gameState'
import { activeWordList, useGameStore } from '../../store/useGameStore'

export default function WordPoolCount() {
  const theSettings = useGameStore((theState) => theState.settings)
  const theCustomWords = theSettings.customWords
  const theCustomMode = theSettings.customWordMode
  const theSyllables = theSettings.syllables
  const theSyllableMin = theSettings.syllableMin
  const theSyllableMax = theSettings.syllableMax
  const theLengthMin = theSettings.lengthMin
  const theLengthMax = theSettings.lengthMax
  const theDifficulty = theSettings.difficulty
  const theCategories = theSettings.categories

  // Keyed on the filter fields only, so typing a banned clue does not re-scan the whole word list.
  const theCounts = useMemo(() => {
    const theSnapshot = {
      ...defaultSettings(),
      customWords: theCustomWords,
      customWordMode: theCustomMode,
      syllables: theSyllables,
      syllableMin: theSyllableMin,
      syllableMax: theSyllableMax,
      lengthMin: theLengthMin,
      lengthMax: theLengthMax,
      difficulty: theDifficulty,
      categories: theCategories,
    }
    const theList = activeWordList(theSnapshot)
    const theFilters = filtersFromSettings(theSnapshot)
    // buildPool widens tiny pools, so the strict count tells the teacher when that will happen.
    const theStrict = filterPool(theList, theFilters, []).length
    return { inPlay: buildPool(theList, theFilters, []).pool.length, strict: theStrict, total: theList.length }
  }, [theCustomWords, theCustomMode, theSyllables, theSyllableMin, theSyllableMax, theLengthMin, theLengthMax, theDifficulty, theCategories])

  let theWarning = null
  if (theCounts.strict < MIN_POOL_SIZE) {
    theWarning = <p className="mt-2 text-sm font-semibold text-warn">Under {MIN_POOL_SIZE} exact matches. The game will loosen a filter.</p>
  }

  return (
    <div className="mt-2 mb-3 bg-surface-2 px-5 py-4" aria-live="polite">
      <div className="flex items-end gap-4">
        <span className="display text-7xl text-gold">{theCounts.inPlay.toLocaleString()}</span>
        <span className="pb-1">
          <span className="block text-lg font-bold">words in play</span>
          <span className="label block">of {theCounts.total.toLocaleString()}</span>
        </span>
      </div>
      {theWarning}
    </div>
  )
}
