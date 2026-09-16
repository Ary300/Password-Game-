import type { Difficulty } from '../../engine/types'
import { useGameStore } from '../../store/useGameStore'
import Segmented from '../ui/Segmented'
import CategoryChips from './CategoryChips'
import CustomWordsSetting from './CustomWordsSetting'
import LengthSetting from './LengthSetting'
import SettingsSection from './SettingsSection'
import SyllableSetting from './SyllableSetting'
import WordPoolCount from './WordPoolCount'

const theDifficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'All' },
]

export default function WordSettings() {
  const theDifficulty = useGameStore((theState) => theState.settings.difficulty)
  const theBanned = useGameStore((theState) => theState.settings.customBanned)
  const updateSettings = useGameStore((theState) => theState.updateSettings)

  return (
    <SettingsSection title="Words">
      <WordPoolCount />
      <SyllableSetting />
      <LengthSetting />
      <div className="py-3">
        <span className="mb-2 block font-semibold">Difficulty</span>
        <Segmented label="Difficulty" value={theDifficulty} options={theDifficultyOptions} onChange={(theValue) => updateSettings({ difficulty: theValue as Difficulty })} />
      </div>
      <CategoryChips />
      <CustomWordsSetting />
      <div className="py-3">
        <label htmlFor="custom-banned-list" className="block font-semibold">
          Custom banned clues
        </label>
        <span className="label mb-2 block">Rhymes or translations your class wants to ban</span>
        <textarea
          id="custom-banned-list"
          value={theBanned}
          onChange={(theEvent) => updateSettings({ customBanned: theEvent.target.value })}
          rows={3}
          spellCheck={false}
          placeholder={'One per line'}
          className="w-full resize-y border-b-4 border-line bg-surface-2 px-3 py-2 text-base text-text placeholder:text-faint focus:border-gold focus:outline-none"
        />
      </div>
    </SettingsSection>
  )
}
