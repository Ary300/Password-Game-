import { makeId } from '../engine/ids'
import type { GameMode, GameState, Settings, WordFilters } from '../engine/types'

export function freshGame(theMode: GameMode, theClassId: string | null): GameState {
  return {
    id: makeId('game'),
    phase: 'setup',
    mode: theMode,
    classId: theClassId,
    round: 1,
    currentTeamIndex: 0,
    usedWords: [],
    history: [],
    turnsLog: [],
    turn: null,
    handoffEndsAt: null,
    handoffHeld: false,
    poolWarning: [],
    committed: false,
    createdAt: Date.now(),
  }
}

export function filtersFromSettings(theSettings: Settings): WordFilters {
  return {
    syllables: theSettings.syllables,
    syllableMin: theSettings.syllableMin,
    syllableMax: theSettings.syllableMax,
    lengthMin: theSettings.lengthMin,
    lengthMax: theSettings.lengthMax,
    difficulty: theSettings.difficulty,
    categories: theSettings.categories,
  }
}

export function clampNumber(num: number, num1: number, num2: number): number {
  if (Number.isNaN(num)) {
    return num1
  }
  return Math.min(num2, Math.max(num1, num))
}
