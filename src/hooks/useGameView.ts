import { useMemo } from 'react'
import { absentIds } from '../engine/roster'
import { computeStandings } from '../engine/scoring'
import { findClass, useGameStore, currentTeamOf } from '../store/useGameStore'

export function useStandings() {
  const theTeams = useGameStore((theState) => theState.teams)
  const theHistory = useGameStore((theState) => theState.game.history)
  return useMemo(() => computeStandings(theTeams, theHistory), [theTeams, theHistory])
}

export function useCurrentTeam() {
  const theTeams = useGameStore((theState) => theState.teams)
  const theGame = useGameStore((theState) => theState.game)
  return currentTeamOf(theTeams, theGame)
}

export function useGameClass() {
  const theClasses = useGameStore((theState) => theState.classes)
  const theClassId = useGameStore((theState) => theState.game.classId)
  return findClass(theClasses, theClassId)
}

export function useAbsentIds() {
  const theClass = useGameClass()
  return useMemo(() => absentIds(theClass), [theClass])
}
