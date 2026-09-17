import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { collectConsoleErrors, readStore, seedSettings, waitForClockRunning, waitForPhase } from './helpers'
import {
  findClippedDisplayText,
  findKeycapOverlaps,
  findOverlappingButtons,
  findOverlappingText,
  goLiveFromTeamUp,
  saveScreen,
  startGameWithPlayers,
  timerDigitsInsideRing,
} from './helpers-visual'

const BAND = 'section[aria-label="Live turn"] > .grid'

// Screenshot first so a failing layout still leaves a picture to look at, then check every rule softly.
async function check(thePage: Page, theInfo: TestInfo, theName: string, theNoScroll: boolean) {
  await thePage.evaluate(() => document.fonts.ready)
  if (theName.startsWith('teamup') || theName.startsWith('projector-teamup') || theName.startsWith('setup')) {
    await thePage.waitForTimeout(900)
  }
  await saveScreen(thePage, theInfo, theName)
  const theSizes = await thePage.evaluate(() => {
    const theRoot = document.scrollingElement
    const theMain = document.querySelector('main')
    let theMainScroll = 0
    if (theMain !== null) {
      theMainScroll = theMain.scrollHeight - theMain.clientHeight
    }
    return {
      scrollH: theRoot ? theRoot.scrollHeight : 0,
      scrollW: theRoot ? theRoot.scrollWidth : 0,
      innerH: window.innerHeight,
      innerW: window.innerWidth,
      mainScroll: theMainScroll,
    }
  })
  expect.soft(theSizes.scrollW, theName + ': page scrolls sideways').toBeLessThanOrEqual(theSizes.innerW + 1)
  if (theNoScroll) {
    expect.soft(theSizes.scrollH, theName + ': page scrolls').toBeLessThanOrEqual(theSizes.innerH + 1)
    expect.soft(theSizes.mainScroll, theName + ': main scrolls').toBeLessThanOrEqual(1)
  }
  expect.soft(await findOverlappingButtons(thePage), theName + ': overlapping controls').toEqual([])
  expect.soft(await findClippedDisplayText(thePage), theName + ': clipped display text').toEqual([])
  expect.soft(await findKeycapOverlaps(thePage), theName + ': key caps over labels').toEqual([])
}

async function checkLiveBand(thePage: Page, theName: string) {
  expect.soft(await findOverlappingText(thePage, BAND), theName + ': bottom band text overlaps').toEqual([])
  const theRing = await timerDigitsInsideRing(thePage)
  expect.soft(theRing.ok, theName + ': timer digits leave the ring, ' + theRing.detail).toBe(true)
}

