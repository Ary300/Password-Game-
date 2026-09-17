import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test as base, expect, type Locator, type Page } from '@playwright/test'
import { STORE_KEY, collectConsoleErrors, readStore, waitForPhase } from './helpers'

// Every test in these specs fails if the browser logged an error.
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

export type WordRow = { word: string; syllables: number; letters: number; tier: string; category: string }

let theWordCache: Map<string, WordRow> | null = null

export function wordIndex(): Map<string, WordRow> {
  if (theWordCache !== null) {
    return theWordCache
  }
  const theFile = JSON.parse(readFileSync(resolve(process.cwd(), 'src/data/words.json'), 'utf8')) as {
    categories: string[]
    tiers: string[]
    words: (string | number)[][]
  }
  const theMap = new Map<string, WordRow>()
  for (const theRow of theFile.words) {
    const theWord = String(theRow[0])
    theMap.set(theWord, {
      word: theWord,
      syllables: Number(theRow[1]),
      letters: theWord.length,
      tier: theFile.tiers[Number(theRow[2])],
      category: theFile.categories[Number(theRow[3])],
    })
  }
  theWordCache = theMap
  return theMap
}

// Seeds any part of the persisted store once per tab, so a reload keeps whatever the test changed afterward.
export async function seedStore(thePage: Page, thePatch: Record<string, unknown>): Promise<void> {
  await thePage.addInitScript(
    ([theKey, theData]) => {
      if (sessionStorage.getItem('seeded-store') === '1') {
        return
      }
      sessionStorage.setItem('seeded-store', '1')
      const theExisting = localStorage.getItem(theKey as string)
      let theState: { state: Record<string, unknown>; version: number } = { state: {}, version: 1 }
      if (theExisting !== null) {
        theState = JSON.parse(theExisting)
      }
      const thePatchObj = theData as Record<string, unknown>
      for (const theName of Object.keys(thePatchObj)) {
        if (theName === 'settings') {
          const theOld = (theState.state.settings as Record<string, unknown> | undefined) ?? {}
          theState.state.settings = { ...theOld, ...(thePatchObj.settings as Record<string, unknown>) }
        } else {
          theState.state[theName] = thePatchObj[theName]
        }
      }
      localStorage.setItem(theKey as string, JSON.stringify(theState))
    },
    [STORE_KEY, thePatch] as const,
  )
}

export function startGameButton(thePage: Page): Locator {
  return thePage.getByRole('button', { name: /^start game/i })
}

export async function gotoSetup(thePage: Page): Promise<void> {
  await thePage.goto('/#/')
  await expect(startGameButton(thePage)).toBeVisible()
}

// The store only writes to localStorage after its first change, so a missing entry means nothing moved off Setup.
export async function phaseOrSetup(thePage: Page): Promise<string> {
  const theRaw = await thePage.evaluate((theKey) => localStorage.getItem(theKey), STORE_KEY)
  if (theRaw === null) {
    return 'setup'
  }
  return (JSON.parse(theRaw) as { state: { game?: { phase: string } } }).state.game?.phase ?? 'setup'
}

export function settingsDrawer(thePage: Page): Locator {
  return thePage.getByRole('dialog', { name: 'Settings' })
}

export async function openSettings(thePage: Page): Promise<Locator> {
  await thePage.getByRole('button', { name: 'Settings', exact: true }).click()
  const theDrawer = settingsDrawer(thePage)
  await expect(theDrawer).toBeVisible()
  return theDrawer
}

export async function closeSettings(thePage: Page): Promise<void> {
  await settingsDrawer(thePage).getByRole('button', { name: 'Done' }).click()
  await expect(settingsDrawer(thePage)).toBeHidden()
}

// Clicks a Stepper's + or - until its output shows the wanted value.
export async function setStepper(theScope: Locator, theLabel: string | RegExp, theTarget: number): Promise<void> {
  const theGroup = theScope.getByRole('group', { name: theLabel, exact: typeof theLabel === 'string' })
  const theOutput = theGroup.locator('output')
  for (let n = 0; n < 40; n++) {
    const theText = (await theOutput.textContent()) ?? ''
    let theValue = parseInt(theText, 10)
    if (Number.isNaN(theValue)) {
      theValue = 0
    }
    if (theValue === theTarget) {
      return
    }
    if (theValue < theTarget) {
      await theGroup.getByRole('button', { name: /^Increase / }).click()
    } else {
      await theGroup.getByRole('button', { name: /^Decrease / }).click()
    }
    await expect(theOutput).not.toHaveText(theText)
  }
  throw new Error('Stepper ' + String(theLabel) + ' never reached ' + String(theTarget))
}

export async function setToggle(theScope: Locator, theLabel: string | RegExp, theOn: boolean): Promise<void> {
  const theSwitch = theScope.getByRole('switch', { name: theLabel })
  const theChecked = (await theSwitch.getAttribute('aria-checked')) === 'true'
  if (theChecked !== theOn) {
    await theSwitch.click()
  }
  await expect(theSwitch).toHaveAttribute('aria-checked', String(theOn))
}

export async function settingsOf(thePage: Page): Promise<Record<string, unknown>> {
  return (await readStore(thePage)).state.settings
}

// Starts a quick game from Setup and waits until the first turn's clock is live.
export async function startToLive(thePage: Page): Promise<void> {
  await startGameButton(thePage).click()
  await waitForPhase(thePage, 'teamup')
  await expect(thePage.getByRole('button', { name: /^start (turn|now)/i })).toBeVisible()
  await thePage.keyboard.press('Space')
  await waitForPhase(thePage, 'live')
  await expect(thePage.getByRole('group', { name: 'Turn controls' })).toBeVisible()
}

export async function waitClockRunning(thePage: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        const theTurn = (await readStore(thePage)).state.game.turn
        return theTurn !== null && Date.now() >= theTurn.startedAt
      },
      { timeout: 8_000 },
    )
    .toBe(true)
}

// Presses Enter once per wanted word and returns every word shown, the last one included.
export async function collectWordsByCorrect(thePage: Page, theCount: number): Promise<string[]> {
  for (let n = 0; n < theCount; n++) {
    const theBefore = (await readStore(thePage)).state.game.history.length
    await thePage.keyboard.press('Enter')
    await expect.poll(async () => (await readStore(thePage)).state.game.history.length).toBe(theBefore + 1)
  }
  const theGame = (await readStore(thePage)).state.game
  return theGame.usedWords.slice()
}

export type Box = { x: number; y: number; width: number; height: number }

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
