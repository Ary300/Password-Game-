import { expect, type Page } from '@playwright/test'

export const STORE_KEY = 'pt-password-v1'

export type StoredState = {
  state: {
    settings: Record<string, unknown>
    teams: { id: string; name: string; players: { id: string; name: string }[] }[]
    game: {
      phase: string
      round: number
      currentTeamIndex: number
      usedWords: string[]
      history: { outcome: string; word: string; points: number; teamId: string; guesser: string; at: number }[]
      turnsLog: { guesserId: string | null; teamId: string }[]
      turn: null | {
        word: { word: string; syllables: number }
        startedAt: number
        pausedAt: number | null
        skipsUsed: number
        end: null | { outcome: string; at: number }
        guesser: string
      }
      poolWarning: string[]
      handoffEndsAt: number | null
    }
    classes: { id: string; name: string; students: { id: string; name: string; absent: boolean }[] }[]
  }
  version: number
}

export async function readStore(thePage: Page): Promise<StoredState> {
  const theRaw = await thePage.evaluate((theKey) => localStorage.getItem(theKey), STORE_KEY)
  if (theRaw === null) {
    throw new Error('Store not written yet')
  }
  return JSON.parse(theRaw) as StoredState
}

// Seeds settings before the app boots so a test can run 5 s turns without clicking through the drawer.
export async function seedSettings(thePage: Page, theSettings: Record<string, unknown>): Promise<void> {
  await thePage.addInitScript(
    ([theKey, thePatch]) => {
      if (sessionStorage.getItem('seeded') === '1') {
        return
      }
      sessionStorage.setItem('seeded', '1')
      const theExisting = localStorage.getItem(theKey as string)
      let theState: { state: Record<string, unknown>; version: number } = { state: {}, version: 1 }
      if (theExisting !== null) {
        theState = JSON.parse(theExisting)
      }
      const theOld = (theState.state.settings as Record<string, unknown> | undefined) ?? {}
      theState.state.settings = { ...theOld, ...(thePatch as Record<string, unknown>) }
      localStorage.setItem(theKey as string, JSON.stringify(theState))
    },
    [STORE_KEY, theSettings] as const,
  )
}

export function collectConsoleErrors(thePage: Page): string[] {
  const theErrors: string[] = []
  thePage.on('console', (theMessage) => {
    if (theMessage.type() === 'error') {
      theErrors.push(theMessage.text())
    }
  })
  thePage.on('pageerror', (theError) => theErrors.push(theError.message))
  return theErrors
}

export async function expectNoPageScroll(thePage: Page): Promise<void> {
  const theSizes = await thePage.evaluate(() => ({
    scroll: document.scrollingElement ? document.scrollingElement.scrollHeight : 0,
    inner: window.innerHeight,
    scrollW: document.scrollingElement ? document.scrollingElement.scrollWidth : 0,
    innerW: window.innerWidth,
  }))
  expect(theSizes.scroll).toBeLessThanOrEqual(theSizes.inner + 1)
  expect(theSizes.scrollW).toBeLessThanOrEqual(theSizes.innerW + 1)
}

export async function waitForPhase(thePage: Page, thePhase: string, theTimeout = 15_000): Promise<void> {
  await expect
    .poll(async () => (await readStore(thePage)).state.game.phase, { timeout: theTimeout })
    .toBe(thePhase)
}

export async function startQuickGameToLive(thePage: Page): Promise<void> {
  await thePage.goto('/#/')
  await expect(thePage.getByRole('button', { name: /start game/i }).first()).toBeVisible()
  await thePage.keyboard.press('Enter')
  await waitForPhase(thePage, 'teamup')
  // Hotkeys register when the screen mounts, so wait for its main button before pressing keys.
  await expect(thePage.getByRole('button', { name: /start turn/i }).first()).toBeVisible()
  await thePage.keyboard.press('Space')
  await waitForPhase(thePage, 'live')
}

// Waits out the 3-2-1 so key presses land on a running clock.
export async function waitForClockRunning(thePage: Page): Promise<void> {
  await expect
    .poll(async () => {
      const theTurn = (await readStore(thePage)).state.game.turn
      return theTurn !== null && Date.now() >= theTurn.startedAt
    }, { timeout: 8_000 })
    .toBe(true)
}
