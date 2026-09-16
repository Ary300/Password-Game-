import type { ClassRoom, ClassTotals, GameState, Student } from './types'

export type GameCareer = {
  correct: number
  turns: number
  skips: number
  bestMs: number | null
}

export function gameCareerFor(theStudentId: string, theGame: GameState): GameCareer {
  const theStats: GameCareer = { correct: 0, turns: 0, skips: 0, bestMs: null }
  for (let n = 0; n < theGame.turnsLog.length; n++) {
    if (theGame.turnsLog[n].guesserId === theStudentId) {
      theStats.turns = theStats.turns + 1
    }
  }
  for (let n = 0; n < theGame.history.length; n++) {
    const theRow = theGame.history[n]
    if (theRow.guesserId !== theStudentId) {
      continue
    }
    if (theRow.outcome === 'correct') {
      theStats.correct = theStats.correct + 1
      if (theStats.bestMs === null || theRow.elapsedMs < theStats.bestMs) {
        theStats.bestMs = theRow.elapsedMs
      }
    }
    if (theRow.outcome === 'skip') {
      theStats.skips = theStats.skips + 1
    }
  }
  return theStats
}

function betterMs(theA: number | null, theB: number | null): number | null {
  if (theA === null) {
    return theB
  }
  if (theB === null) {
    return theA
  }
  return Math.min(theA, theB)
}

// Career numbers shown mid-game add the uncommitted game on top so the card is right before the game is saved.
export function liveCareer(theStudent: Student, theGame: GameState): GameCareer {
  if (theGame.committed || theGame.classId === null) {
    return theStudent.career
  }
  const theGameStats = gameCareerFor(theStudent.id, theGame)
  return {
    correct: theStudent.career.correct + theGameStats.correct,
    turns: theStudent.career.turns + theGameStats.turns,
    skips: theStudent.career.skips + theGameStats.skips,
    bestMs: betterMs(theStudent.career.bestMs, theGameStats.bestMs),
  }
}

export function gameTotals(theGame: GameState): ClassTotals {
  let theCorrect = 0
  for (let n = 0; n < theGame.history.length; n++) {
    if (theGame.history[n].outcome === 'correct') {
      theCorrect = theCorrect + 1
    }
  }
  // A swap adds a second log entry for the same turn, so count distinct turns.
  const theTurnIds: string[] = []
  for (let n = 0; n < theGame.turnsLog.length; n++) {
    if (theTurnIds.indexOf(theGame.turnsLog[n].turnId) === -1) {
      theTurnIds.push(theGame.turnsLog[n].turnId)
    }
  }
  let theGames = 0
  if (theTurnIds.length > 0) {
    theGames = 1
  }
  return { games: theGames, turns: theTurnIds.length, correct: theCorrect }
}

export function commitGameToClass(theClass: ClassRoom, theGame: GameState): ClassRoom {
  const theStudents: Student[] = []
  for (let n = 0; n < theClass.students.length; n++) {
    const theStudent = theClass.students[n]
    const theNext = liveCareer(theStudent, theGame)
    theStudents.push({ ...theStudent, career: theNext })
  }
  const theGameTotals = gameTotals(theGame)
  return {
    ...theClass,
    students: theStudents,
    totals: {
      games: theClass.totals.games + theGameTotals.games,
      turns: theClass.totals.turns + theGameTotals.turns,
      correct: theClass.totals.correct + theGameTotals.correct,
    },
  }
}
