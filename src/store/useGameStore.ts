import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { BUILT_IN_WORDS } from '../data/wordData'
import { commitGameToClass } from '../engine/career'
import {
  COUNTDOWN_MS,
  MAX_HANDOFF_SECONDS,
  MAX_POINTS,
  MAX_ROUNDS,
  MAX_SKIPS,
  MAX_TEAMS,
  MAX_TURN_SECONDS,
  MIN_TEAMS,
  MIN_TURN_SECONDS,
  STORE_KEY,
  UNDO_LIMIT,
  defaultSettings,
} from '../engine/defaults'
import { makeId } from '../engine/ids'
import { buildPool, pickWord } from '../engine/pickWord'
import { absentIds, defaultTeams, makeClass, makeStudent, makeTeam, parseNames, presentStudents, splitIntoTeams } from '../engine/roster'
import { nextTeamIndex, playerName, resolveGuesserId } from '../engine/rotation'
import { pointsForCorrect } from '../engine/scoring'
import { defaultTeamName, teamColorAt } from '../engine/teamColors'
import { remainingMs, resumedStartedAt, secondsLeftFromMs } from '../engine/timer'
import type { ClassRoom, GameState, Player, Settings, Student, Team, Turn, TurnResult, TurnStart } from '../engine/types'
import { combineWordLists } from '../engine/wordList'
import type { WordEntry } from '../engine/wordTypes'
import { clampNumber, filtersFromSettings, freshGame } from './gameState'

export type UndoEntry = {
  label: string
  takenAt: number
  game: GameState
  teams: Team[]
}

export type GameStore = {
  settings: Settings
  teams: Team[]
  game: GameState
  classes: ClassRoom[]
  activeClassId: string | null
  lastTeams: Team[]
  undoStack: UndoEntry[]
  shortcutsOpen: boolean
  settingsOpen: boolean
  clueCheckerOpen: boolean

  updateSettings: (thePatch: Partial<Settings>) => void
  resetSettings: () => void
  setShortcutsOpen: (theOpen: boolean) => void
  setSettingsOpen: (theOpen: boolean) => void
  setClueCheckerOpen: (theOpen: boolean) => void

  setTeamCount: (num: number) => void
  renameTeam: (theTeamId: string, theName: string) => void
  setTeamPlayers: (theTeamId: string, theNamesText: string) => void
  loadLastTeams: () => void
  movePlayer: (thePlayerId: string, theTeamId: string) => void

  addClass: (theName: string, theNamesText: string) => string
  renameClass: (theClassId: string, theName: string) => void
  deleteClass: (theClassId: string) => void
  addStudents: (theClassId: string, theNamesText: string) => void
  removeStudent: (theClassId: string, theStudentId: string) => void
  toggleAbsent: (theClassId: string, theStudentId: string) => void
  setAllPresent: (theClassId: string) => void
  setActiveClass: (theClassId: string | null) => void
  splitClassIntoTeams: (theClassId: string, num: number) => void

  startGame: (theMode: 'quick' | 'class') => void
  quickGame: () => void
  pickGuesser: (theTeamId: string, thePlayerId: string | null) => void
  startTurn: (theNow: number) => void
  markCorrect: (theNow: number) => void
  skipWord: (theNow: number) => void
  togglePause: (theNow: number) => void
  timeUp: (theNow: number) => void
  endTurn: (theNow: number) => void
  nextTeam: (theNow: number) => void
  skipTeam: (theNow: number) => void
  holdHandoff: (theHeld: boolean, theNow: number) => void
  openSwap: (theNow: number) => void
  closeSwap: (theNow: number) => void
  swapGuesser: (thePlayerId: string, theNow: number) => void
  editTeamScore: (theTeamId: string, theNewTotal: number, theCurrentTotal: number) => void
  undo: () => string | null
  endGame: () => void
  playAgain: () => void
  newGame: () => void
}

export function activeWordList(theSettings: Settings): WordEntry[] {
  return combineWordLists(BUILT_IN_WORDS, theSettings.customWords, theSettings.customWordMode)
}

export function findClass(theClasses: ClassRoom[], theClassId: string | null): ClassRoom | null {
  if (theClassId === null) {
    return null
  }
  for (let n = 0; n < theClasses.length; n++) {
    if (theClasses[n].id === theClassId) {
      return theClasses[n]
    }
  }
  return null
}

