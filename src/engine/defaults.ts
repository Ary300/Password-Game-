import type { Settings } from './types'
import { WORD_CATEGORIES } from './wordTypes'

export const UNLIMITED_ROUNDS = 0
export const MAX_ROUNDS = 20
export const MIN_TEAMS = 2
export const MAX_TEAMS = 8
export const MIN_TURN_SECONDS = 5
export const MAX_TURN_SECONDS = 120
export const TURN_STEP_SECONDS = 5
export const MIN_POOL_SIZE = 10
export const TIME_BONUS_SECONDS = 5
export const RESULT_BANNER_MS = 2000
export const CORRECT_CARD_MS = 2000
export const COUNTDOWN_MS = 3000
export const AMBER_AT_SECONDS = 10
export const RED_AT_SECONDS = 5
export const MAX_SKIPS = 3
export const MAX_POINTS = 10
export const MAX_HANDOFF_SECONDS = 30
export const UNDO_LIMIT = 20
export const STORE_KEY = 'pt-password-v1'

export function allCategories(): string[] {
  const theList: string[] = []
  for (let n = 0; n < WORD_CATEGORIES.length; n++) {
    theList.push(WORD_CATEGORIES[n])
  }
  return theList
}

export function defaultSettings(): Settings {
  return {
    turnSeconds: 20,
    teamCount: 2,
    roundsPerGame: 5,
    syllables: 'any',
    syllableMin: 1,
    syllableMax: 4,
    lengthMin: 0,
    lengthMax: 0,
    difficulty: 'mixed',
    categories: allCategories(),
    skipsPerTurn: 1,
    pointsPerCorrect: 1,
    timeBonus: false,
    countdown: true,
    sound: true,
    revealOnTimeUp: true,
    multiWord: true,
    autoAdvance: true,
    handoffSeconds: 5,
    customWords: '',
    customWordMode: 'add',
    customBanned: '',
    theme: 'dark',
  }
}
