import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { GamePhase } from '../engine/types'
import { useGameStore } from '../store/useGameStore'

export function routeForPhase(thePhase: GamePhase): string {
  if (thePhase === 'teamup') {
    return '/teamup'
  }
  if (thePhase === 'live') {
    return '/live'
  }
  if (thePhase === 'podium') {
    return '/podium'
  }
  return '/'
}

// Follows the game when its phase changes, but leaves the teacher alone when they open another screen mid-phase.
export function usePhaseRoute(): void {
  const theNavigate = useNavigate()
  const theLocation = useLocation()
  const thePhase = useGameStore((theState) => theState.game.phase)
  useEffect(() => {
    const theTarget = routeForPhase(thePhase)
    if (theLocation.pathname !== theTarget && theLocation.pathname !== '/leaderboard') {
      theNavigate(theTarget, { replace: true })
    }
    // Only a phase change should move the teacher.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thePhase])
}
