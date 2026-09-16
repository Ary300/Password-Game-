import { Routes, Route } from 'react-router-dom'
import TopBar from './components/TopBar'
import SetupScreen from './screens/SetupScreen'
import TeamUpScreen from './screens/TeamUpScreen'
import LiveScreen from './screens/LiveScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import PodiumScreen from './screens/PodiumScreen'

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<SetupScreen />} />
          <Route path="/teamup" element={<TeamUpScreen />} />
          <Route path="/live" element={<LiveScreen />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/podium" element={<PodiumScreen />} />
          <Route path="*" element={<SetupScreen />} />
        </Routes>
      </main>
    </div>
  )
}