test.describe('visual', () => {
  test('setup, both tabs, settings drawer, clue checker, shortcuts', async ({ page }, theInfo) => {
    const theErrors = collectConsoleErrors(page)
    await page.goto('/#/')
    await expect(page.getByRole('button', { name: /start game/i }).first()).toBeVisible()
    await check(page, theInfo, 'setup-teams', false)
    await page.getByRole('tab', { name: 'Classes' }).click()
    await expect(page.getByRole('tab', { name: 'Classes' })).toHaveAttribute('data-state', 'active')
    await check(page, theInfo, 'setup-classes', false)
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
    await page.waitForTimeout(300)
    await check(page, theInfo, 'settings-drawer', false)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.keyboard.press('c')
    const theDialog = page.getByRole('dialog', { name: 'Clue checker' })
    await expect(theDialog).toBeVisible()
    await page.waitForTimeout(300)
    await check(page, theInfo, 'clue-empty', false)
    await theDialog.getByLabel(/^Word/).fill('sunflower')
    await theDialog.getByLabel('Clue someone said').fill('sun')
    await expect(theDialog.getByText('Not allowed', { exact: true })).toBeVisible()
    await check(page, theInfo, 'clue-not-allowed', false)
    await theDialog.getByLabel('Clue someone said').fill('yellow')
    await expect(theDialog.getByText('Allowed', { exact: true })).toBeVisible()
    await check(page, theInfo, 'clue-allowed', false)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
    await page.waitForTimeout(300)
    await check(page, theInfo, 'shortcuts', false)
    const theDialogFits = await page.evaluate(() => {
      const theEl = document.querySelector('[role="dialog"] .scroll-area')
      return theEl === null ? 0 : theEl.scrollHeight - theEl.clientHeight
    })
    if ((page.viewportSize()?.height ?? 1080) >= 1000) {
      expect.soft(theDialogFits, 'shortcuts list scrolls on a projector').toBeLessThanOrEqual(1)
    }
    expect(theErrors).toEqual([])
  })

  test('team up, countdown, running, paused, swap, end game modal', async ({ page }, theInfo) => {
    const theErrors = collectConsoleErrors(page)
    await seedSettings(page, { turnSeconds: 60 })
    await startGameWithPlayers(page)
    await check(page, theInfo, 'teamup', true)
    await page.keyboard.press('Space')
    await waitForPhase(page, 'live')
    await expect(page.getByText(/up\. .*turn around/)).toBeVisible()
    await check(page, theInfo, 'live-countdown', true)
    await checkLiveBand(page, 'live-countdown')
    await waitForClockRunning(page)
    await page.waitForTimeout(200)
    await check(page, theInfo, 'live-running', true)
    await checkLiveBand(page, 'live-running')
    await page.keyboard.press('Space')
    await expect(page.getByRole('status').getByText('Paused', { exact: true })).toBeVisible()
    await check(page, theInfo, 'live-paused', true)
    await checkLiveBand(page, 'live-paused')
    await page.keyboard.press('Space')
    await page.keyboard.press('g')
    await expect(page.getByRole('dialog', { name: 'Swap guesser' })).toBeVisible()
    await page.waitForTimeout(300)
    await check(page, theInfo, 'live-swap', true)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.getByRole('button', { name: 'End game' }).click()
    await expect(page.getByRole('dialog').or(page.getByRole('alertdialog'))).toBeVisible()
    await page.waitForTimeout(300)
    await check(page, theInfo, 'live-end-game-modal', true)
    expect(theErrors).toEqual([])
  })

  test('five seconds left, time up band, hand-off', async ({ page }, theInfo) => {
    const theErrors = collectConsoleErrors(page)
    await seedSettings(page, { turnSeconds: 5, handoffSeconds: 30, autoAdvance: false })
    await startGameWithPlayers(page)
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await page.waitForTimeout(400)
    await check(page, theInfo, 'live-red', true)
    await checkLiveBand(page, 'live-red')
    await expect(page.getByText("Time's up")).toBeVisible({ timeout: 8_000 })
    await page.waitForTimeout(400)
    await check(page, theInfo, 'live-timesup', true)
    await page.keyboard.press('n')
    await waitForPhase(page, 'teamup')
    // The hand-off countdown only runs with auto hand-off on, so switch it back and play a short turn.
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    const theAuto = page.getByRole('switch', { name: /Start the next team automatically/ }).first()
    await theAuto.click()
    await page.keyboard.press('Escape')
    await expect.poll(async () => (await readStore(page)).state.settings.autoAdvance).toBe(true)
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await page.keyboard.press('Escape')
    await waitForPhase(page, 'teamup', 6_000)
    await expect(page.getByText('Starts in')).toBeVisible()
    await check(page, theInfo, 'teamup-handoff', true)
    expect(theErrors).toEqual([])
  })

  test('correct band, leaderboard tabs, podium', async ({ page }, theInfo) => {
    const theErrors = collectConsoleErrors(page)
    await seedSettings(page, { turnSeconds: 60, multiWord: false, autoAdvance: false })
    await startGameWithPlayers(page)
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await page.keyboard.press('Enter')
    await expect(page.getByRole('status').getByText('Correct', { exact: true })).toBeVisible()
    await page.waitForTimeout(400)
    await check(page, theInfo, 'live-correct', true)
    await page.keyboard.press('n')
    await waitForPhase(page, 'teamup')
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await page.keyboard.press('s')
    await page.keyboard.press('Escape')
    await expect(page.getByText('Turn over')).toBeVisible()
    await page.keyboard.press('l')
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    const theTabs = ['This game', 'Players', 'Round history', 'Class board']
    for (let n = 0; n < theTabs.length; n++) {
      await page.getByRole('tab', { name: theTabs[n] }).click()
      await page.waitForTimeout(400)
      await check(page, theInfo, 'leaderboard-' + theTabs[n].toLowerCase().replace(' ', '-'), true)
    }
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/#\/live$/)
    await page.keyboard.press('n')
    await waitForPhase(page, 'teamup')
    await page.getByRole('button', { name: 'End game' }).first().click()
    await page.getByRole('dialog').or(page.getByRole('alertdialog')).getByRole('button', { name: /end game/i }).click()
    await waitForPhase(page, 'podium')
    await page.waitForTimeout(2_500)
    await check(page, theInfo, 'podium', true)
    expect(theErrors).toEqual([])
  })

  test('light theme live screen', async ({ page }, theInfo) => {
    const theErrors = collectConsoleErrors(page)
    await seedSettings(page, { turnSeconds: 60, theme: 'light' })
    await startGameWithPlayers(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await check(page, theInfo, 'teamup-light', true)
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await page.waitForTimeout(200)
    await check(page, theInfo, 'live-light', true)
    await checkLiveBand(page, 'live-light')
    expect(theErrors).toEqual([])
  })

  test('projector window layout', async ({ page, context }, theInfo) => {
    await seedSettings(page, { turnSeconds: 60 })
    await startGameWithPlayers(page)
    const theProjector = await context.newPage()
    await theProjector.goto('/#/projector')
    await expect(theProjector.locator('section[aria-label="Team up"]')).toBeVisible()
    await check(theProjector, theInfo, 'projector-teamup', true)
    await page.bringToFront()
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await expect(theProjector.getByRole('timer')).toBeVisible()
    await theProjector.waitForTimeout(300)
    await check(theProjector, theInfo, 'projector-live', true)
    await checkLiveBand(theProjector, 'projector-live')
  })

  test('narrow window check of the key caps and top bar at 800 wide', async ({ page }, theInfo) => {
    await page.setViewportSize({ width: 800, height: 600 })
    await seedSettings(page, { turnSeconds: 60 })
    await startGameWithPlayers(page)
    await check(page, theInfo, 'teamup-800', true)
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await check(page, theInfo, 'live-800', true)
    await checkLiveBand(page, 'live-800')
    expect.soft(await findKeycapOverlaps(page)).toEqual([])
  })
})
