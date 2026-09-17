import type { Page } from '@playwright/test'
import { expectNoPageScroll, waitForPhase } from './helpers'
import {
  boxOf,
  boxesIntersect,
  currentTurn,
  expect,
  gotoTeamUp,
  liveWord,
  readGame,
  seedGame,
  startTurnWithSpace,
  test,
  timerRing,
  timerSeconds,
  waitForLiveUi,
} from './helpers-turn'

const TEAMS = [
  { name: 'Hawks', players: ['Ana', 'Ben'] },
  { name: 'Owls', players: ['Dee', 'Eve'] },
]

async function expectTimeUpOnTime(thePage: Page, theSeconds: number): Promise<void> {
  await seedGame(thePage, { settings: { turnSeconds: theSeconds, countdown: false, autoAdvance: false, sound: false }, teams: TEAMS })
  await gotoTeamUp(thePage)
  await startTurnWithSpace(thePage)
  await expect(thePage.getByText("Time's up")).toBeVisible({ timeout: theSeconds * 1000 + 3000 })
  const theTurn = await currentTurn(thePage)
  const theRow = (await readGame(thePage)).history[0]
  expect(theRow.outcome).toBe('timeup')
  expect(theTurn.turnMs).toBe(theSeconds * 1000)
  expect(Math.abs(theRow.at - theTurn.startedAt - theSeconds * 1000)).toBeLessThanOrEqual(50)
  expect(Math.abs(theRow.elapsedMs - theSeconds * 1000)).toBeLessThanOrEqual(50)
  // The moment the app noticed the deadline, not only the deadline it wrote down.
  expect(theTurn.end?.outcome).toBe('timeup')
  const theLate = (theTurn.end?.at ?? 0) - (theTurn.startedAt + theSeconds * 1000)
  expect(theLate).toBeGreaterThanOrEqual(0)
  expect(theLate).toBeLessThanOrEqual(50)
  await expect(timerRing(thePage)).toHaveAttribute('aria-label', '0 seconds left')
}

test.describe('Timer accuracy', () => {
  test('5 s turn times out within 50 ms', async ({ page }) => {
    await expectTimeUpOnTime(page, 5)
  })

  test('20 s turn times out within 50 ms', async ({ page }) => {
    test.setTimeout(60_000)
    await expectTimeUpOnTime(page, 20)
  })

  test('a time-up turn reveals the word for 2 s, then hands off', async ({ page }) => {
    await seedGame(page, { settings: { turnSeconds: 5, countdown: false, handoffSeconds: 30, sound: false }, teams: TEAMS })
    await gotoTeamUp(page)
    await startTurnWithSpace(page)
    const theWord = (await currentTurn(page)).word.word
    const theBanner = page.locator('section[aria-label="Live turn"] > [role="status"]')
    await expect(theBanner).toContainText("Time's up", { timeout: 8000 })
    await expect(theBanner.getByText(theWord, { exact: true })).toBeVisible()
    const theEndAt = (await currentTurn(page)).end?.at ?? 0
    await waitForPhase(page, 'teamup', 5000)
    const theGame = await readGame(page)
    const theBannerMs = (theGame.handoffEndsAt ?? 0) - 30_000 - theEndAt
    expect(theBannerMs).toBeGreaterThanOrEqual(2000)
    expect(theBannerMs).toBeLessThan(2250)
  })
})

