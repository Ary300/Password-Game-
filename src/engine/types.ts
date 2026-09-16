import type { WordEntry } from './wordTypes'

export type Player = {
  id: string
  name: string
}

export type Team = {
  id: string
  name: string
  color: string
  players: Player[]
  pickedGuesserId: string | null
}

export type TurnOutcome = 'correct' | 'skip' | 'timeup' | 'adjust'

export type TurnResult = {
  id: string
  turnId: string
  round: number
  teamId: string
  guesserId: string | null
  guesser: string
  swappedFrom: string[]
  word: string
  outcome: TurnOutcome
  secondsLeft: number
  elapsedMs: number
  points: number
  at: number
  note: string
}

export type TurnStart = {
  turnId: string
  round: number
  teamId: string
  guesserId: string | null
  at: number
}

export type TurnEnd = {
  outcome: 'correct' | 'timeup' | 'ended'
  at: number
  word: string
}

export type Turn = {
  turnId: string
  teamId: string
  guesserId: string | null
  guesser: string
  swappedFrom: string[]
  word: WordEntry
  wordShownAt: number
  startedAt: number
  pausedAt: number | null
  skipsUsed: number
  swapOpen: boolean
  end: TurnEnd | null
}

export type GamePhase = 'setup' | 'teamup' | 'live' | 'podium'
export type GameMode = 'quick' | 'class'

export type GameState = {
  id: string
  phase: GamePhase
  mode: GameMode
  classId: string | null
  round: number
  currentTeamIndex: number
  usedWords: string[]
  history: TurnResult[]
  turnsLog: TurnStart[]
  turn: Turn | null
  handoffEndsAt: number | null
  handoffHeld: boolean
  poolWarning: string[]
  committed: boolean
  createdAt: number
}

export type CareerStats = {
  correct: number
  turns: number
  skips: number
  bestMs: number | null
}

export type Student = {
  id: string
  name: string
  absent: boolean
  career: CareerStats
}

export type ClassTotals = {
  games: number
  turns: number
  correct: number
}

export type ClassRoom = {
  id: string
  name: string
  students: Student[]
  totals: ClassTotals
  createdAt: number
}

export type SyllableChoice = 'any' | '1' | '2' | '3' | '4+' | 'custom'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed'
export type CustomWordMode = 'add' | 'replace'
export type ThemeChoice = 'dark' | 'light'

export type Settings = {
  turnSeconds: number
  teamCount: number
  roundsPerGame: number
  syllables: SyllableChoice
  syllableMin: number
  syllableMax: number
  lengthMin: number
  lengthMax: number
  difficulty: Difficulty
  categories: string[]
  skipsPerTurn: number
  pointsPerCorrect: number
  timeBonus: boolean
  countdown: boolean
  sound: boolean
  revealOnTimeUp: boolean
  multiWord: boolean
  autoAdvance: boolean
  handoffSeconds: number
  customWords: string
  customWordMode: CustomWordMode
  customBanned: string
  theme: ThemeChoice
}

export type WordFilters = {
  syllables: SyllableChoice
  syllableMin: number
  syllableMax: number
  lengthMin: number
  lengthMax: number
  difficulty: Difficulty
  categories: string[]
}

export type Standing = {
  rank: number
  teamId: string
  name: string
  color: string
  points: number
  correct: number
  skipped: number
  turns: number
}

export type ClassStanding = {
  rank: number
  classId: string
  name: string
  games: number
  turns: number
  correct: number
  average: number
}
