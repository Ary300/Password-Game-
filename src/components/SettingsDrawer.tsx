import { useGameStore } from '../store/useGameStore'
import DisplaySettings from './settings/DisplaySettings'
import GameSettings from './settings/GameSettings'
import TurnSettings from './settings/TurnSettings'
import WordSettings from './settings/WordSettings'
import Button from './ui/Button'
import Drawer from './ui/Drawer'

export default function SettingsDrawer() {
  const theOpen = useGameStore((theState) => theState.settingsOpen)
  const setSettingsOpen = useGameStore((theState) => theState.setSettingsOpen)
  const resetSettings = useGameStore((theState) => theState.resetSettings)

  const theFooter = (
    <div className="flex items-center justify-between gap-3">
      <Button variant="danger" onClick={resetSettings}>
        Reset to defaults
      </Button>
      <Button variant="primary" className="min-w-28" onClick={() => setSettingsOpen(false)}>
        Done
      </Button>
    </div>
  )

  return (
    <Drawer open={theOpen} onOpenChange={setSettingsOpen} title="Settings" footer={theFooter}>
      <TurnSettings />
      <GameSettings />
      <WordSettings />
      <DisplaySettings />
    </Drawer>
  )
}