test.describe('Timer survives interruptions', () => {
  test('refresh mid-turn keeps the word and the remaining time', async ({ page }) => {
    await seedGame(page, { settings: { turnSeconds: 60, countdown: false, sound: false }, teams: TEAMS })
    await gotoTeamUp(page)
    await startTurnWithSpace(page)
    await page.waitForTimeout(2500)
    const theWord = (await currentTurn(page)).word.word
    const theBefore = await timerSeconds(page)
    const theBeforeAt = Date.now()
    await page.reload()
    await waitForLiveUi(page)
    await expect(liveWord(page)).toHaveText(theWord)
    const theAfter = await timerSeconds(page)
    const theElapsed = (Date.now() - theBeforeAt) / 1000
    expect(Math.abs(theBefore - theElapsed - theAfter)).toBeLessThanOrEqual(1)
    expect((await currentTurn(page)).word.word).toBe(theWord)

    // A paused clock stays paused and frozen across a refresh.
    await page.keyboard.press('Space')
    await expect(page.getByRole('button', { name: /^Resume/ })).toBeVisible()
    const thePaused = await timerSeconds(page)
    await page.reload()
    await waitForLiveUi(page)
    await expect(page.getByRole('button', { name: /^Resume/ })).toBeVisible()
    await page.waitForTimeout(1200)
    expect(await timerSeconds(page)).toBe(thePaused)
  })

  test('refresh during the 3-2-1 countdown keeps the start time', async ({ page }) => {
    await seedGame(page, { settings: { turnSeconds: 30, countdown: true, sound: false }, teams: TEAMS })
    await gotoTeamUp(page)
    await page.keyboard.press('Space')
    await waitForPhase(page, 'live')
    const theStartedAt = (await currentTurn(page)).startedAt
    await page.reload()
    await waitForLiveUi(page)
    expect((await currentTurn(page)).startedAt).toBe(theStartedAt)
    await expect(liveWord(page)).toBeVisible({ timeout: 5000 })
  })

  test('leaving for the leaderboard mid-turn still times out, and the teacher returns to the next team', async ({ page }) => {
    await seedGame(page, { settings: { turnSeconds: 5, countdown: false, handoffSeconds: 30, sound: false }, teams: TEAMS })
    await gotoTeamUp(page)
    await startTurnWithSpace(page)
    await page.getByRole('link', { name: 'Leaderboard' }).click()
    await expect(page).toHaveURL(/#\/leaderboard/)
    await waitForPhase(page, 'teamup', 12_000)
    await expect(page).toHaveURL(/#\/leaderboard/)
    const theGame = await readGame(page)
    expect(theGame.history.length).toBe(1)
    expect(theGame.history[0].outcome).toBe('timeup')
    expect(theGame.currentTeamIndex).toBe(1)
    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/teamup/)
    await expect(page.getByRole('heading', { name: 'Owls' })).toBeVisible()
    await expect(page.getByText('Starts in')).toBeVisible()
  })

  test('leaderboard and back during a turn returns to the running clock', async ({ page }) => {
    await seedGame(page, { settings: { turnSeconds: 60, countdown: false, sound: false }, teams: TEAMS })
    await gotoTeamUp(page)
    await startTurnWithSpace(page)
    const theWord = (await currentTurn(page)).word.word
    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/leaderboard/)
    await page.waitForTimeout(1200)
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/#\/live/)
    await waitForLiveUi(page)
    await expect(liveWord(page)).toHaveText(theWord)
    expect((await currentTurn(page)).end).toBeNull()
  })

  test('a hidden tab still times out on time', async ({ page, context }) => {
    await seedGame(page, { settings: { turnSeconds: 5, countdown: false, autoAdvance: false, sound: false }, teams: TEAMS })
    await gotoTeamUp(page)
    await startTurnWithSpace(page)
    const theOther = await context.newPage()
    await theOther.goto('about:blank')
    await theOther.bringToFront()
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect.poll(async () => (await readGame(page)).turn?.end?.outcome ?? null, { timeout: 9000 }).toBe('timeup')
    const theTurn = await currentTurn(page)
    const theLate = (theTurn.end?.at ?? 0) - (theTurn.startedAt + 5000)
    expect(theLate).toBeGreaterThanOrEqual(0)
    expect(theLate).toBeLessThanOrEqual(50)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.bringToFront()
    await expect(page.getByText("Time's up")).toBeVisible()
    await theOther.close()
  })
})

