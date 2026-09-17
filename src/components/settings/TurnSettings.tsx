import { MAX_HANDOFF_SECONDS, MAX_SKIPS, MAX_TURN_SECONDS, MIN_TURN_SECONDS, TURN_STEP_SECONDS } from '../../engine/defaults'
import { useGameStore } from '../../store/useGameStore'
import Stepper from '../ui/Stepper'
import Toggle from '../ui/Toggle'
import SettingRow from './SettingRow'
import SettingsSection from './SettingsSection'

function formatSeconds(num: number): string {
  return String(num) + ' s'
}

export default function TurnSettings() {
  const theSettings = useGameStore((theState) => theState.settings)
  const updateSettings = useGameStore((theState) => theState.updateSettings)

  let theHandoff = null
  if (theSettings.autoAdvance) {
    theHandoff = (
      <SettingRow label="Wait before the next team">
        <span className="display"><Stepper
          size="lg"
          label="Wait before the next team"
          value={theSettings.handoffSeconds}
          min={0}
          max={MAX_HANDOFF_SECONDS}
          format={formatSeconds}
          onChange={(num) => updateSettings({ handoffSeconds: num })}
        /></span>
      </SettingRow>
    )
  }

  return (
    <SettingsSection title="Turn">
      <SettingRow label="Turn length">
        <span className="display"><Stepper
          size="lg"
          label="Turn length"
          value={theSettings.turnSeconds}
          min={MIN_TURN_SECONDS}
          max={MAX_TURN_SECONDS}
          step={TURN_STEP_SECONDS}
          format={formatSeconds}
          onChange={(num) => updateSettings({ turnSeconds: num })}
        /></span>
      </SettingRow>
      <SettingRow label="Skips per turn">
        <span className="display"><Stepper size="lg" label="Skips per turn" value={theSettings.skipsPerTurn} min={0} max={MAX_SKIPS} onChange={(num) => updateSettings({ skipsPerTurn: num })} /></span>
      </SettingRow>
      <Toggle
        label="Keep guessing until time runs out"
        description="After a correct guess the team gets a new word"
        checked={theSettings.multiWord}
        onChange={(theValue) => updateSettings({ multiWord: theValue })}
      />
      <Toggle label="Start the next team automatically" description="Their turn begins after a short wait. Off means you press Next team." checked={theSettings.autoAdvance} onChange={(theValue) => updateSettings({ autoAdvance: theValue })} />
      {theHandoff}
      <Toggle label="3-2-1 before the clock starts" checked={theSettings.countdown} onChange={(theValue) => updateSettings({ countdown: theValue })} />
      <Toggle label="Show the word when time runs out" checked={theSettings.revealOnTimeUp} onChange={(theValue) => updateSettings({ revealOnTimeUp: theValue })} />
    </SettingsSection>
  )
}
