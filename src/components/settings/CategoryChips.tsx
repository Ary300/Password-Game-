import { allCategories } from '../../engine/defaults'
import { WORD_CATEGORIES } from '../../engine/wordTypes'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'

function categoryLabel(theCategory: string): string {
  if (theCategory === 'general') {
    return 'Everything else'
  }
  return theCategory.charAt(0).toUpperCase() + theCategory.slice(1)
}

export default function CategoryChips() {
  const theSelected = useGameStore((theState) => theState.settings.categories)
  const updateSettings = useGameStore((theState) => theState.updateSettings)

  let theOnCount = 0
  for (let n = 0; n < WORD_CATEGORIES.length; n++) {
    if (theSelected.indexOf(WORD_CATEGORIES[n]) !== -1) {
      theOnCount = theOnCount + 1
    }
  }

  // An empty category list would leave no words to draw, so the last chip cannot switch off.
  function toggleCategory(theCategory: string) {
    const theNext: string[] = []
    let theWasOn = false
    for (let n = 0; n < theSelected.length; n++) {
      if (theSelected[n] === theCategory) {
        theWasOn = true
      } else {
        theNext.push(theSelected[n])
      }
    }
    if (theWasOn && theOnCount <= 1) {
      return
    }
    if (!theWasOn) {
      theNext.push(theCategory)
    }
    updateSettings({ categories: theNext })
  }

  function keepFirstSelected() {
    for (let n = 0; n < WORD_CATEGORIES.length; n++) {
      if (theSelected.indexOf(WORD_CATEGORIES[n]) !== -1) {
        updateSettings({ categories: [WORD_CATEGORIES[n]] })
        return
      }
    }
  }

  const theChips = []
  for (let n = 0; n < WORD_CATEGORIES.length; n++) {
    const theCategory = WORD_CATEGORIES[n]
    const theOn = theSelected.indexOf(theCategory) !== -1
    let theStyle = 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-text'
    if (theOn) {
      theStyle = 'bg-crimson text-white hover:bg-crimson-deep'
    }
    let theTitle: string | undefined = undefined
    if (theOn && theOnCount <= 1) {
      theTitle = 'Keep at least one category'
    }
    theChips.push(
      <button
        key={theCategory}
        type="button"
        aria-pressed={theOn}
        title={theTitle}
        onClick={() => toggleCategory(theCategory)}
        className={'h-10 px-3 text-sm font-bold transition-colors ' + theStyle}
      >
        {categoryLabel(theCategory)}
      </button>,
    )
  }

  let theHint = null
  if (theOnCount <= 1) {
    theHint = <p className="label mt-2">At least one category stays on.</p>
  }

  return (
    <div className="py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold">Categories</span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" disabled={theOnCount === WORD_CATEGORIES.length} onClick={() => updateSettings({ categories: allCategories() })}>
            Select all
          </Button>
          <Button size="sm" variant="ghost" disabled={theOnCount <= 1} onClick={keepFirstSelected}>
            Clear
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">{theChips}</div>
      {theHint}
    </div>
  )
}