export function currentTeamOf(theTeams: Team[], theGame: GameState): Team | null {
  if (theTeams.length === 0) {
    return null
  }
  const theIndex = clampNumber(theGame.currentTeamIndex, 0, theTeams.length - 1)
  return theTeams[theIndex]
}

function drawWord(theSettings: Settings, theGame: GameState): { word: WordEntry | null; usedWords: string[]; warning: string[] } {
  const theList = activeWordList(theSettings)
  const theResult = buildPool(theList, filtersFromSettings(theSettings), theGame.usedWords)
  const theWarning: string[] = []
  for (let n = 0; n < theResult.widened.length; n++) {
    theWarning.push(theResult.widened[n])
  }
  let theUsed = theGame.usedWords
  let thePool = theResult.pool
  if (thePool.length === 0) {
    // Every word is used; starting the list over beats a dead game in front of the class.
    theUsed = []
    thePool = buildPool(theList, theResult.filters, []).pool
    theWarning.push('word list restarted')
  }
  const theWord = pickWord(thePool, Math.random)
  if (theWord === null) {
    return { word: null, usedWords: theUsed, warning: theWarning }
  }
  return { word: theWord, usedWords: theUsed.concat([theWord.word]), warning: theWarning }
}

function secondsLeftAt(theTurn: Turn, theNow: number, turnSeconds: number): number {
  return secondsLeftFromMs(remainingMs(theTurn.startedAt, theTurn.pausedAt, theNow, turnSeconds))
}

function clockNow(theTurn: Turn, theNow: number): number {
  if (theTurn.pausedAt !== null) {
    return theTurn.pausedAt
  }
  return theNow
}

function makeResult(theGame: GameState, theTurn: Turn, theOutcome: TurnResult['outcome'], thePoints: number, theNow: number, theSettings: Settings): TurnResult {
  const theClock = clockNow(theTurn, theNow)
  return {
    id: makeId('res'),
    turnId: theTurn.turnId,
    round: theGame.round,
    teamId: theTurn.teamId,
    guesserId: theTurn.guesserId,
    guesser: theTurn.guesser,
    swappedFrom: theTurn.swappedFrom,
    word: theTurn.word.word,
    outcome: theOutcome,
    secondsLeft: secondsLeftAt(theTurn, theNow, theSettings.turnSeconds),
    elapsedMs: Math.max(0, theClock - theTurn.wordShownAt),
    points: thePoints,
    at: theNow,
    note: '',
  }
}

function pushUndo(theStack: UndoEntry[], theLabel: string, theGame: GameState, theTeams: Team[]): UndoEntry[] {
  const theNext = theStack.concat([{ label: theLabel, takenAt: Date.now(), game: theGame, teams: theTeams }])
  if (theNext.length > UNDO_LIMIT) {
    return theNext.slice(theNext.length - UNDO_LIMIT)
  }
  return theNext
}

export function teamsUseClass(theTeams: Team[], theClass: ClassRoom): boolean {
  const theIds: string[] = []
  for (let n = 0; n < theClass.students.length; n++) {
    theIds.push(theClass.students[n].id)
  }
  for (let n = 0; n < theTeams.length; n++) {
    for (let i = 0; i < theTeams[n].players.length; i++) {
      if (theIds.indexOf(theTeams[n].players[i].id) !== -1) {
        return true
      }
    }
  }
  return false
}

function teamsFromCount(theTeams: Team[], num: number): Team[] {
  const theNext: Team[] = []
  for (let n = 0; n < num; n++) {
    if (n < theTeams.length) {
      theNext.push(theTeams[n])
    } else {
      theNext.push(makeTeam(n, defaultTeamName(n), []))
    }
  }
  return theNext
}

function replaceTeam(theTeams: Team[], theTeamId: string, theChange: (theTeam: Team) => Team): Team[] {
  const theNext: Team[] = []
  for (let n = 0; n < theTeams.length; n++) {
    if (theTeams[n].id === theTeamId) {
      theNext.push(theChange(theTeams[n]))
    } else {
      theNext.push(theTeams[n])
    }
  }
  return theNext
}

