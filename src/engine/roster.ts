import { makeId } from './ids'
import { defaultTeamName, teamColorAt } from './teamColors'
import type { ClassRoom, Player, Student, Team } from './types'

export function makeTeam(num: number, theName: string, thePlayers: Player[]): Team {
  return {
    id: makeId('team'),
    name: theName,
    color: teamColorAt(num),
    players: thePlayers,
    pickedGuesserId: null,
  }
}

export function defaultTeams(num: number): Team[] {
  const theTeams: Team[] = []
  for (let n = 0; n < num; n++) {
    theTeams.push(makeTeam(n, defaultTeamName(n), []))
  }
  return theTeams
}

// Accepts one name per line or comma separated, and drops duplicates so a double paste does not double a student.
export function parseNames(theText: string): string[] {
  const theParts = theText.split(/[\n,;\t]/)
  const theNames: string[] = []
  const theSeen: string[] = []
  for (let n = 0; n < theParts.length; n++) {
    const theName = theParts[n].replace(/\s+/g, ' ').trim()
    if (theName.length === 0) {
      continue
    }
    const theKey = theName.toLowerCase()
    if (theSeen.indexOf(theKey) !== -1) {
      continue
    }
    theSeen.push(theKey)
    theNames.push(theName)
  }
  return theNames
}

export function makeStudent(theName: string): Student {
  return {
    id: makeId('stu'),
    name: theName,
    absent: false,
    career: { correct: 0, turns: 0, skips: 0, bestMs: null },
  }
}

export function makeClass(theName: string, theNamesText: string): ClassRoom {
  const theNames = parseNames(theNamesText)
  const theStudents: Student[] = []
  for (let n = 0; n < theNames.length; n++) {
    theStudents.push(makeStudent(theNames[n]))
  }
  return {
    id: makeId('class'),
    name: theName.trim(),
    students: theStudents,
    totals: { games: 0, turns: 0, correct: 0 },
    createdAt: Date.now(),
  }
}

export function presentStudents(theClass: ClassRoom): Student[] {
  const theList: Student[] = []
  for (let n = 0; n < theClass.students.length; n++) {
    if (!theClass.students[n].absent) {
      theList.push(theClass.students[n])
    }
  }
  return theList
}

export function absentIds(theClass: ClassRoom | null): string[] {
  const theIds: string[] = []
  if (theClass === null) {
    return theIds
  }
  for (let n = 0; n < theClass.students.length; n++) {
    if (theClass.students[n].absent) {
      theIds.push(theClass.students[n].id)
    }
  }
  return theIds
}

// Shuffles then deals like cards so team sizes never differ by more than one.
export function splitIntoTeams(theStudents: Student[], num: number, theRandom: () => number, theExisting: Team[]): Team[] {
  const theShuffled: Student[] = []
  for (let n = 0; n < theStudents.length; n++) {
    theShuffled.push(theStudents[n])
  }
  for (let n = theShuffled.length - 1; n > 0; n--) {
    const theSwap = Math.floor(theRandom() * (n + 1))
    const theTemp = theShuffled[n]
    theShuffled[n] = theShuffled[theSwap]
    theShuffled[theSwap] = theTemp
  }
  const theTeams: Team[] = []
  for (let n = 0; n < num; n++) {
    let theName = defaultTeamName(n)
    if (n < theExisting.length) {
      theName = theExisting[n].name
    }
    theTeams.push(makeTeam(n, theName, []))
  }
  for (let n = 0; n < theShuffled.length; n++) {
    const theTeam = theTeams[n % num]
    theTeam.players = theTeam.players.concat([{ id: theShuffled[n].id, name: theShuffled[n].name }])
  }
  return theTeams
}
