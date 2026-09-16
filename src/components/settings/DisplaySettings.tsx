import type { ThemeChoice } from '../../engine/types'
import { useGameStore } from '../../store/useGameStore'
import Segmented from '../ui/Segmented'
import Toggle from '../ui/Toggle'
import SettingRow from './SettingRow'
import SettingsSection from './SettingsSection'

const theThemeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

export default function DisplaySettings() {
  const theSound = useGameStore((theState) => theState.settings.sound)
  const theTheme = useGameStore((theState) => theState.settings.theme)
  const updateSettings = useGameStore((theState) => theState.updateSettings)

  return (
    <SettingsSection title="Sound and display">
      <Toggle label="Sound" checked={theSound} onChange={(theValue) => updateSettings({ sound: theValue })} />
      <SettingRow label="Theme">
        <div className="w-48">
          <Segmented label="Theme" value={theTheme} options={theThemeOptions} onChange={(theValue) => updateSettings({ theme: theValue as ThemeChoice })} />
        </div>
      </SettingRow>
    </SettingsSection>
  )
}
