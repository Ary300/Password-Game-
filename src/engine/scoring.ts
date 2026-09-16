import { TIME_BONUS_SECONDS } from './defaults'
import type { Standing, Team, TurnResult } from './types'

export function pointsForCorrect(pointsPerCorrect: number, timeBonus: boolean, secondsLeft: number): number {
  let thePoints = pointsPerCorrect
  if (timeBonus) {
    thePoints = thePoints + Math.floor(Math.max(0, secondsLeft) / TIME_BONUS_SECONDS)
  }
  return thePoints
}

function compareStandings(theA: Standing, theB: Standing): number {
  if (theA.points !== theB.points) {
    return theB.points - theA.points
  }
  if (theA.correct !== theB.correct) {
    return theB.correct - theA.correct
  }
  return theA.skipped - theB.skipped
}

function countTurns(theTeamId: string, theHistory: TurnResult[]): number {
  const theSeen: string[] = []
  for (let n = 0; n < theHistory.length; n++) {
    const theRow = theHistory[n]
    if (theRow.teamId !== theTeamId || theRow.outcome === 'adjust') {
      continue
    }
    const theKey = theRow.turnId
    if (theSeen.indexOf(theKey) === -1) {
      theSeen.push(theKey)
    }
  }
  return theSeen.length
}

// Scores are always derived from history so an edited turn recomputes everything.
export function computeStandings(theTeams: Team[], theHistory: TurnResult[]): Standing[] {
  const theRows: Standing[] = []
  for (let n = 0; n < theTeams.length; n++) {
    const theTeam = theTeams[n]
    let thePoints = 0
    let theCorrect = 0
    let theSkipped = 0
    for (let i = 0; i < theHistory.length; i++) {
      const theRow = theHistory[i]
      if (theRow.teamId !== theTeam.id) {
        continue
      }
      thePoints = thePoints + theRow.points
      if (theRow.outcome === 'correct') {
        theCorrect = theCorrect + 1
      }
      if (theRow.outcome === 'skip') {
        theSkipped = theSkipped + 1
      }
    }
    theRows.push({
      rank: 0,
      teamId: theTeam.id,
      name: theTeam.name,
      color: theTeam.color,
      points: thePoints,
      correct: theCorrect,
      skipped: theSkipped,
      turns: countTurns(theTeam.id, theHistory),
    })
  }
  theRows.sort(compareStandings)
  // Competition ranking: teams tied on every tie-break share a rank and the next rank is skipped.
  for (let n = 0; n < theRows.length; n++) {
    if (n > 0 && compareStandings(theRows[n - 1], theRows[n]) === 0) {
      theRows[n].rank = theRows[n - 1].rank
    } else {
      theRows[n].rank = n + 1
    }
  }
  return theRows
}

export function teamPoints(theTeamId: string, theHistory: TurnResult[]): number {
  let thePoints = 0
  for (let n = 0; n < theHistory.length; n++) {
    if (theHistory[n].teamId === theTeamId) {
      thePoints = thePoints + theHistory[n].points
    }
  }
  return thePoints
}
