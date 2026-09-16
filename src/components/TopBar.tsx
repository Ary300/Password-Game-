import { HelpCircle, Moon, MonitorUp, Settings as SettingsIcon, ShieldQuestion, Sun, Volume2, VolumeX } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import BrandMark from './BrandMark'

const theLinks = [
  { to: '/', label: 'Setup' },
  { to: '/teamup', label: 'Team up' },
  { to: '/live', label: 'Live' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/podium', label: 'Podium' },
]

function openProjector() {
  window.open(window.location.pathname + '#/projector', 'pt-password-projector', 'popup,width=1280,height=720')
}

export default function TopBar() {
  const theSettings = useGameStore((theState) => theState.settings)
  const theGame = useGameStore((theState) => theState.game)
  const updateSettings = useGameStore((theState) => theState.updateSettings)
  const setSettingsOpen = useGameStore((theState) => theState.setSettingsOpen)
  const setShortcutsOpen = useGameStore((theState) => theState.setShortcutsOpen)
  const setClueCheckerOpen = useGameStore((theState) => theState.setClueCheckerOpen)

  const theItems = []
  for (let n = 0; n < theLinks.length; n++) {
    const theLink = theLinks[n]
    theItems.push(
      <NavLink
        key={theLink.to}
        to={theLink.to}
        end
        className={({ isActive }) => {
          let theState = 'text-muted hover:text-text'
          if (isActive) {
            theState = 'bg-surface-3 text-text'
          }
          return 'rounded-lg px-3 py-1.5 text-sm font-semibold transition ' + theState
        }}
      >
        {theLink.label}
      </NavLink>,
    )
  }

  let theRound = null
  if (theGame.phase === 'teamup' || theGame.phase === 'live') {
    let theOf = ''
    if (theSettings.roundsPerGame > 0) {
      theOf = ' of ' + String(theSettings.roundsPerGame)
    }
    theRound = <span className="tabular hidden rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-semibold text-muted md:inline">Round {theGame.round}{theOf}</span>
  }

  let theSoundIcon = <VolumeX size={20} />
  let theSoundLabel = 'Turn sound on (M)'
  if (theSettings.sound) {
    theSoundIcon = <Volume2 size={20} />
    theSoundLabel = 'Mute sound (M)'
  }
  let theThemeIcon = <Sun size={20} />
  let theNextTheme: 'dark' | 'light' = 'light'
  if (theSettings.theme === 'light') {
    theThemeIcon = <Moon size={20} />
    theNextTheme = 'dark'
  }
  const theIconButton = 'inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text'

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-bg px-4">
      <BrandMark />
      <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Screens">
        {theItems}
      </nav>
      <div className="ml-auto flex items-center gap-1">
        {theRound}
        <button type="button" className={theIconButton} onClick={() => setClueCheckerOpen(true)} title="Check a clue (C)" aria-label="Check a clue">
          <ShieldQuestion size={20} />
        </button>
        <button type="button" className={theIconButton} onClick={() => updateSettings({ sound: !theSettings.sound })} title={theSoundLabel} aria-label={theSoundLabel}>
          {theSoundIcon}
        </button>
        <button type="button" className={theIconButton} onClick={() => updateSettings({ theme: theNextTheme })} title="Switch theme" aria-label="Switch theme">
          {theThemeIcon}
        </button>
        <button type="button" className={theIconButton} onClick={openProjector} title="Open projector window" aria-label="Open projector window">
          <MonitorUp size={20} />
        </button>
        <button type="button" className={theIconButton} onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">
          <HelpCircle size={20} />
        </button>
        <button type="button" className={theIconButton + ' text-text'} onClick={() => setSettingsOpen(true)} title="Settings" aria-label="Settings">
          <SettingsIcon size={20} />
        </button>
      </div>
    </header>
  )
}
