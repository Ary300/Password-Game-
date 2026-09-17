import { expect, test, type Page } from '@playwright/test'
import { collectConsoleErrors, readStore, seedSettings, waitForClockRunning, waitForPhase } from './helpers'

const SYNC_MS = 1_000

async function expectNoButtons(theProjector: Page) {
  await expect(theProjector.getByRole('button')).toHaveCount(0)
  await expect(theProjector.locator('header nav')).toHaveCount(0)
}

async function currentWord(thePage: Page): Promise<string> {
  const theTurn = (await readStore(thePage)).state.game.turn
  if (theTurn === null) {
    throw new Error('no turn')
  }
  return theTurn.word.word
}

function liveWord(theProjector: Page) {
  return theProjector.locator('section[aria-label="Live turn"] span[aria-live="polite"]')
}

test('projector window follows a full turn cycle and never shows controls', async ({ page, context }) => {
  test.setTimeout(90_000)
  const theErrors = collectConsoleErrors(page)
  await seedSettings(page, { turnSeconds: 5, roundsPerGame: 1, handoffSeconds: 30, autoAdvance: true, multiWord: true })
  await page.goto('/#/')
  await expect(page.getByRole('button', { name: /start game/i }).first()).toBeVisible()

  const theProjector = await context.newPage()
  const theProjectorErrors = collectConsoleErrors(theProjector)
  await theProjector.goto('/#/projector')
  await expect(theProjector.getByText('The game appears here when it starts.')).toBeVisible()
  await expectNoButtons(theProjector)

  // Team up
  await page.keyboard.press('Enter')
  await waitForPhase(page, 'teamup')
  await expect(theProjector.locator('section[aria-label="Team up"]')).toBeVisible({ timeout: SYNC_MS })
  await expect(theProjector.getByText('Team 1', { exact: true }).first()).toBeVisible({ timeout: SYNC_MS })
  await expect(theProjector.getByText('Round 1 of 1')).toBeVisible({ timeout: SYNC_MS })
  await expectNoButtons(theProjector)

  // Countdown
  await expect(page.getByRole('button', { name: /start turn/i }).first()).toBeVisible()
  await page.keyboard.press('Space')
  await waitForPhase(page, 'live')
  await expect(theProjector.getByText(/Team 1 up\./)).toBeVisible({ timeout: SYNC_MS })
  await expectNoButtons(theProjector)

  // Live word
  await waitForClockRunning(page)
  const theFirstWord = await currentWord(page)
  await expect(liveWord(theProjector)).toHaveText(theFirstWord, { timeout: SYNC_MS })
  await expect(theProjector.getByRole('timer')).toBeVisible()
  await expectNoButtons(theProjector)

  // Correct brings a new word on both screens
  await page.keyboard.press('Enter')
  await expect.poll(async () => currentWord(page), { timeout: SYNC_MS }).not.toBe(theFirstWord)
  const theSecondWord = await currentWord(page)
  await expect(liveWord(theProjector)).toHaveText(theSecondWord, { timeout: SYNC_MS })

  // Time's up band
  await expect.poll(async () => (await readStore(page)).state.game.turn?.end?.outcome ?? null, { timeout: 8_000 }).toBe('timeup')
  await expect(page.getByText("Time's up")).toBeVisible()
  await expect(theProjector.getByText("Time's up")).toBeVisible({ timeout: SYNC_MS })
  await expect(theProjector.getByRole('status').getByText(theSecondWord, { exact: true })).toBeVisible({ timeout: SYNC_MS })
  await expectNoButtons(theProjector)

  // Hand-off to the next team
  await waitForPhase(page, 'teamup', 5_000)
  await expect(page.getByText('Starts in')).toBeVisible()
  await expect(theProjector.getByText('Starts in')).toBeVisible({ timeout: SYNC_MS })
  await expect(theProjector.getByText('Team 2', { exact: true }).first()).toBeVisible({ timeout: SYNC_MS })
  await expectNoButtons(theProjector)

  // Next team plays and ends its turn, which ends the only round
  await page.keyboard.press('Space')
  await waitForPhase(page, 'live')
  await expect(theProjector.getByText(/Team 2 up\./)).toBeVisible({ timeout: SYNC_MS })
  await waitForClockRunning(page)
  await expect(liveWord(theProjector)).toHaveText(await currentWord(page), { timeout: SYNC_MS })
  await page.keyboard.press('Escape')
  await expect(theProjector.getByText('Turn over')).toBeVisible({ timeout: SYNC_MS })
  await expectNoButtons(theProjector)

  // Podium
  await waitForPhase(page, 'podium', 6_000)
  await expect(theProjector.getByRole('list', { name: 'Full standings' })).toBeVisible({ timeout: SYNC_MS })
  await expect(theProjector.getByRole('list', { name: 'Full standings' })).toContainText('Team 1')
  await expect(theProjector.getByRole('list', { name: 'Full standings' })).toContainText('Team 2')
  await expectNoButtons(theProjector)
  const theScroll = await theProjector.evaluate(() => (document.scrollingElement ? document.scrollingElement.scrollHeight - window.innerHeight : 0))
  expect(theScroll).toBeLessThanOrEqual(1)

  expect(theErrors).toEqual([])
  expect(theProjectorErrors).toEqual([])
})

test('a projector opened mid-turn joins the running turn', async ({ page, context }) => {
  await seedSettings(page, { turnSeconds: 60 })
  await page.goto('/#/')
  await expect(page.getByRole('button', { name: /start game/i }).first()).toBeVisible()
  await page.keyboard.press('Enter')
  await waitForPhase(page, 'teamup')
  await expect(page.getByRole('button', { name: /start turn/i }).first()).toBeVisible()
  await page.keyboard.press('Space')
  await waitForClockRunning(page)
  const theProjector = await context.newPage()
  await theProjector.goto('/#/projector')
  await expect(liveWord(theProjector)).toHaveText(await currentWord(page))
  // Pause in the teacher window shows on the projector.
  await page.bringToFront()
  await page.keyboard.press('Space')
  await expect(theProjector.getByRole('status').getByText('Paused')).toBeVisible({ timeout: SYNC_MS })
  await expectNoButtons(theProjector)
})
