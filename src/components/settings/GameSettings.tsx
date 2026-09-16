import { MAX_POINTS, MAX_ROUNDS, MAX_TEAMS, MIN_TEAMS, UNLIMITED_ROUNDS, defaultSettings } from '../../engine/defaults'
import { useGameStore } from '../../store/useGameStore'
import Stepper from '../ui/Stepper'
import Toggle from '../ui/Toggle'
import SettingRow from './SettingRow'
import SettingsSection from './SettingsSection'

export default function GameSettings() {
  const theSettings = useGameStore((theState) => theState.settings)
  const thePhase = useGameStore((theState) => theState.game.phase)
  const updateSettings = useGameStore((theState) => theState.updateSettings)

  // Changing team count mid-game would orphan scores, so it only unlocks on the Setup screen.
  let theTeamControl = (
    <span className="display"><Stepper size="lg" label="Number of teams" value={theSettings.teamCount} min={MIN_TEAMS} max={MAX_TEAMS} onChange={(num) => updateSettings({ teamCount: num })} /></span>
  )
  let theTeamNote: string | undefined = undefined
  if (thePhase !== 'setup') {
    theTeamControl = <span className="display inline-block min-w-24 text-center text-4xl text-muted">{theSettings.teamCount}</span>
    theTeamNote = 'Locked until the game ends'
  }

  const theUnlimited = theSettings.roundsPerGame === UNLIMITED_ROUNDS
  let theRoundsControl = (
    <span className="display"><Stepper size="lg" label="Rounds per game" value={theSettings.roundsPerGame} min={1} max={MAX_ROUNDS} onChange={(num) => updateSettings({ roundsPerGame: num })} /></span>
  )
  if (theUnlimited) {
    theRoundsControl = <span className="display inline-block px-4 text-4xl">No limit</span>
  }

  return (
    <SettingsSection title="Game">
      <SettingRow label="Teams" note={theTeamNote}>
        {theTeamControl}
      </SettingRow>
      <SettingRow label="Rounds">{theRoundsControl}</SettingRow>
      <Toggle
        label="Unlimited rounds"
        checked={theUnlimited}
        onChange={(theValue) => {
          let theRoundsValue = defaultSettings().roundsPerGame
          if (theValue) {
            theRoundsValue = UNLIMITED_ROUNDS
          }
          updateSettings({ roundsPerGame: theRoundsValue })
        }}
      />
      <SettingRow label="Points per correct guess">
        <span className="display"><Stepper size="lg" label="Points per correct guess" value={theSettings.pointsPerCorrect} min={1} max={MAX_POINTS} onChange={(num) => updateSettings({ pointsPerCorrect: num })} /></span>
      </SettingRow>
      <Toggle label="Time bonus" description="+1 point per 5 s left" checked={theSettings.timeBonus} onChange={(theValue) => updateSettings({ timeBonus: theValue })} />
    </SettingsSection>
  )
}
