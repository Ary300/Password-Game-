import { toast } from 'sonner'
import { computeStandings } from '../../engine/scoring'
import { useGameStore } from '../../store/useGameStore'

// Reading the total at click time keeps two quick presses from both starting from the same stale number.
export function nudgeScore(theTeamId: string, num: number): void {
  const theState = useGameStore.getState()
  if (theState.game.phase !== 'teamup' && theState.game.phase !== 'live') {
    return
  }
  const theStandings = computeStandings(theState.teams, theState.game.history)
  for (let n = 0; n < theStandings.length; n++) {
    const theRow = theStandings[n]
    if (theRow.teamId === theTeamId) {
      theState.editTeamScore(theTeamId, theRow.points + num, theRow.points)
      let theSign = ''
      if (num > 0) {
        theSign = '+'
      }
      toast(theRow.name + ' ' + theSign + String(num) + ', now ' + String(theRow.points + num) + '. U undoes it.', { id: 'score-nudge' })
      return
    }
  }
}
