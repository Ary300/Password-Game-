import { expect, type Locator, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { STORE_KEY } from './helpers'

// Mirrors src/engine/types.ts closely enough to seed the persisted zustand store.
export type SeedPlayer = { id: string; name: string }
export type SeedTeam = { id: string; name: string; color: string; players: SeedPlayer[]; pickedGuesserId: string | null }
export type SeedOutcome = 'correct' | 'skip' | 'timeup' | 'adjust'
export type SeedRow = {
  id: string
  turnId: string
  round: number
  teamId: string
  guesserId: string | null
  guesser: string
  swappedFrom: string[]
  word: string
  outcome: SeedOutcome
  secondsLeft: number
  elapsedMs: number
  points: number
  at: number
  note: string
}
export type SeedTurnStart = { turnId: string; round: number; teamId: string; guesserId: string | null; at: number }
export type SeedStudent = { id: string; name: string; absent: boolean; career: { correct: number; turns: number; skips: number; bestMs: number | null } }
export type SeedClass = { id: string; name: string; students: SeedStudent[]; totals: { games: number; turns: number; correct: number }; createdAt: number }
export type SeedGame = {
  id: string
  phase: 'setup' | 'teamup' | 'live' | 'podium'
  mode: 'quick' | 'class'
  classId: string | null
  round: number
  currentTeamIndex: number
  usedWords: string[]
  history: SeedRow[]
  turnsLog: SeedTurnStart[]
  turn: unknown
  handoffEndsAt: number | null
  handoffHeld: boolean
  poolWarning: string[]
  committed: boolean
  createdAt: number
}
export type SeedState = {
  settings?: Record<string, unknown>
  teams: SeedTeam[]
  game: SeedGame
  classes?: SeedClass[]
  activeClassId?: string | null
  lastTeams?: SeedTeam[]
}

export const TEAM_COLORS = ['#4cc9f0', '#a3e635', '#b388ff', '#ff7eb6', '#2dd4bf', '#7c9cff', '#e9d8a6', '#ff9f5a']

// Fast, quiet defaults for driving real games through the UI.
export const FAST_SETTINGS = {
  countdown: false,
  sound: false,
  autoAdvance: false,
  multiWord: false,
  handoffSeconds: 0,
}

let theCounter = 0
function nextId(thePrefix: string): string {
  theCounter = theCounter + 1
  return thePrefix + '-' + String(theCounter)
}

export function team(theIndex: number, theName: string, thePlayers: string[] = []): SeedTeam {
  const theId = 'team-' + String(theIndex)
  const theList: SeedPlayer[] = []
  for (let n = 0; n < thePlayers.length; n++) {
    theList.push({ id: theId + '-p' + String(n), name: thePlayers[n] })
  }
  return { id: theId, name: theName, color: TEAM_COLORS[theIndex % TEAM_COLORS.length], players: theList, pickedGuesserId: null }
}

export function teamFromStudents(theIndex: number, theName: string, theStudents: SeedStudent[]): SeedTeam {
  const theList: SeedPlayer[] = []
  for (let n = 0; n < theStudents.length; n++) {
    theList.push({ id: theStudents[n].id, name: theStudents[n].name })
  }
  return { id: 'team-' + String(theIndex), name: theName, color: TEAM_COLORS[theIndex % TEAM_COLORS.length], players: theList, pickedGuesserId: null }
}

type RowInput = {
  teamId: string
  outcome: SeedOutcome
  points?: number
  round?: number
  turnId?: string
  word?: string
  guesserId?: string | null
  guesser?: string
  secondsLeft?: number
  elapsedMs?: number
  note?: string
  swappedFrom?: string[]
}

export function row(theInput: RowInput): SeedRow {
  let thePoints = 0
  if (theInput.points !== undefined) {
    thePoints = theInput.points
  } else if (theInput.outcome === 'correct') {
    thePoints = 1
  }
  return {
    id: nextId('res'),
    turnId: theInput.turnId ?? nextId('turn'),
    round: theInput.round ?? 1,
    teamId: theInput.teamId,
    guesserId: theInput.guesserId ?? null,
    guesser: theInput.guesser ?? '',
    swappedFrom: theInput.swappedFrom ?? [],
    word: theInput.word ?? (theInput.outcome === 'adjust' ? '' : nextId('word')),
    outcome: theInput.outcome,
    secondsLeft: theInput.secondsLeft ?? 10,
    elapsedMs: theInput.elapsedMs ?? 4000,
    points: thePoints,
    at: Date.now(),
    note: theInput.note ?? '',
  }
}

// One turnsLog entry per distinct non-adjust turnId in history, so turn counts line up with the rows.
export function turnsLogFor(theHistory: SeedRow[]): SeedTurnStart[] {
  const theLog: SeedTurnStart[] = []
  const theSeen: string[] = []
  for (let n = 0; n < theHistory.length; n++) {
    const theRow = theHistory[n]
    if (theRow.outcome === 'adjust' || theSeen.indexOf(theRow.turnId) !== -1) {
      continue
    }
    theSeen.push(theRow.turnId)
    theLog.push({ turnId: theRow.turnId, round: theRow.round, teamId: theRow.teamId, guesserId: theRow.guesserId, at: theRow.at })
  }
  return theLog
}

export function game(theInput: Partial<SeedGame> & { history: SeedRow[] }): SeedGame {
  return {
    id: nextId('game'),
    phase: 'podium',
    mode: 'quick',
    classId: null,
    round: 1,
    currentTeamIndex: 0,
    usedWords: [],
    turnsLog: turnsLogFor(theInput.history),
    turn: null,
    handoffEndsAt: null,
    handoffHeld: false,
    poolWarning: [],
    committed: false,
    createdAt: Date.now(),
    ...theInput,
  }
}

export function student(theId: string, theName: string, theCareer: Partial<SeedStudent['career']> = {}): SeedStudent {
  return { id: theId, name: theName, absent: false, career: { correct: 0, turns: 0, skips: 0, bestMs: null, ...theCareer } }
}

export function classRoom(theId: string, theName: string, theStudents: SeedStudent[], theTotals = { games: 0, turns: 0, correct: 0 }): SeedClass {
  return { id: theId, name: theName, students: theStudents, totals: theTotals, createdAt: Date.now() }
}

// Writes the whole persisted store once per tab, before the app boots, so reloads keep what the app saved.
export async function seedStore(thePage: Page, theState: SeedState): Promise<void> {
  const theFull = {
    state: {
      settings: { ...FAST_SETTINGS, ...(theState.settings ?? {}) },
      teams: theState.teams,
      game: theState.game,
      classes: theState.classes ?? [],
      activeClassId: theState.activeClassId ?? null,
      lastTeams: theState.lastTeams ?? theState.teams,
    },
    version: 1,
  }
  await thePage.addInitScript(
    ([theKey, theJson]) => {
      if (sessionStorage.getItem('board-seeded') === '1') {
        return
      }
      sessionStorage.setItem('board-seeded', '1')
      localStorage.setItem(theKey, theJson)
    },
    [STORE_KEY, JSON.stringify(theFull)] as const,
  )
}

export type FullStore = {
  state: {
    settings: Record<string, unknown>
    teams: SeedTeam[]
    game: SeedGame
    classes: SeedClass[]
    activeClassId: string | null
    lastTeams: SeedTeam[]
  }
  version: number
}

export async function readFull(thePage: Page): Promise<FullStore> {
  const theRaw = await thePage.evaluate((theKey) => localStorage.getItem(theKey), STORE_KEY)
  if (theRaw === null) {
    throw new Error('Store not written yet')
  }
  return JSON.parse(theRaw) as FullStore
}

export function standingRows(thePage: Page): Locator {
  return thePage.getByRole('list', { name: 'Team standings' }).locator(':scope > li')
}

// Returns rank, name, points, correct, skipped, turns for each rendered standings row.
export async function readStandingRows(thePage: Page): Promise<string[][]> {
  const theRows = standingRows(thePage)
  const theCount = await theRows.count()
  const theOut: string[][] = []
  for (let n = 0; n < theCount; n++) {
    const theRow = theRows.nth(n)
    const theCells = theRow.locator(':scope > *')
    const theRank = (await theCells.nth(0).locator('span').first().innerText()).trim()
    const theName = (await theCells.nth(1).locator('span').first().innerText()).trim()
    const thePoints = (await theCells.nth(2).innerText()).trim()
    const theCorrect = (await theCells.nth(3).innerText()).trim()
    const theSkipped = (await theCells.nth(4).innerText()).trim()
    const theTurns = (await theCells.nth(5).innerText()).trim()
    theOut.push([theRank, theName, thePoints, theCorrect, theSkipped, theTurns])
  }
  return theOut
}

export async function openLeaderboardTab(thePage: Page, theName: string): Promise<void> {
  await thePage.getByRole('tab', { name: theName }).click()
  await expect(thePage.getByRole('tab', { name: theName })).toHaveAttribute('data-state', 'active')
}

export async function downloadText(thePage: Page, theClick: () => Promise<void>): Promise<{ name: string; text: string }> {
  const theWait = thePage.waitForEvent('download')
  await theClick()
  const theDownload = await theWait
  const thePath = await theDownload.path()
  const theText = await readFile(thePath, 'utf8')
  return { name: theDownload.suggestedFilename(), text: theText }
}

// Podium blocks live in the stands grid; each has a label (name, points) and a numbered block.
export function podiumBlocks(thePage: Page): Locator {
  return thePage.locator('main section > div.mt-2 .grid > div')
}

export type Box = { x: number; y: number; width: number; height: number }

export function overlaps(theA: Box, theB: Box): boolean {
  return theA.x < theB.x + theB.width - 0.5 && theB.x < theA.x + theA.width - 0.5 && theA.y < theB.y + theB.height - 0.5 && theB.y < theA.y + theA.height - 0.5
}

// Every name element must fit, or carry a visible ellipsis only when the name is over 20 characters.
export async function expectNamesNotClipped(theLocator: Locator): Promise<void> {
  const theInfo = await theLocator.evaluateAll((theEls) =>
    theEls.map((theEl) => {
      const theStyle = getComputedStyle(theEl)
      return {
        text: (theEl.textContent ?? '').trim(),
        scrollW: theEl.scrollWidth,
        clientW: theEl.clientWidth,
        scrollH: theEl.scrollHeight,
        clientH: theEl.clientHeight,
        ellipsis: theStyle.textOverflow === 'ellipsis',
      }
    }),
  )
  expect(theInfo.length).toBeGreaterThan(0)
  for (let n = 0; n < theInfo.length; n++) {
    const theItem = theInfo[n]
    if (theItem.scrollW > theItem.clientW + 1) {
      expect(theItem.ellipsis && theItem.text.length > 20, 'name clipped: ' + theItem.text + ' ' + theItem.scrollW + '>' + theItem.clientW).toBe(true)
    }
    expect(theItem.scrollH, 'name clipped vertically: ' + theItem.text).toBeLessThanOrEqual(theItem.clientH + 2)
  }
}

export async function pressWhenVisible(thePage: Page, theLocator: Locator, theKey: string): Promise<void> {
  await expect(theLocator).toBeVisible()
  await thePage.keyboard.press(theKey)
}

export async function startGameFromSetup(thePage: Page): Promise<void> {
  await thePage.goto('/#/')
  await expect(thePage.getByRole('button', { name: /start game/i }).first()).toBeVisible()
  await thePage.keyboard.press('Enter')
  await expect.poll(async () => (await readFull(thePage)).state.game.phase).toBe('teamup')
}

export async function startTurnFromTeamUp(thePage: Page): Promise<void> {
  await expect(thePage.getByRole('button', { name: /start (turn|now)/i }).first()).toBeVisible()
  await thePage.keyboard.press('Space')
  await expect.poll(async () => (await readFull(thePage)).state.game.phase).toBe('live')
  await expect(thePage.getByRole('timer')).toBeVisible()
  await expect
    .poll(async () => {
      const theTurn = (await readFull(thePage)).state.game.turn as { startedAt: number } | null
      return theTurn !== null && Date.now() >= theTurn.startedAt
    })
    .toBe(true)
}

export async function historyLength(thePage: Page): Promise<number> {
  return (await readFull(thePage)).state.game.history.length
}

// Presses a live-screen key and waits until the store records a new history row.
export async function pressForRow(thePage: Page, theKey: string): Promise<SeedRow> {
  const theBefore = await historyLength(thePage)
  await thePage.keyboard.press(theKey)
  await expect.poll(() => historyLength(thePage)).toBe(theBefore + 1)
  const theHistory = (await readFull(thePage)).state.game.history
  return theHistory[theHistory.length - 1]
}

// N only works once the live screen has rendered the ended turn, so retry until the phase moves on.
export async function pressNextTeam(thePage: Page): Promise<void> {
  await expect
    .poll(async () => {
      const theTurn = (await readFull(thePage)).state.game.turn as { end: unknown } | null
      return theTurn !== null && theTurn.end !== null
    })
    .toBe(true)
  await expect(async () => {
    await thePage.keyboard.press('n')
    await expect.poll(async () => (await readFull(thePage)).state.game.phase, { timeout: 1000 }).not.toBe('live')
  }).toPass({ timeout: 8000 })
}
