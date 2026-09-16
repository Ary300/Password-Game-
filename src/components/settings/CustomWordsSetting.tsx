import { useMemo } from 'react'
import type { CustomWordMode } from '../../engine/types'
import { parseCustomWords } from '../../engine/wordList'
import { useGameStore } from '../../store/useGameStore'
import Segmented from '../ui/Segmented'

const theModeOptions = [
  { value: 'add', label: 'Add to built-in list' },
  { value: 'replace', label: 'Replace built-in list' },
]

export default function CustomWordsSetting() {
  const theText = useGameStore((theState) => theState.settings.customWords)
  const theMode = useGameStore((theState) => theState.settings.customWordMode)
  const updateSettings = useGameStore((theState) => theState.updateSettings)
  const theCount = useMemo(() => parseCustomWords(theText).length, [theText])

  let theCountLabel = String(theCount) + ' words'
  if (theCount === 1) {
    theCountLabel = '1 word'
  }

  return (
    <div className="py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor="custom-word-list" className="font-semibold">
          Custom word list
        </label>
        <span className="label tabular">{theCountLabel}</span>
      </div>
      <textarea
        id="custom-word-list"
        value={theText}
        onChange={(theEvent) => updateSettings({ customWords: theEvent.target.value })}
        rows={4}
        spellCheck={false}
        placeholder={'photosynthesis\nmitochondria'}
        className="w-full resize-y border-b-4 border-line bg-surface-2 px-3 py-2 text-base text-text placeholder:text-faint focus:border-gold focus:outline-none"
      />
      <p className="label mt-1 mb-2">One per line. Filters skip these.</p>
      <Segmented label="Custom word mode" value={theMode} options={theModeOptions} onChange={(theValue) => updateSettings({ customWordMode: theValue as CustomWordMode })} />
    </div>
  )
}
