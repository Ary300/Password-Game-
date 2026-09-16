import { useEffect, useState } from 'react'
import { HelpCircle, Maximize, Minimize, Moon, MonitorUp, Settings as SettingsIcon, ShieldQuestion, Sun, Volume2, VolumeX } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import BrandMark from './BrandMark'
import MoreMenu from './topbar/MoreMenu'

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

function toggleFullscreen() {
  if (document.fullscreenElement === null) {
    document.documentElement.requestFullscreen().catch(() => undefined)
  } else {
    document.exitFullscreen().catch(() => undefined)
  }
}

// The F key and the browser's own Esc exit both change fullscreen, so the icon follows the event instead of the click.
function useIsFullscreen(): boolean {
  const [theFull, setTheFull] = useState(() => document.fullscreenElement !== null)
  useEffect(() => {
    function onChange() {
      setTheFull(document.fullscreenElement !== null)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  return theFull
}

export default function TopBar() {
  const theFullscreen = useIsFullscreen()
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
            theState = 'text-text shadow-[inset_0_-4px_0_0_var(--crimson)]'
          }
          return 'relative flex h-14 items-center px-3 text-sm font-bold whitespace-nowrap transition-colors max-[899px]:px-2 max-[899px]:text-[13px] ' + theState
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
    theRound = <span className="tabular mr-2 hidden bg-gold px-3 py-1 text-sm font-black whitespace-nowrap text-gold-ink wdth-condensed min-[900px]:inline">Round {theGame.round}{theOf}</span>
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
  let theFullIcon = <Maximize size={20} />
  let theFullLabel = 'Enter fullscreen (F)'
  if (theFullscreen) {
    theFullIcon = <Minimize size={20} />
    theFullLabel = 'Exit fullscreen (F)'
  }
  const theIconButton = 'inline-flex h-10 w-10 shrink-0 items-center justify-center text-muted transition-colors hover:bg-surface-2 hover:text-text'
  const theFoldable = theIconButton + ' max-[899px]:hidden'
  const theMoreItems = [
    { label: 'Check a clue', icon: <ShieldQuestion size={18} />, hint: 'C', onSelect: () => setClueCheckerOpen(true) },
    { label: theFullLabel.replace(' (F)', ''), icon: theFullIcon, hint: 'F', onSelect: toggleFullscreen },
    { label: 'Switch theme', icon: theThemeIcon, hint: '', onSelect: () => updateSettings({ theme: theNextTheme }) },
    { label: 'Open projector window', icon: <MonitorUp size={18} />, hint: '', onSelect: openProjector },
    { label: 'Keyboard shortcuts', icon: <HelpCircle size={18} />, hint: '?', onSelect: () => setShortcutsOpen(true) },
  ]

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b-2 border-surface-3 bg-bg px-4 max-[899px]:gap-1 max-[899px]:px-3">
      <div className="shrink-0 max-[1099px]:[&>div>span+span]:hidden">
        <BrandMark />
      </div>
      <nav className="ml-4 flex h-full min-w-0 items-stretch max-[899px]:ml-1" aria-label="Screens">
        {theItems}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {theRound}
        <button type="button" className={theFoldable} onClick={() => setClueCheckerOpen(true)} title="Check a clue (C)" aria-label="Check a clue">
          <ShieldQuestion size={20} />
        </button>
        <button type="button" className={theIconButton} onClick={() => updateSettings({ sound: !theSettings.sound })} title={theSoundLabel} aria-label={theSoundLabel}>
          {theSoundIcon}
        </button>
        <button type="button" className={theFoldable} onClick={() => updateSettings({ theme: theNextTheme })} title="Switch theme" aria-label="Switch theme">
          {theThemeIcon}
        </button>
        <button type="button" className={theFoldable} onClick={toggleFullscreen} title={theFullLabel} aria-label={theFullLabel} aria-pressed={theFullscreen}>
          {theFullIcon}
        </button>
        <button type="button" className={theFoldable} onClick={openProjector} title="Open projector window" aria-label="Open projector window">
          <MonitorUp size={20} />
        </button>
        <button type="button" className={theFoldable} onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">
          <HelpCircle size={20} />
        </button>
        <MoreMenu items={theMoreItems} className="min-[900px]:hidden" />
        <button type="button" className={theIconButton + ' text-text'} onClick={() => setSettingsOpen(true)} title="Settings" aria-label="Settings">
          <SettingsIcon size={20} />
        </button>
      </div>
    </header>
  )
}
