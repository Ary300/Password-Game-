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

export type EditableOutcome = 'correct' | 'skip' | 'timeup'

const CHANGED_FROM = 'Changed from '

export function outcomeLabel(theOutcome: TurnResult['outcome']): string {
  if (theOutcome === 'correct') {
    return 'Correct'
  }
  if (theOutcome === 'skip') {
    return 'Skip'
  }
  if (theOutcome === 'timeup') {
    return 'Time up'
  }
  return 'Score edit'
}

// Keeps the row's own note ("Ended early") and replaces any earlier change note, so flipping a row back and forth stays readable.
function baseNote(theNote: string): string {
  const theIndex = theNote.indexOf(CHANGED_FROM)
  if (theIndex === -1) {
    return theNote
  }
  return theNote.slice(0, theIndex).replace(/[.,\s]+$/, '')
}

// A teacher's correction re-prices the row with today's settings and the seconds that were left when it happened.
export function reviseRow(theRow: TurnResult, theOutcome: EditableOutcome, pointsPerCorrect: number, theTimeBonus: boolean): TurnResult {
  if (theRow.outcome === 'adjust' || theRow.outcome === theOutcome) {
    return theRow
  }
  let thePoints = 0
  if (theOutcome === 'correct') {
    thePoints = pointsForCorrect(pointsPerCorrect, theTimeBonus, theRow.secondsLeft)
  }
  const theBase = baseNote(theRow.note)
  let theOriginal = outcomeLabel(theRow.outcome)
  const theIndex = theRow.note.indexOf(CHANGED_FROM)
  if (theIndex !== -1) {
    theOriginal = theRow.note.slice(theIndex + CHANGED_FROM.length)
  }
  let theNote = CHANGED_FROM + theOriginal
  if (theOriginal === outcomeLabel(theOutcome)) {
    theNote = theBase
  } else if (theBase.length > 0) {
    theNote = theBase + '. ' + CHANGED_FROM + theOriginal
  }
  return { ...theRow, outcome: theOutcome, points: thePoints, note: theNote }
}
