import type { SyllableChoice } from '../../engine/types'
import { useGameStore } from '../../store/useGameStore'
import Segmented from '../ui/Segmented'
import Stepper from '../ui/Stepper'

const theOptions = [
  { value: 'any', label: 'Any' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4+', label: '4+' },
  { value: 'custom', label: 'Custom' },
]

const MAX_SYLLABLES = 8

export default function SyllableSetting() {
  const theSettings = useGameStore((theState) => theState.settings)
  const updateSettings = useGameStore((theState) => theState.updateSettings)

  let theCustom = null
  if (theSettings.syllables === 'custom') {
    theCustom = (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-2">
          <span className="label">Min</span>
          <span className="display"><Stepper label="Fewest syllables" value={theSettings.syllableMin} min={1} max={theSettings.syllableMax} onChange={(num) => updateSettings({ syllableMin: num })} /></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="label">Max</span>
          <span className="display"><Stepper label="Most syllables" value={theSettings.syllableMax} min={theSettings.syllableMin} max={MAX_SYLLABLES} onChange={(num) => updateSettings({ syllableMax: num })} /></span>
        </div>
      </div>
    )
  }

  return (
    <div className="py-3">
      <span className="mb-2 block font-semibold">Syllables</span>
      <Segmented label="Syllables" value={theSettings.syllables} options={theOptions} onChange={(theValue) => updateSettings({ syllables: theValue as SyllableChoice })} />
      {theCustom}
    </div>
  )
}
