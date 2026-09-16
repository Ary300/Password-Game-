import type { ClassRoom, ClassTotals, GameState, Student, Team } from './types'

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

// A game already saved to the class is corrected by taking its old numbers back out and adding the edited ones.
export function reviseCommittedGame(theClass: ClassRoom, theOldGame: GameState, theNewGame: GameState): ClassRoom {
  const theStudents: Student[] = []
  for (let n = 0; n < theClass.students.length; n++) {
    const theStudent = theClass.students[n]
    const theOld = gameCareerFor(theStudent.id, theOldGame)
    const theNew = gameCareerFor(theStudent.id, theNewGame)
    // An old best time cannot be taken back out, so an edit only ever keeps or improves it.
    theStudents.push({
      ...theStudent,
      career: {
        correct: Math.max(0, theStudent.career.correct - theOld.correct + theNew.correct),
        turns: Math.max(0, theStudent.career.turns - theOld.turns + theNew.turns),
        skips: Math.max(0, theStudent.career.skips - theOld.skips + theNew.skips),
        bestMs: betterMs(theStudent.career.bestMs, theNew.bestMs),
      },
    })
  }
  const theOldTotals = gameTotals(theOldGame)
  const theNewTotals = gameTotals(theNewGame)
  return {
    ...theClass,
    students: theStudents,
    totals: {
      games: Math.max(0, theClass.totals.games - theOldTotals.games + theNewTotals.games),
      turns: Math.max(0, theClass.totals.turns - theOldTotals.turns + theNewTotals.turns),
      correct: Math.max(0, theClass.totals.correct - theOldTotals.correct + theNewTotals.correct),
    },
  }
}

export type PlayerStat = {
  playerId: string
  name: string
  teamId: string
  teamName: string
  teamColor: string
  turns: number
  correct: number
  skips: number
  bestMs: number | null
}

// Best times show to a tenth of a second, so players who look level on screen are level in the order too.
function bestTenths(theStat: PlayerStat): number {
  if (theStat.bestMs === null) {
    return Number.MAX_SAFE_INTEGER
  }
  return Math.round(theStat.bestMs / 100)
}

export function comparePlayerPlace(theA: PlayerStat, theB: PlayerStat): number {
  if (theA.correct !== theB.correct) {
    return theB.correct - theA.correct
  }
  return bestTenths(theA) - bestTenths(theB)
}

function comparePlayerStats(theA: PlayerStat, theB: PlayerStat): number {
  const thePlace = comparePlayerPlace(theA, theB)
  if (thePlace !== 0) {
    return thePlace
  }
  return theA.name.localeCompare(theB.name)
}

// Every rostered player shows up, including ones who have not guessed yet, so the teacher can see who is still waiting.
export function playerStatsFor(theTeams: Team[], theGame: GameState): PlayerStat[] {
  const theRows: PlayerStat[] = []
  for (let n = 0; n < theTeams.length; n++) {
    const theTeam = theTeams[n]
    for (let i = 0; i < theTeam.players.length; i++) {
      const thePlayer = theTeam.players[i]
      const theStats = gameCareerFor(thePlayer.id, theGame)
      theRows.push({
        playerId: thePlayer.id,
        name: thePlayer.name,
        teamId: theTeam.id,
        teamName: theTeam.name,
        teamColor: theTeam.color,
        turns: theStats.turns,
        correct: theStats.correct,
        skips: theStats.skips,
        bestMs: theStats.bestMs,
      })
    }
  }
  theRows.sort(comparePlayerStats)
  return theRows
}
