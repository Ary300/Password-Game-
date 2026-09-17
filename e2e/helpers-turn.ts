import { test as base, expect, type Locator, type Page } from '@playwright/test'
import { STORE_KEY, collectConsoleErrors, readStore, waitForPhase } from './helpers'

// Full shapes of the persisted rows these specs read, beyond what helpers.ts types.
export type FullTurn = {
  turnId: string
  teamId: string
  guesserId: string | null
  guesser: string
  swappedFrom: string[]
  word: { word: string }
  wordShownAt: number
  startedAt: number
  turnMs: number
  pausedAt: number | null
  skipsUsed: number
  swapOpen: boolean
  end: null | { outcome: string; at: number; word: string }
}

export type FullRow = {
  id: string
  turnId: string
  round: number
  teamId: string
  guesserId: string | null
  guesser: string
  swappedFrom: string[]
  word: string
  outcome: string
  secondsLeft: number
  elapsedMs: number
  points: number
  at: number
  note: string
}

export type FullGame = {
  id: string
  phase: string
  mode: string
  classId: string | null
  round: number
  currentTeamIndex: number
  usedWords: string[]
  history: FullRow[]
  turnsLog: { turnId: string; round: number; teamId: string; guesserId: string | null; at: number }[]
  turn: FullTurn | null
  handoffEndsAt: number | null
  handoffHeld: boolean
}

export type FullTeam = { id: string; name: string; color: string; players: { id: string; name: string }[]; pickedGuesserId: string | null }

export type FullState = {
  settings: Record<string, unknown>
  teams: FullTeam[]
  game: FullGame
}

export async function readGame(thePage: Page): Promise<FullGame> {
  return (await readStore(thePage)).state.game as unknown as FullGame
}

export async function readFull(thePage: Page): Promise<FullState> {
  return (await readStore(thePage)).state as unknown as FullState
}

export type SeedTeam = { name: string; players?: string[] }

export type SeedOptions = {
  settings?: Record<string, unknown>
  teams?: SeedTeam[]
  // When set, every team's players become students of one class so the game runs in class mode.
  className?: string
}

const COLORS = ['#C63527', '#FED141', '#2F80ED', '#27AE60', '#9B51E0', '#F2994A', '#56CCF2', '#EB5757']

export function playerId(theTeam: number, thePlayer: number): string {
  return 'p-' + String(theTeam) + '-' + String(thePlayer)
}

export function teamId(theTeam: number): string {
  return 'team-seed-' + String(theTeam)
}

// Seeds settings, teams, and an optional class before the app boots. Runs once per tab so a reload keeps live state.
export async function seedGame(thePage: Page, theOptions: SeedOptions): Promise<void> {
  const theTeams: FullTeam[] = []
  const theStudents: { id: string; name: string; absent: boolean; career: { correct: number; turns: number; skips: number; bestMs: null } }[] = []
  const theSeedTeams = theOptions.teams ?? [{ name: 'Team 1' }, { name: 'Team 2' }]
  for (let n = 0; n < theSeedTeams.length; n++) {
    const thePlayers: { id: string; name: string }[] = []
    const theNames = theSeedTeams[n].players ?? []
    for (let i = 0; i < theNames.length; i++) {
      thePlayers.push({ id: playerId(n, i), name: theNames[i] })
      theStudents.push({ id: playerId(n, i), name: theNames[i], absent: false, career: { correct: 0, turns: 0, skips: 0, bestMs: null } })
    }
    theTeams.push({ id: teamId(n), name: theSeedTeams[n].name, color: COLORS[n % COLORS.length], players: thePlayers, pickedGuesserId: null })
  }
  const thePatch: Record<string, unknown> = {
    teams: theTeams,
    settings: { teamCount: theTeams.length, ...(theOptions.settings ?? {}) },
  }
  if (theOptions.className !== undefined) {
    thePatch.classes = [
      { id: 'class-seed', name: theOptions.className, students: theStudents, totals: { games: 0, turns: 0, correct: 0 }, createdAt: 1 },
    ]
    thePatch.activeClassId = 'class-seed'
  }
  await thePage.addInitScript(
    ([theKey, theData]) => {
      if (sessionStorage.getItem('seeded-turn') === '1') {
        return
      }
      sessionStorage.setItem('seeded-turn', '1')
      const theState = { state: theData as Record<string, unknown>, version: 1 }
      localStorage.setItem(theKey as string, JSON.stringify(theState))
    },
    [STORE_KEY, thePatch] as const,
  )
}

// Setup screen, Enter, and wait until Team up has mounted its hotkeys.
export async function gotoTeamUp(thePage: Page): Promise<void> {
  await thePage.goto('/#/')
  await expect(thePage.getByRole('button', { name: /start game/i }).first()).toBeVisible()
  await thePage.keyboard.press('Enter')
  await waitForPhase(thePage, 'teamup')
  await expect(startTurnButton(thePage)).toBeVisible()
}

export function startTurnButton(thePage: Page): Locator {
  return thePage.getByRole('button', { name: /^Start (turn|now)/ })
}

export async function startTurnWithSpace(thePage: Page): Promise<void> {
  await expect(startTurnButton(thePage)).toBeVisible()
  const theBefore = (await readGame(thePage)).turnsLog.length
  await thePage.keyboard.press('Space')
  await waitForPhase(thePage, 'live')
  await expect.poll(async () => (await readGame(thePage)).turnsLog.length).toBe(theBefore + 1)
  await waitForLiveUi(thePage)
}

// Live hotkeys register when the screen mounts, which the turn control group marks.
export async function waitForLiveUi(thePage: Page): Promise<void> {
  await expect(thePage.getByRole('group', { name: 'Turn controls' })).toBeVisible()
}

export function liveWord(thePage: Page): Locator {
  return thePage.locator('section[aria-label="Live turn"] span[aria-live="polite"]')
}

export function timerRing(thePage: Page): Locator {
  return thePage.getByRole('timer')
}

export async function timerSeconds(thePage: Page): Promise<number> {
  const theLabel = await timerRing(thePage).getAttribute('aria-label')
  const theMatch = /^(\d+) seconds left$/.exec(theLabel ?? '')
  if (theMatch === null) {
    throw new Error('Unexpected timer label: ' + String(theLabel))
  }
  return Number(theMatch[1])
}

export async function currentTurn(thePage: Page): Promise<FullTurn> {
  const theTurn = (await readGame(thePage)).turn
  if (theTurn === null) {
    throw new Error('No turn in the store')
  }
  return theTurn
}

export function dialog(thePage: Page): Locator {
  return thePage.locator('[role="dialog"][data-state="open"]')
}

type Box = { x: number; y: number; width: number; height: number }

export function boxesIntersect(theA: Box, theB: Box): boolean {
  return theA.x < theB.x + theB.width && theB.x < theA.x + theA.width && theA.y < theB.y + theB.height && theB.y < theA.y + theA.height
}

export async function boxOf(theLocator: Locator): Promise<Box> {
  const theBox = await theLocator.boundingBox()
  if (theBox === null) {
    throw new Error('Element has no box')
  }
  return theBox
}

// Every spec in this area fails on a console error, so the check lives in a fixture instead of each test body.
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const theErrors = collectConsoleErrors(page)
      await use(theErrors)
      expect(theErrors, 'console errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
