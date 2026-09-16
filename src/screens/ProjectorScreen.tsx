import { useGameStore } from '../store/useGameStore'
import LiveScreen from './LiveScreen'
import PodiumScreen from './PodiumScreen'
import TeamUpScreen from './TeamUpScreen'
import BrandMark from '../components/BrandMark'

export default function ProjectorScreen() {
  const thePhase = useGameStore((theState) => theState.game.phase)
  if (thePhase === 'live') {
    return <LiveScreen mode="projector" />
  }
  if (thePhase === 'teamup') {
    return <TeamUpScreen mode="projector" />
  }
  if (thePhase === 'podium') {
    return <PodiumScreen mode="projector" />
  }
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div>
        <BrandMark size="lg" />
        <p className="mt-6 text-2xl text-muted">The game appears here when it starts.</p>
      </div>
    </div>
  )
}
