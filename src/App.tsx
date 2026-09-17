import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import ClueChecker from './components/ClueChecker'
import SettingsDrawer from './components/SettingsDrawer'
import ShortcutsOverlay from './components/ShortcutsOverlay'
import TopBar from './components/TopBar'
import { STORE_KEY } from './engine/defaults'
import { useGameDriver, useGameReactions } from './hooks/useGameEffects'
import { useHotkeys } from './hooks/useHotkeys'
import { usePhaseRoute } from './hooks/usePhaseRoute'
import LeaderboardScreen from './screens/LeaderboardScreen'
import LiveScreen from './screens/LiveScreen'
import PodiumScreen from './screens/PodiumScreen'
import ProjectorScreen from './screens/ProjectorScreen'
import SetupScreen from './screens/SetupScreen'
import TeamUpScreen from './screens/TeamUpScreen'
import { useGameStore } from './store/useGameStore'

function useThemeAttribute() {
  const theTheme = useGameStore((theState) => theState.settings.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theTheme
  }, [theTheme])
}

// A projector window in the same browser follows the teacher's window through localStorage change events.
function useCrossWindowSync() {
  useEffect(() => {
    function onStorage(theEvent: StorageEvent) {
      if (theEvent.key === STORE_KEY) {
        useGameStore.persist.rehydrate()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
}

function ControlApp() {
  const theNavigate = useNavigate()
  const theLocation = useLocation()
  const theSettings = useGameStore((theState) => theState.settings)
  const updateSettings = useGameStore((theState) => theState.updateSettings)
  const setShortcutsOpen = useGameStore((theState) => theState.setShortcutsOpen)
  const setClueCheckerOpen = useGameStore((theState) => theState.setClueCheckerOpen)
  const undo = useGameStore((theState) => theState.undo)
  useGameDriver(true)
  useGameReactions(true)
  usePhaseRoute()

  useHotkeys(
    {
      '?': () => setShortcutsOpen(true),
      m: () => updateSettings({ sound: !theSettings.sound }),
      c: () => setClueCheckerOpen(true),
      l: () => {
        if (theLocation.pathname === '/leaderboard') {
          theNavigate(-1)
        } else {
          theNavigate('/leaderboard')
        }
      },
      u: () => {
        const theLabel = undo()
        if (theLabel === null) {
          toast('Nothing to undo in this turn', { id: 'undo' })
        } else {
          toast.success('Undone: ' + theLabel, { id: 'undo' })
        }
      },
      f: () => {
        if (document.fullscreenElement === null) {
          document.documentElement.requestFullscreen().catch(() => undefined)
        } else {
          document.exitFullscreen().catch(() => undefined)
        }
      },
    },
    true,
  )

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main className="relative min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<SetupScreen />} />
          <Route path="/teamup" element={<TeamUpScreen mode="control" />} />
          <Route path="/live" element={<LiveScreen mode="control" />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/podium" element={<PodiumScreen mode="control" />} />
          <Route path="*" element={<SetupScreen />} />
        </Routes>
      </main>
      <SettingsDrawer />
      <ClueChecker />
      <ShortcutsOverlay />
    </div>
  )
}

function ProjectorApp() {
  useGameReactions(false)
  return <ProjectorScreen />
}

export default function App() {
  const theLocation = useLocation()
  useThemeAttribute()
  useCrossWindowSync()
  let theBody = <ControlApp />
  if (theLocation.pathname === '/projector') {
    theBody = <ProjectorApp />
  }
  return (
    <>
      {theBody}
      <Toaster position="top-right" offset={72} theme="dark" toastOptions={{ style: { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--line)', fontSize: '16px' } }} />
    </>
  )
}
