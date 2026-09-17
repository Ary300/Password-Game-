import { WORD_CATEGORIES } from '../../engine/wordTypes'
import type { ClassRoom, Settings, Student, Team } from '../../engine/types'

// Teams count as class teams only when every player is a student of that class, so a hand-typed roster never gets class stats.
export function teamsComeFromClass(theTeams: Team[], theClass: ClassRoom | null): boolean {
  if (theClass === null) {
    return false
  }
  let theCount = 0
  for (let n = 0; n < theTeams.length; n++) {
    for (let i = 0; i < theTeams[n].players.length; i++) {
      if (findStudent(theClass, theTeams[n].players[i].id) === null) {
        return false
      }
      theCount = theCount + 1
    }
  }
  return theCount > 0
}

export function findStudent(theClass: ClassRoom, theStudentId: string): Student | null {
  for (let n = 0; n < theClass.students.length; n++) {
    if (theClass.students[n].id === theStudentId) {
      return theClass.students[n]
    }
  }
  return null
}

export function countPresent(theClass: ClassRoom): number {
  let theCount = 0
  for (let n = 0; n < theClass.students.length; n++) {
    if (!theClass.students[n].absent) {
      theCount = theCount + 1
    }
  }
  return theCount
}

export function playersText(theTeam: Team): string {
  const theNames: string[] = []
  for (let n = 0; n < theTeam.players.length; n++) {
    theNames.push(theTeam.players[n].name)
  }
  return theNames.join('\n')
}

export function teamNamesSentence(theTeams: Team[]): string {
  const theNames: string[] = []
  for (let n = 0; n < theTeams.length; n++) {
    theNames.push(theTeams[n].name)
  }
  if (theNames.length <= 2) {
    return theNames.join(' and ')
  }
  return theNames.slice(0, theNames.length - 1).join(', ') + ' and ' + theNames[theNames.length - 1]
}

export function roundsLabel(theSettings: Settings): string {
  if (theSettings.roundsPerGame === 0) {
    return 'No limit'
  }
  return String(theSettings.roundsPerGame)
}

function syllableLabel(theSettings: Settings): string {
  if (theSettings.syllables === 'any') {
    return 'Any syllables'
  }
  if (theSettings.syllables === 'custom') {
    return String(theSettings.syllableMin) + ' to ' + String(theSettings.syllableMax) + ' syllables'
  }
  if (theSettings.syllables === '1') {
    return '1 syllable'
  }
  return theSettings.syllables + ' syllables'
}

function difficultyLabel(theSettings: Settings): string {
  if (theSettings.difficulty === 'mixed') {
    return 'All difficulties'
  }
  return theSettings.difficulty.charAt(0).toUpperCase() + theSettings.difficulty.slice(1) + ' words'
}

function categoryLabel(theSettings: Settings): string {
  if (theSettings.categories.length >= WORD_CATEGORIES.length) {
    return 'All categories'
  }
  if (theSettings.categories.length === 1) {
    return theSettings.categories[0].charAt(0).toUpperCase() + theSettings.categories[0].slice(1) + ' only'
  }
  return String(theSettings.categories.length) + ' of ' + String(WORD_CATEGORIES.length) + ' categories'
}

export function wordFilterLabels(theSettings: Settings): string[] {
  const theLabels = [difficultyLabel(theSettings), syllableLabel(theSettings), categoryLabel(theSettings)]
  if (theSettings.lengthMin > 0 || theSettings.lengthMax > 0) {
    let theMax = 'any'
    if (theSettings.lengthMax > 0) {
      theMax = String(theSettings.lengthMax)
    }
    theLabels.push(String(theSettings.lengthMin) + ' to ' + theMax + ' letters')
  }
  if (theSettings.customWords.trim().length > 0) {
    if (theSettings.customWordMode === 'replace') {
      theLabels.push('Your words only')
    } else {
      theLabels.push('Plus your words')
    }
  }
  return theLabels
}