test.describe('Layout', () => {
  test('Team up and Live fit without scrolling', async ({ page }) => {
    await seedGame(page, { settings: { turnSeconds: 60, countdown: false, sound: false }, teams: TEAMS })
    await gotoTeamUp(page)
    await expectNoPageScroll(page)
    await startTurnWithSpace(page)
    await expectNoPageScroll(page)
    await page.keyboard.press('Space')
    await expect(page.getByRole('button', { name: /^Resume/ })).toBeVisible()
    await expectNoPageScroll(page)
  })

  for (const theWord of ['cat', 'photosynthesis']) {
    test('Live pieces never overlap and the digits sit inside the ring: ' + theWord, async ({ page }) => {
      await seedGame(page, {
        settings: { turnSeconds: 60, countdown: false, sound: false, customWords: theWord, customWordMode: 'replace' },
        teams: [
          { name: 'Hawks', players: ['Anastasia', 'Bartholomew'] },
          { name: 'Owls', players: ['Dee'] },
        ],
      })
      await gotoTeamUp(page)
      await startTurnWithSpace(page)
      await expect(liveWord(page)).toHaveText(theWord)
      // Let the word fit itself after fonts load.
      await page.waitForTimeout(500)
      const theViewport = page.viewportSize()
      const theWordBox = await boxOf(liveWord(page))
      const theRingBox = await boxOf(timerRing(page))
      const theControlsBox = await boxOf(page.getByRole('group', { name: 'Turn controls' }))
      const thePanelBox = await boxOf(page.locator('section[aria-label="Live turn"] > div').last().locator('> div').last())
      const theNamed = [
        { name: 'word', box: theWordBox },
        { name: 'timer ring', box: theRingBox },
        { name: 'controls', box: theControlsBox },
        { name: 'team panel', box: thePanelBox },
      ]
      for (let n = 0; n < theNamed.length; n++) {
        const theBox = theNamed[n].box
        expect(theBox.x, theNamed[n].name + ' left edge').toBeGreaterThanOrEqual(-1)
        expect(theBox.y + theBox.height, theNamed[n].name + ' bottom edge').toBeLessThanOrEqual((theViewport?.height ?? 0) + 1)
        expect(theBox.x + theBox.width, theNamed[n].name + ' right edge').toBeLessThanOrEqual((theViewport?.width ?? 0) + 1)
        for (let i = n + 1; i < theNamed.length; i++) {
          expect(boxesIntersect(theBox, theNamed[i].box), theNamed[n].name + ' overlaps ' + theNamed[i].name).toBe(false)
        }
      }
      // Each control button stays inside its group, so no label spills onto the panel.
      const theButtons = page.getByRole('group', { name: 'Turn controls' }).getByRole('button')
      const theCount = await theButtons.count()
      for (let n = 0; n < theCount; n++) {
        const theInner = await theButtons.nth(n).evaluate((theEl) => theEl.scrollWidth <= theEl.clientWidth + 1)
        expect(theInner, 'button ' + String(n) + ' text fits').toBe(true)
      }

      const theDigits = timerRing(page).locator('span').first()
      await expect(theDigits).toHaveText(/^\d+$/)
      const theDigitsBox = await boxOf(theDigits)
      const theCenterX = theRingBox.x + theRingBox.width / 2
      const theCenterY = theRingBox.y + theRingBox.height / 2
      // Inner edge of the ring stroke: radius 44.5 minus half of the 9-unit stroke, out of a 100-unit box.
      const theInnerRadius = (theRingBox.width * 40) / 100
      const theCorners = [
        [theDigitsBox.x, theDigitsBox.y],
        [theDigitsBox.x + theDigitsBox.width, theDigitsBox.y],
        [theDigitsBox.x, theDigitsBox.y + theDigitsBox.height],
        [theDigitsBox.x + theDigitsBox.width, theDigitsBox.y + theDigitsBox.height],
      ]
      for (let n = 0; n < theCorners.length; n++) {
        const theDistance = Math.hypot(theCorners[n][0] - theCenterX, theCorners[n][1] - theCenterY)
        expect(theDistance, 'digit corner ' + String(n) + ' inside the ring').toBeLessThanOrEqual(theInnerRadius)
      }
      await expectNoPageScroll(page)
    })
  }
})