function replaceClass(theClasses: ClassRoom[], theClassId: string, theChange: (theClass: ClassRoom) => ClassRoom): ClassRoom[] {
  const theNext: ClassRoom[] = []
  for (let n = 0; n < theClasses.length; n++) {
    if (theClasses[n].id === theClassId) {
      theNext.push(theChange(theClasses[n]))
    } else {
      theNext.push(theClasses[n])
    }
  }
  return theNext
}

function sanitizeSettings(theSettings: Settings): Settings {
  const theTurn = Math.round(clampNumber(theSettings.turnSeconds, MIN_TURN_SECONDS, MAX_TURN_SECONDS) / 5) * 5
  let theSyllableMin = clampNumber(theSettings.syllableMin, 1, 8)
  let theSyllableMax = clampNumber(theSettings.syllableMax, 1, 8)
  if (theSyllableMax < theSyllableMin) {
    theSyllableMax = theSyllableMin
  }
  let theLengthMin = clampNumber(theSettings.lengthMin, 0, 20)
  let theLengthMax = clampNumber(theSettings.lengthMax, 0, 20)
  if (theLengthMax > 0 && theLengthMin > theLengthMax) {
    theLengthMin = theLengthMax
  }
  return {
    ...theSettings,
    turnSeconds: theTurn,
    teamCount: clampNumber(theSettings.teamCount, MIN_TEAMS, MAX_TEAMS),
    roundsPerGame: clampNumber(theSettings.roundsPerGame, 0, MAX_ROUNDS),
    syllableMin: theSyllableMin,
    syllableMax: theSyllableMax,
    lengthMin: theLengthMin,
    lengthMax: theLengthMax,
    skipsPerTurn: clampNumber(theSettings.skipsPerTurn, 0, MAX_SKIPS),
    pointsPerCorrect: clampNumber(theSettings.pointsPerCorrect, 1, MAX_POINTS),
    handoffSeconds: clampNumber(theSettings.handoffSeconds, 0, MAX_HANDOFF_SECONDS),
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings(),
      teams: defaultTeams(2),
      game: freshGame('quick', null),
      classes: [],
      activeClassId: null,
      lastTeams: [],
      undoStack: [],
      shortcutsOpen: false,
      settingsOpen: false,
      clueCheckerOpen: false,

      updateSettings: (thePatch) => {
        const theState = get()
        const theNext = sanitizeSettings({ ...theState.settings, ...thePatch })
        if (theState.game.phase === 'setup' && theNext.teamCount !== theState.teams.length) {
          set({ settings: theNext, teams: teamsFromCount(theState.teams, theNext.teamCount) })
          return
        }
        set({ settings: theNext })
      },
      resetSettings: () => {
        const theTheme = get().settings.theme
        set({ settings: { ...defaultSettings(), theme: theTheme } })
      },
      setShortcutsOpen: (theOpen) => set({ shortcutsOpen: theOpen }),
      setSettingsOpen: (theOpen) => set({ settingsOpen: theOpen }),
      setClueCheckerOpen: (theOpen) => set({ clueCheckerOpen: theOpen }),

      setTeamCount: (num) => {
        const theCount = clampNumber(num, MIN_TEAMS, MAX_TEAMS)
        const theState = get()
        set({ teams: teamsFromCount(theState.teams, theCount), settings: { ...theState.settings, teamCount: theCount } })
      },
      renameTeam: (theTeamId, theName) => {
        set({ teams: replaceTeam(get().teams, theTeamId, (theTeam) => ({ ...theTeam, name: theName })) })
      },
      setTeamPlayers: (theTeamId, theNamesText) => {
        const theNames = parseNames(theNamesText)
        const thePlayers: Player[] = []
        for (let n = 0; n < theNames.length; n++) {
          thePlayers.push({ id: makeId('p'), name: theNames[n] })
        }
        set({ teams: replaceTeam(get().teams, theTeamId, (theTeam) => ({ ...theTeam, players: thePlayers, pickedGuesserId: null })) })
      },
      loadLastTeams: () => {
        const theState = get()
        if (theState.lastTeams.length < MIN_TEAMS) {
          return
        }
        set({ teams: theState.lastTeams, settings: { ...theState.settings, teamCount: theState.lastTeams.length } })
      },
      movePlayer: (thePlayerId, theTeamId) => {
        const theTeams = get().teams
        let thePlayer: Player | null = null
        for (let n = 0; n < theTeams.length; n++) {
          for (let i = 0; i < theTeams[n].players.length; i++) {
            if (theTeams[n].players[i].id === thePlayerId) {
              thePlayer = theTeams[n].players[i]
            }
          }
        }
        if (thePlayer === null) {
          return
        }
        const theMoved = thePlayer
        const theNext: Team[] = []
        for (let n = 0; n < theTeams.length; n++) {
          const theKept: Player[] = []
          for (let i = 0; i < theTeams[n].players.length; i++) {
            if (theTeams[n].players[i].id !== thePlayerId) {
              theKept.push(theTeams[n].players[i])
            }
          }
          if (theTeams[n].id === theTeamId) {
            theKept.push(theMoved)
          }
          let thePicked = theTeams[n].pickedGuesserId
          if (thePicked === thePlayerId) {
            thePicked = null
          }
          theNext.push({ ...theTeams[n], players: theKept, pickedGuesserId: thePicked })
        }
        set({ teams: theNext })
      },

      addClass: (theName, theNamesText) => {
        let theLabel = theName.trim()
        if (theLabel.length === 0) {
          theLabel = 'Class ' + String(get().classes.length + 1)
        }
        const theClass = makeClass(theLabel, theNamesText)
        set({ classes: get().classes.concat([theClass]), activeClassId: theClass.id })
        return theClass.id
      },
      renameClass: (theClassId, theName) => {
        set({ classes: replaceClass(get().classes, theClassId, (theClass) => ({ ...theClass, name: theName })) })
      },
      deleteClass: (theClassId) => {
        const theState = get()
        const theKept: ClassRoom[] = []
        for (let n = 0; n < theState.classes.length; n++) {
          if (theState.classes[n].id !== theClassId) {
            theKept.push(theState.classes[n])
          }
        }
        let theActive = theState.activeClassId
        if (theActive === theClassId) {
          theActive = null
        }
        set({ classes: theKept, activeClassId: theActive })
      },
      addStudents: (theClassId, theNamesText) => {
        const theNames = parseNames(theNamesText)
        set({
          classes: replaceClass(get().classes, theClassId, (theClass) => {
            const theExisting: string[] = []
            for (let n = 0; n < theClass.students.length; n++) {
              theExisting.push(theClass.students[n].name.toLowerCase())
            }
            const theStudents = theClass.students.slice()
            for (let n = 0; n < theNames.length; n++) {
              if (theExisting.indexOf(theNames[n].toLowerCase()) === -1) {
                theStudents.push(makeStudent(theNames[n]))
              }
            }
            return { ...theClass, students: theStudents }
          }),
        })
      },
      removeStudent: (theClassId, theStudentId) => {
        set({
          classes: replaceClass(get().classes, theClassId, (theClass) => {
            const theStudents: Student[] = []
            for (let n = 0; n < theClass.students.length; n++) {
              if (theClass.students[n].id !== theStudentId) {
                theStudents.push(theClass.students[n])
              }
            }
            return { ...theClass, students: theStudents }
          }),
        })
      },
      toggleAbsent: (theClassId, theStudentId) => {
        set({
          classes: replaceClass(get().classes, theClassId, (theClass) => {
            const theStudents: Student[] = []
            for (let n = 0; n < theClass.students.length; n++) {
              const theStudent = theClass.students[n]
              if (theStudent.id === theStudentId) {
                theStudents.push({ ...theStudent, absent: !theStudent.absent })
              } else {
                theStudents.push(theStudent)
              }
            }
            return { ...theClass, students: theStudents }
          }),
        })
      },
      setAllPresent: (theClassId) => {
        set({
          classes: replaceClass(get().classes, theClassId, (theClass) => {
            const theStudents: Student[] = []
            for (let n = 0; n < theClass.students.length; n++) {
              theStudents.push({ ...theClass.students[n], absent: false })
            }
            return { ...theClass, students: theStudents }
          }),
        })
      },
      setActiveClass: (theClassId) => set({ activeClassId: theClassId }),
      splitClassIntoTeams: (theClassId, num) => {
        const theState = get()
        const theClass = findClass(theState.classes, theClassId)
        if (theClass === null) {
          return
        }
        const theCount = clampNumber(num, MIN_TEAMS, MAX_TEAMS)
        const theTeams = splitIntoTeams(presentStudents(theClass), theCount, Math.random, theState.teams)
        set({ teams: theTeams, activeClassId: theClassId, settings: { ...theState.settings, teamCount: theCount } })
      },

      startGame: (theMode) => {
        const theState = get()
        let theClassId: string | null = null
        if (theMode === 'class') {
          theClassId = theState.activeClassId
        }
        let theTeams = theState.teams
        if (theTeams.length < MIN_TEAMS) {
          theTeams = defaultTeams(theState.settings.teamCount)
        }
        const theColored: Team[] = []
        for (let n = 0; n < theTeams.length; n++) {
          let theName = theTeams[n].name.trim()
          if (theName.length === 0) {
            theName = defaultTeamName(n)
          }
          theColored.push({ ...theTeams[n], name: theName, color: teamColorAt(n), pickedGuesserId: null })
        }
        const theGame = { ...freshGame(theMode, theClassId), phase: 'teamup' as const }
        set({ teams: theColored, lastTeams: theColored, game: theGame, undoStack: [], settingsOpen: false })
      },
      quickGame: () => {
        const theState = get()
        // Teams on screen are whatever the teacher last edited or played with, so start with those.
        if (theState.teams.length >= MIN_TEAMS) {
          let theMode: 'quick' | 'class' = 'quick'
          const theClass = findClass(theState.classes, theState.activeClassId)
          if (theClass !== null && teamsUseClass(theState.teams, theClass)) {
            theMode = 'class'
          }
          get().startGame(theMode)
          return
        }
        set({ teams: defaultTeams(theState.settings.teamCount) })
        get().startGame('quick')
      },
      pickGuesser: (theTeamId, thePlayerId) => {
        set({ teams: replaceTeam(get().teams, theTeamId, (theTeam) => ({ ...theTeam, pickedGuesserId: thePlayerId })) })
      },
      startTurn: (theNow) => {
        const theState = get()
        const theGame = theState.game
        if (theGame.phase !== 'teamup') {
          return
        }
        const theTeam = currentTeamOf(theState.teams, theGame)
        if (theTeam === null) {
          return
        }
        const theDraw = drawWord(theState.settings, theGame)
        if (theDraw.word === null) {
          // Holding the hand-off stops the driver from retrying every tick while the teacher fixes the filters.
          set({
            game: {
              ...theGame,
              handoffEndsAt: null,
              handoffHeld: true,
              poolWarning: ['no words match these settings, open Settings to loosen them'],
            },
          })
          return
        }
        const theAbsent = absentIds(findClass(theState.classes, theGame.classId))
        const theGuesserId = resolveGuesserId(theTeam, theGame.turnsLog, theAbsent)
        let theStart = theNow
        if (theState.settings.countdown) {
          theStart = theNow + COUNTDOWN_MS
        }
        const theTurnId = makeId('turn')
        const theTurn: Turn = {
          turnId: theTurnId,
          teamId: theTeam.id,
          guesserId: theGuesserId,
          guesser: playerName(theTeam, theGuesserId),
          swappedFrom: [],
          word: theDraw.word,
          wordShownAt: theStart,
          startedAt: theStart,
          pausedAt: null,
          skipsUsed: 0,
          swapOpen: false,
          end: null,
        }
        set({
          game: {
            ...theGame,
            phase: 'live',
            turn: theTurn,
            usedWords: theDraw.usedWords,
            poolWarning: theDraw.warning,
            handoffEndsAt: null,
            handoffHeld: false,
            turnsLog: theGame.turnsLog.concat([
              { turnId: theTurnId, round: theGame.round, teamId: theTeam.id, guesserId: theGuesserId, at: theNow },
            ]),
          },
          teams: replaceTeam(theState.teams, theTeam.id, (theOld) => ({ ...theOld, pickedGuesserId: null })),
          undoStack: [],
        })
      },
      markCorrect: (theNow) => {
        const theState = get()
        const theGame = theState.game
        const theTurn = theGame.turn
        if (theGame.phase !== 'live' || theTurn === null || theTurn.end !== null || theNow < theTurn.startedAt) {
          return
        }
        const theSettings = theState.settings
        const theLeft = secondsLeftAt(theTurn, theNow, theSettings.turnSeconds)
        const thePoints = pointsForCorrect(theSettings.pointsPerCorrect, theSettings.timeBonus, theLeft)
        const theRow = makeResult(theGame, theTurn, 'correct', thePoints, theNow, theSettings)
        const theUndo = pushUndo(theState.undoStack, 'Correct: ' + theTurn.word.word, theGame, theState.teams)
        const theHistory = theGame.history.concat([theRow])
        if (theSettings.multiWord && theLeft > 0) {
          const theDraw = drawWord(theSettings, theGame)
          if (theDraw.word !== null) {
            let theShownAt = theNow
            if (theTurn.pausedAt !== null) {
              theShownAt = theTurn.pausedAt
            }
            set({
              game: {
                ...theGame,
                history: theHistory,
                usedWords: theDraw.usedWords,
                poolWarning: theDraw.warning,
                turn: { ...theTurn, word: theDraw.word, wordShownAt: theShownAt, swapOpen: false },
              },
              undoStack: theUndo,
            })
            return
          }
        }
        set({
          game: { ...theGame, history: theHistory, turn: { ...theTurn, swapOpen: false, pausedAt: null, end: { outcome: 'correct', at: theNow, word: theTurn.word.word } } },
          undoStack: theUndo,
        })
      },
      skipWord: (theNow) => {
        const theState = get()
        const theGame = theState.game
        const theTurn = theGame.turn
        if (theGame.phase !== 'live' || theTurn === null || theTurn.end !== null || theNow < theTurn.startedAt) {
          return
        }
        if (theTurn.skipsUsed >= theState.settings.skipsPerTurn) {
          return
        }
        const theDraw = drawWord(theState.settings, theGame)
        if (theDraw.word === null) {
          return
        }
        const theRow = makeResult(theGame, theTurn, 'skip', 0, theNow, theState.settings)
        let theShownAt = theNow
        if (theTurn.pausedAt !== null) {
          theShownAt = theTurn.pausedAt
        }
        set({
          game: {
            ...theGame,
            history: theGame.history.concat([theRow]),
            usedWords: theDraw.usedWords,
            poolWarning: theDraw.warning,
            turn: { ...theTurn, word: theDraw.word, wordShownAt: theShownAt, skipsUsed: theTurn.skipsUsed + 1, swapOpen: false },
          },
          undoStack: pushUndo(theState.undoStack, 'Skip: ' + theTurn.word.word, theGame, theState.teams),
        })
      },
      togglePause: (theNow) => {
        const theGame = get().game
        const theTurn = theGame.turn
        if (theGame.phase !== 'live' || theTurn === null || theTurn.end !== null) {
          return
        }
        if (theTurn.pausedAt === null) {
          set({ game: { ...theGame, turn: { ...theTurn, pausedAt: theNow } } })
          return
        }
        set({
          game: {
            ...theGame,
            turn: {
              ...theTurn,
              pausedAt: null,
              swapOpen: false,
              startedAt: resumedStartedAt(theTurn.startedAt, theTurn.pausedAt, theNow),
              wordShownAt: resumedStartedAt(theTurn.wordShownAt, theTurn.pausedAt, theNow),
            },
          },
        })
      },
      timeUp: (theNow) => {
        const theState = get()
        const theGame = theState.game
        const theTurn = theGame.turn
        if (theGame.phase !== 'live' || theTurn === null || theTurn.end !== null || theTurn.pausedAt !== null) {
          return
        }
        if (remainingMs(theTurn.startedAt, null, theNow, theState.settings.turnSeconds) > 0) {
          return
        }
        const theRow = makeResult(theGame, theTurn, 'timeup', 0, theNow, theState.settings)
        set({
          game: {
            ...theGame,
            history: theGame.history.concat([theRow]),
            turn: { ...theTurn, swapOpen: false, end: { outcome: 'timeup', at: theNow, word: theTurn.word.word } },
          },
        })
      },
      endTurn: (theNow) => {
        const theState = get()
        const theGame = theState.game
        const theTurn = theGame.turn
        if (theGame.phase !== 'live' || theTurn === null || theTurn.end !== null) {
          return
        }
        const theRow = { ...makeResult(theGame, theTurn, 'timeup', 0, theNow, theState.settings), note: 'Ended early' }
        set({
          game: {
            ...theGame,
            history: theGame.history.concat([theRow]),
            turn: { ...theTurn, swapOpen: false, pausedAt: null, end: { outcome: 'ended', at: theNow, word: theTurn.word.word } },
          },
          undoStack: pushUndo(theState.undoStack, 'End turn', theGame, theState.teams),
        })
      },
      nextTeam: (theNow) => {
        const theState = get()
        const theGame = theState.game
        if (theGame.phase !== 'live' && theGame.phase !== 'teamup') {
          return
        }
        if (theGame.phase === 'live' && (theGame.turn === null || theGame.turn.end === null)) {
          return
        }
        const theNext = nextTeamIndex(theGame.currentTeamIndex, theState.teams.length)
        let theRound = theGame.round
        if (theNext.wrapped) {
          theRound = theRound + 1
        }
        const theRounds = theState.settings.roundsPerGame
        if (theRounds > 0 && theRound > theRounds) {
          set({ game: { ...theGame, turn: null, round: theRounds } })
          get().endGame()
          return
        }
        let theHandoff: number | null = null
        if (theState.settings.autoAdvance) {
          theHandoff = theNow + theState.settings.handoffSeconds * 1000
        }
        set({
          game: {
            ...theGame,
            phase: 'teamup',
            turn: null,
            round: theRound,
            currentTeamIndex: theNext.index,
            handoffEndsAt: theHandoff,
            handoffHeld: false,
          },
        })
      },
      skipTeam: (theNow) => {
        const theState = get()
        if (theState.game.phase !== 'teamup') {
          return
        }
        const theUndo = pushUndo(theState.undoStack, 'Skip team', theState.game, theState.teams)
        get().nextTeam(theNow)
        // Ending the game clears undo on purpose; restoring it here would let Undo reopen a finished game.
        if (get().game.phase !== 'podium') {
          set({ undoStack: theUndo })
        }
      },
      holdHandoff: (theHeld, theNow) => {
        const theState = get()
        const theGame = theState.game
        if (theGame.phase !== 'teamup') {
          return
        }
        if (theHeld) {
          set({ game: { ...theGame, handoffHeld: true, handoffEndsAt: null } })
          return
        }
        set({ game: { ...theGame, handoffHeld: false, handoffEndsAt: theNow + theState.settings.handoffSeconds * 1000 } })
      },
      openSwap: (theNow) => {
        const theGame = get().game
        const theTurn = theGame.turn
        if (theGame.phase !== 'live' || theTurn === null || theTurn.end !== null) {
          return
        }
        let thePausedAt = theTurn.pausedAt
        if (thePausedAt === null) {
          thePausedAt = Math.max(theNow, theTurn.startedAt)
        }
        set({ game: { ...theGame, turn: { ...theTurn, pausedAt: thePausedAt, swapOpen: true } } })
      },
      closeSwap: (theNow) => {
        const theGame = get().game
        const theTurn = theGame.turn
        if (theTurn === null || !theTurn.swapOpen) {
          return
        }
        set({ game: { ...theGame, turn: { ...theTurn, swapOpen: false } } })
        get().togglePause(theNow)
      },
      swapGuesser: (thePlayerId, theNow) => {
        const theState = get()
        const theGame = theState.game
        const theTurn = theGame.turn
        if (theGame.phase !== 'live' || theTurn === null || theTurn.end !== null) {
          return
        }
        const theTeam = currentTeamOf(theState.teams, theGame)
        if (theTeam === null) {
          return
        }
        const theName = playerName(theTeam, thePlayerId)
        if (theName.length === 0 || thePlayerId === theTurn.guesserId) {
          get().closeSwap(theNow)
          return
        }
        let theSwapped = theTurn.swappedFrom
        if (theTurn.guesser.length > 0) {
          theSwapped = theSwapped.concat([theTurn.guesser])
        }
        // Both players keep credit for guessing this turn, so rotation stays fair to the one swapped out.
        let theAlreadyLogged = false
        for (let n = 0; n < theGame.turnsLog.length; n++) {
          const theEntry = theGame.turnsLog[n]
          if (theEntry.turnId === theTurn.turnId && theEntry.guesserId === thePlayerId) {
            theAlreadyLogged = true
          }
        }
        let theLog: TurnStart[] = theGame.turnsLog
        if (!theAlreadyLogged) {
          theLog = theGame.turnsLog.concat([
            { turnId: theTurn.turnId, round: theGame.round, teamId: theTurn.teamId, guesserId: thePlayerId, at: theNow },
          ])
        }
        set({
          game: {
            ...theGame,
            turnsLog: theLog,
            turn: { ...theTurn, guesserId: thePlayerId, guesser: theName, swappedFrom: theSwapped },
          },
        })
        get().closeSwap(theNow)
      },
      editTeamScore: (theTeamId, theNewTotal, theCurrentTotal) => {
        const theState = get()
        const theGame = theState.game
        const theDelta = Math.round(theNewTotal) - theCurrentTotal
        if (theDelta === 0 || Number.isNaN(theDelta)) {
          return
        }
        let theSign = ''
        if (theDelta > 0) {
          theSign = '+'
        }
        const theRow: TurnResult = {
          id: makeId('res'),
          turnId: 'adjust-' + makeId('a'),
          round: theGame.round,
          teamId: theTeamId,
          guesserId: null,
          guesser: '',
          swappedFrom: [],
          word: '',
          outcome: 'adjust',
          secondsLeft: 0,
          elapsedMs: 0,
          points: theDelta,
          at: Date.now(),
          note: 'Score edited ' + theSign + String(theDelta) + ' (' + String(theCurrentTotal) + ' to ' + String(Math.round(theNewTotal)) + ')',
        }
        set({
          game: { ...theGame, history: theGame.history.concat([theRow]) },
          undoStack: pushUndo(theState.undoStack, 'Score edit', theGame, theState.teams),
        })
      },
      undo: () => {
        const theState = get()
        const theStack = theState.undoStack
        if (theStack.length === 0) {
          return null
        }
        const theEntry = theStack[theStack.length - 1]
        let theGame = theEntry.game
        // Undo lands on the paused moment before the mistake so the teacher decides when the clock runs again.
        if (theGame.turn !== null && theGame.turn.end === null && theGame.turn.pausedAt === null) {
          theGame = { ...theGame, turn: { ...theGame.turn, pausedAt: Math.max(theEntry.takenAt, theGame.turn.startedAt) } }
        }
        theGame = { ...theGame, handoffEndsAt: null, handoffHeld: theGame.phase === 'teamup' }
        set({ game: theGame, teams: theEntry.teams, undoStack: theStack.slice(0, theStack.length - 1) })
        return theEntry.label
      },
      endGame: () => {
        const theState = get()
        const theGame = theState.game
        let theClasses = theState.classes
        if (!theGame.committed && theGame.classId !== null) {
          const theClassId = theGame.classId
          theClasses = replaceClass(theClasses, theClassId, (theClass) => commitGameToClass(theClass, theGame))
        }
        set({
          classes: theClasses,
          game: { ...theGame, phase: 'podium', turn: null, handoffEndsAt: null, committed: true },
          undoStack: [],
        })
      },
      playAgain: () => {
        const theState = get()
        let theMode = theState.game.mode
        if (theMode === 'class' && findClass(theState.classes, theState.game.classId) === null) {
          theMode = 'quick'
        }
        if (!theState.game.committed && theState.game.phase !== 'setup') {
          get().endGame()
        }
        get().startGame(theMode)
      },
      newGame: () => {
        const theState = get()
        if (!theState.game.committed && theState.game.turnsLog.length > 0) {
          get().endGame()
        }
        set({ game: freshGame('quick', null), undoStack: [] })
      },
    }),
    {
      name: STORE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (theState) => ({
        settings: theState.settings,
        teams: theState.teams,
        game: theState.game,
        classes: theState.classes,
        activeClassId: theState.activeClassId,
        lastTeams: theState.lastTeams,
      }),
      merge: (thePersisted, theCurrent) => {
        const theSaved = thePersisted as Partial<GameStore> | undefined
        if (theSaved === undefined || theSaved === null) {
          return theCurrent
        }
        return {
          ...theCurrent,
          ...theSaved,
          settings: sanitizeSettings({ ...defaultSettings(), ...(theSaved.settings ?? {}) }),
        }
      },
    },
  ),
)
