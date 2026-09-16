import { useGameStore } from '../../store/useGameStore'
import Segmented from '../ui/Segmented'
import Stepper from '../ui/Stepper'

const MAX_LETTERS = 20
const START_MIN_LETTERS = 3
const START_MAX_LETTERS = 8

const theModeOptions = [
  { value: 'any', label: 'Any' },
  { value: 'range', label: 'Letter range' },
]

function formatLetters(num: number): string {
  if (num === 0) {
    return 'Any'
  }
  return String(num)
}

export default function LengthSetting() {
  const theSettings = useGameStore((theState) => theState.settings)
  const updateSettings = useGameStore((theState) => theState.updateSettings)

  let theMode = 'range'
  if (theSettings.lengthMin === 0 && theSettings.lengthMax === 0) {
    theMode = 'any'
  }

  let theSteppers = null
  if (theMode === 'range') {
    let theMinCeiling = MAX_LETTERS
    if (theSettings.lengthMax > 0) {
      theMinCeiling = theSettings.lengthMax
    }
    theSteppers = (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-2">
          <span className="label">Min</span>
          <span className="display"><Stepper label="Fewest letters" value={theSettings.lengthMin} min={0} max={theMinCeiling} format={formatLetters} onChange={(num) => updateSettings({ lengthMin: num })} /></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="label">Max</span>
          <span className="display"><Stepper label="Most letters" value={theSettings.lengthMax} min={theSettings.lengthMin} max={MAX_LETTERS} format={formatLetters} onChange={(num) => updateSettings({ lengthMax: num })} /></span>
        </div>
      </div>
    )
  }

  return (
    <div className="py-3">
      <span className="mb-2 block font-semibold">Word length</span>
      <Segmented
        label="Word length"
        value={theMode}
        options={theModeOptions}
        onChange={(theValue) => {
          if (theValue === 'any') {
            updateSettings({ lengthMin: 0, lengthMax: 0 })
            return
          }
          updateSettings({ lengthMin: START_MIN_LETTERS, lengthMax: START_MAX_LETTERS })
        }}
      />
      {theSteppers}
    </div>
  )
}
