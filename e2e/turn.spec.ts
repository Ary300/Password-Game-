import { waitForPhase } from './helpers'
import {
  currentTurn,
  dialog,
  expect,
  gotoTeamUp,
  liveWord,
  playerId,
  readFull,
  readGame,
  seedGame,
  startTurnButton,
  startTurnWithSpace,
  teamId,
  test,
  timerRing,
  timerSeconds,
  waitForLiveUi,
} from './helpers-turn'
import type { Page } from '@playwright/test'

const LONG_TURN = { turnSeconds: 120, countdown: false, sound: false }
const ROSTER = [
  { name: 'Hawks', players: ['Ana', 'Ben', 'Cal'] },
  { name: 'Owls', players: ['Dee', 'Eve'] },
]

async function liveWith(thePage: Page, theSettings: Record<string, unknown>, theTeams = ROSTER): Promise<void> {
  await seedGame(thePage, { settings: { ...LONG_TURN, ...theSettings }, teams: theTeams })
  await gotoTeamUp(thePage)
  await startTurnWithSpace(thePage)
}

test.describe('Team up', () => {
  test('team without players shows the generic guesser line and no roster', async ({ page }) => {
    await seedGame(page, { settings: LONG_TURN, teams: [{ name: 'Lions' }, { name: 'Bears' }] })
    await gotoTeamUp(page)
    await expect(page.getByRole('heading', { name: 'Lions' })).toBeVisible()
    await expect(page.getByText('Guesser, turn around')).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Change guesser' })).toHaveCount(0)
    await expect(page.getByText('Still to guess')).toHaveCount(0)
    // G has no picker to open for a team without players.
    await page.keyboard.press('g')
    await expect(page.getByRole('listbox')).toHaveCount(0)
    await startTurnWithSpace(page)
    expect((await currentTurn(page)).guesser).toBe('')
  })

  test('team with players: guesser line, picker by click and G, still-to-guess strip', async ({ page }) => {
    await seedGame(page, { settings: { ...LONG_TURN, handoffSeconds: 30 }, teams: ROSTER })
    await gotoTeamUp(page)
    await expect(page.getByRole('heading', { name: 'Hawks' })).toBeVisible()
    await expect(page.getByText(/Ana\s+is guessing/)).toBeVisible()
    const theStrip = page.locator('div', { has: page.getByText('Still to guess', { exact: true }) }).last().locator('li')
    await expect(theStrip).toHaveText(['Ana', 'Ben', 'Cal'])

    await page.getByRole('combobox', { name: 'Change guesser' }).click()
    await page.getByRole('option', { name: /Ben/ }).click()
    await expect(page.getByText(/Ben\s+is guessing/)).toBeVisible()
    expect((await readFull(page)).teams[0].pickedGuesserId).toBe(playerId(0, 1))

    await expect(page.getByRole('combobox', { name: 'Change guesser' })).not.toBeFocused()
    await page.keyboard.press('g')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.getByRole('option', { name: /Cal/ }).click()
    await expect(page.getByText(/Cal\s+is guessing/)).toBeVisible()
    expect((await readFull(page)).teams[0].pickedGuesserId).toBe(playerId(0, 2))

    await startTurnWithSpace(page)
    const theTurn = await currentTurn(page)
    expect(theTurn.guesser).toBe('Cal')
    expect((await readGame(page)).turnsLog[0].guesserId).toBe(playerId(0, 2))

    await page.keyboard.press('Escape')
    await waitForPhase(page, 'teamup')
    await expect(page.getByRole('heading', { name: 'Owls' })).toBeVisible()
    await page.keyboard.press('x')
    await expect(page.getByRole('heading', { name: 'Hawks' })).toBeVisible()
    await expect(theStrip).toHaveText(['Ana', 'Ben'])
    await expect(page.getByText(/Ana\s+is guessing/)).toBeVisible()
  })

  test('Start turn works from Space, Enter, N, and the button, one turn each', async ({ page }) => {
    await seedGame(page, { settings: { ...LONG_TURN, autoAdvance: false }, teams: ROSTER })
    await gotoTeamUp(page)
    const theStarts: Array<(thePage: Page) => Promise<void>> = [
      (thePage) => thePage.keyboard.press('Space'),
      (thePage) => thePage.keyboard.press('Enter'),
      (thePage) => thePage.keyboard.press('n'),
      (thePage) => startTurnButton(thePage).click(),
    ]
    for (let n = 0; n < theStarts.length; n++) {
      await expect(startTurnButton(page)).toBeVisible()
      await theStarts[n](page)
      await waitForPhase(page, 'live')
      await waitForLiveUi(page)
      await expect.poll(async () => (await readGame(page)).turnsLog.length).toBe(n + 1)
      await page.keyboard.press('Escape')
      await expect(page.getByText('Turn over')).toBeVisible()
      // Manual hand-off: the banner waits for N or its button.
      await page.waitForTimeout(2300)
      expect((await readGame(page)).phase).toBe('live')
      if (n % 2 === 0) {
        await page.keyboard.press('n')
      } else {
        await page.getByRole('button', { name: /^Next team/ }).click()
      }
      await waitForPhase(page, 'teamup')
      const theGame = await readGame(page)
      expect(theGame.turnsLog.length).toBe(n + 1)
      expect(theGame.handoffEndsAt).toBeNull()
    }
    const theGame = await readGame(page)
    const theTeams: string[] = []
    for (let n = 0; n < theGame.turnsLog.length; n++) {
      theTeams.push(theGame.turnsLog[n].teamId)
    }
    expect(theTeams).toEqual([teamId(0), teamId(1), teamId(0), teamId(1)])
    expect(theGame.round).toBe(3)
  })

  test('Skip team via X and the button advances teams and rounds without a turn', async ({ page }) => {
    await seedGame(page, { settings: { ...LONG_TURN, handoffSeconds: 30, roundsPerGame: 4 }, teams: [{ name: 'Red' }, { name: 'Gold' }, { name: 'Blue' }] })
    await gotoTeamUp(page)
    await expect(page.getByText('Round 1 of 4')).toBeVisible()
    await page.keyboard.press('x')
    await expect(page.getByRole('heading', { name: 'Gold' })).toBeVisible()
    expect((await readGame(page)).currentTeamIndex).toBe(1)
    await page.getByRole('button', { name: /^Skip team/ }).click()
    await expect(page.getByRole('heading', { name: 'Blue' })).toBeVisible()
    await page.keyboard.press('x')
    await expect(page.getByRole('heading', { name: 'Red' })).toBeVisible()
    const theGame = await readGame(page)
    expect(theGame.currentTeamIndex).toBe(0)
    expect(theGame.round).toBe(2)
    expect(theGame.turnsLog).toEqual([])
    expect(theGame.history).toEqual([])
    await expect(page.getByText('Round 2 of 4')).toBeVisible()
    // Undo reverses the skip and holds the hand-off.
    await page.keyboard.press('u')
    await expect(page.getByRole('heading', { name: 'Blue' })).toBeVisible()
    const theUndone = await readGame(page)
    expect(theUndone.round).toBe(1)
    expect(theUndone.handoffHeld).toBe(true)
  })

  test('H holds and resumes the hand-off countdown, and does nothing without one', async ({ page }) => {
    await seedGame(page, { settings: { ...LONG_TURN, handoffSeconds: 3 }, teams: ROSTER })
    await gotoTeamUp(page)
    await page.keyboard.press('h')
    await page.waitForTimeout(300)
    let theGame = await readGame(page)
    expect(theGame.handoffHeld).toBe(false)
    expect(theGame.handoffEndsAt).toBeNull()
    await expect(page.getByText('On hold')).toHaveCount(0)
    await expect(page.getByText('Starts in')).toHaveCount(0)

    await startTurnWithSpace(page)
    await page.keyboard.press('Escape')
    await waitForPhase(page, 'teamup')
    await expect(page.getByText('Starts in')).toBeVisible()
    await page.keyboard.press('h')
    await expect(page.getByText('On hold')).toBeVisible()
    theGame = await readGame(page)
    expect(theGame.handoffHeld).toBe(true)
    expect(theGame.handoffEndsAt).toBeNull()
    await page.waitForTimeout(3500)
    expect((await readGame(page)).phase).toBe('teamup')

    await page.getByRole('button', { name: /^Restart countdown/ }).click()
    await expect(page.getByText('Starts in')).toBeVisible()
    await page.getByRole('button', { name: /^Hold/ }).click()
    await expect(page.getByText('On hold')).toBeVisible()
    await page.waitForTimeout(3500)
    expect((await readGame(page)).phase).toBe('teamup')

    await page.keyboard.press('h')
    await expect(page.getByText('Starts in')).toBeVisible()
    theGame = await readGame(page)
    expect(theGame.handoffHeld).toBe(false)
    expect(theGame.handoffEndsAt).not.toBeNull()
    await waitForPhase(page, 'live', 6000)
    expect((await readGame(page)).turnsLog.length).toBe(2)
  })

  test('standings +1 and -1 buttons log score edits', async ({ page }) => {
    await seedGame(page, { settings: LONG_TURN, teams: ROSTER })
    await gotoTeamUp(page)
    const theStandings = page.getByRole('complementary', { name: 'Standings' })
    await page.getByRole('button', { name: 'Add a point to Owls' }).click()
    await page.getByRole('button', { name: 'Add a point to Owls' }).click()
    await page.getByRole('button', { name: 'Take a point from Owls' }).click()
    const theHistory = (await readGame(page)).history
    expect(theHistory.length).toBe(3)
    expect(theHistory[0]).toMatchObject({ outcome: 'adjust', teamId: teamId(1), points: 1, note: 'Score edited +1 (0 to 1)' })
    expect(theHistory[1]).toMatchObject({ outcome: 'adjust', points: 1, note: 'Score edited +1 (1 to 2)' })
    expect(theHistory[2]).toMatchObject({ outcome: 'adjust', points: -1, note: 'Score edited -1 (2 to 1)' })
    await expect(theStandings.locator('li').first()).toContainText('Owls')
    await expect(theStandings.locator('li').first()).toContainText('1')
    // Space still starts the turn after clicking the nudge buttons.
    await startTurnWithSpace(page)
  })
})

test.describe('Live', () => {
  test('3-2-1 countdown hides the word, blocks scoring, then shows it', async ({ page }) => {
    await seedGame(page, { settings: { turnSeconds: 60, countdown: true, sound: false }, teams: ROSTER })
    await gotoTeamUp(page)
    await page.keyboard.press('Space')
    await waitForPhase(page, 'live')
    const theWord = (await currentTurn(page)).word.word
    const theCountdown = page.locator('section[aria-label="Live turn"] [aria-live="assertive"]')
    await expect(theCountdown).toContainText('Hawks up. Ana, turn around.')
    await expect(liveWord(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Correct/ })).toBeDisabled()
    const theStartedAt = (await currentTurn(page)).startedAt
    const theSeen = new Set<string>()
    // Enter and S are pressed through the 3-2-1 but stop 400 ms before go, so any score would be a countdown bug.
    while (Date.now() < theStartedAt - 400) {
      const theText = await theCountdown.locator('span').first().textContent().catch(() => null)
      if (theText !== null) {
        theSeen.add(theText.trim())
      }
      await page.keyboard.press('Enter')
      await page.keyboard.press('s')
      await page.waitForTimeout(60)
    }
    expect([...theSeen]).toEqual(expect.arrayContaining(['3', '2', '1']))
    await expect(liveWord(page)).toHaveText(theWord)
    await expect(page.getByRole('button', { name: /^Correct/ })).toBeEnabled()
    const theGame = await readGame(page)
    expect(theGame.history).toEqual([])
    expect(theGame.turn?.skipsUsed).toBe(0)
  })

  test('Correct via Enter and the button draws a new word each time', async ({ page }) => {
    await liveWith(page, {})
    const theFirst = (await currentTurn(page)).word.word
    await expect(liveWord(page)).toHaveText(theFirst)
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readGame(page)).history.length).toBe(1)
    const theSecond = (await currentTurn(page)).word.word
    expect(theSecond).not.toBe(theFirst)
    await expect(liveWord(page)).toHaveText(theSecond)
    await page.getByRole('button', { name: /^Correct/ }).click()
    await expect.poll(async () => (await readGame(page)).history.length).toBe(2)
    const theGame = await readGame(page)
    expect(theGame.history[0]).toMatchObject({ outcome: 'correct', word: theFirst, points: 1, guesser: 'Ana', teamId: teamId(0), round: 1 })
    expect(theGame.history[1]).toMatchObject({ outcome: 'correct', word: theSecond, points: 1, guesser: 'Ana' })
    expect(theGame.turn?.end).toBeNull()
    expect(theGame.turn?.word.word).not.toBe(theSecond)
    expect(theGame.usedWords).toEqual(expect.arrayContaining([theFirst, theSecond]))
    await expect(page.getByText('this turn').first()).toBeVisible()
    await expect(page.locator('ol[aria-label="Standings"] li').first()).toContainText('2')
  })

  test('Skip via S and the button honors the per-turn limit', async ({ page }) => {
    await liveWith(page, { skipsPerTurn: 2 })
    const theFirst = (await currentTurn(page)).word.word
    await expect(page.getByRole('button', { name: /^Skip 2/ })).toBeEnabled()
    await page.keyboard.press('s')
    await expect(page.getByRole('button', { name: /^Skip 1/ })).toBeEnabled()
    let theTurn = await currentTurn(page)
    expect(theTurn.skipsUsed).toBe(1)
    expect(theTurn.word.word).not.toBe(theFirst)
    await page.getByRole('button', { name: /^Skip 1/ }).click()
    await expect(page.getByRole('button', { name: /^Skip 0/ })).toBeDisabled()
    theTurn = await currentTurn(page)
    expect(theTurn.skipsUsed).toBe(2)
    const theWord = theTurn.word.word
    await page.keyboard.press('s')
    await page.waitForTimeout(300)
    const theGame = await readGame(page)
    expect(theGame.turn?.word.word).toBe(theWord)
    expect(theGame.turn?.skipsUsed).toBe(2)
    expect(theGame.history.length).toBe(2)
    expect(theGame.history[0]).toMatchObject({ outcome: 'skip', word: theFirst, points: 0 })
    expect(theGame.turn?.end).toBeNull()
  })

  test('Pause and Resume via Space and the button freeze the clock', async ({ page }) => {
    await liveWith(page, {})
    await page.waitForTimeout(1200)
    await page.keyboard.press('Space')
    await expect(page.getByRole('status').filter({ hasText: /^Paused$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Resume/ })).toBeVisible()
    const thePausedAt = (await currentTurn(page)).pausedAt
    expect(thePausedAt).not.toBeNull()
    const theLabel = await timerRing(page).getAttribute('aria-label')
    await page.waitForTimeout(2000)
    expect(await timerRing(page).getAttribute('aria-label')).toBe(theLabel)
    expect((await currentTurn(page)).pausedAt).toBe(thePausedAt)
    const theStartedBefore = (await currentTurn(page)).startedAt
    await page.keyboard.press('Space')
    await expect(page.getByRole('button', { name: /^Pause/ })).toBeVisible()
    const theResumed = await currentTurn(page)
    expect(theResumed.pausedAt).toBeNull()
    expect(theResumed.startedAt - theStartedBefore).toBeGreaterThanOrEqual(2000)

    await page.getByRole('button', { name: /^Pause/ }).click()
    await expect(page.getByRole('button', { name: /^Resume/ })).toBeVisible()
    const theSeconds = await timerSeconds(page)
    await page.waitForTimeout(1500)
    expect(await timerSeconds(page)).toBe(theSeconds)
    await page.getByRole('button', { name: /^Resume/ }).click()
    await expect(page.getByRole('button', { name: /^Pause/ })).toBeVisible()
    expect((await currentTurn(page)).pausedAt).toBeNull()
    await expect.poll(() => timerSeconds(page), { timeout: 3000 }).toBeLessThan(theSeconds)
  })

  test('End turn via Esc and the button records an early end', async ({ page }) => {
    await liveWith(page, { autoAdvance: false })
    await page.keyboard.press('Escape')
    await expect(page.getByText('Turn over')).toBeVisible()
    let theGame = await readGame(page)
    expect(theGame.turn?.end?.outcome).toBe('ended')
    expect(theGame.history[0]).toMatchObject({ outcome: 'timeup', note: 'Ended early', points: 0 })
    await page.keyboard.press('n')
    await waitForPhase(page, 'teamup')
    await startTurnWithSpace(page)
    await page.getByRole('button', { name: /^End turn/ }).click()
    await expect(page.getByText('Turn over')).toBeVisible()
    theGame = await readGame(page)
    expect(theGame.history.length).toBe(2)
    expect(theGame.history[1]).toMatchObject({ outcome: 'timeup', note: 'Ended early', teamId: teamId(1) })
  })

  test('Undo via U and the button returns to the paused moment with the previous word', async ({ page }) => {
    await liveWith(page, { skipsPerTurn: 3, autoAdvance: false })
    const theFirst = (await currentTurn(page)).word.word
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readGame(page)).history.length).toBe(1)
    await page.waitForTimeout(1500)
    await page.keyboard.press('u')
    await expect(liveWord(page)).toHaveText(theFirst)
    let theGame = await readGame(page)
    expect(theGame.history).toEqual([])
    expect(theGame.turn?.pausedAt).not.toBeNull()
    // The paused moment is the Correct press, not the Undo press 1.5 s later.
    const theRemainingMs = (theGame.turn?.startedAt ?? 0) + 120_000 - (theGame.turn?.pausedAt ?? 0)
    expect(theRemainingMs).toBeGreaterThan(118_000)
    await expect(page.getByRole('status').filter({ hasText: /^Paused$/ })).toBeVisible()

    await page.keyboard.press('Space')
    await page.keyboard.press('s')
    await expect.poll(async () => (await readGame(page)).history.length).toBe(1)
    await page.getByRole('button', { name: /^Undo/ }).click()
    await expect(liveWord(page)).toHaveText(theFirst)
    theGame = await readGame(page)
    expect(theGame.history).toEqual([])
    expect(theGame.turn?.skipsUsed).toBe(0)
    expect(theGame.turn?.pausedAt).not.toBeNull()

    await page.keyboard.press('Space')
    await page.keyboard.press('Escape')
    const theBanner = page.locator('section[aria-label="Live turn"] > [role="status"]')
    await expect(theBanner).toContainText('Turn over')
    await theBanner.getByRole('button', { name: /^Undo/ }).click()
    await expect(page.getByText('Turn over')).toHaveCount(0)
    theGame = await readGame(page)
    expect(theGame.turn?.end).toBeNull()
    expect(theGame.turn?.pausedAt).not.toBeNull()
    expect(theGame.history).toEqual([])
    await expect(liveWord(page)).toHaveText(theFirst)
  })

  test('Swap guesser via G and the button pauses, picks, resumes, and credits the new guesser', async ({ page }) => {
    await liveWith(page, {})
    await page.keyboard.press('g')
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByText('Paused, swapping guesser')).toBeVisible()
    let theTurn = await currentTurn(page)
    expect(theTurn.swapOpen).toBe(true)
    expect(theTurn.pausedAt).not.toBeNull()
    await dialog(page).getByRole('button', { name: /^Ben/ }).click()
    await expect(dialog(page)).toHaveCount(0)
    theTurn = await currentTurn(page)
    expect(theTurn).toMatchObject({ guesser: 'Ben', guesserId: playerId(0, 1), swappedFrom: ['Ana'], swapOpen: false, pausedAt: null })
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readGame(page)).history.length).toBe(1)
    expect((await readGame(page)).history[0]).toMatchObject({ outcome: 'correct', guesser: 'Ben', guesserId: playerId(0, 1), swappedFrom: ['Ana'] })

    await page.getByRole('button', { name: /^Swap/ }).click()
    await expect(dialog(page)).toBeVisible()
    await dialog(page).getByRole('button', { name: /^Cal/ }).click()
    await expect(dialog(page)).toHaveCount(0)
    theTurn = await currentTurn(page)
    expect(theTurn).toMatchObject({ guesser: 'Cal', swappedFrom: ['Ana', 'Ben'], pausedAt: null })
    const theLog = (await readGame(page)).turnsLog
    expect(theLog.length).toBe(3)
    await expect(page.getByText('Cal', { exact: true })).toBeVisible()
  })

  test('+, = and - keys nudge the current team score', async ({ page }) => {
    await liveWith(page, {})
    await page.keyboard.press('+')
    await page.keyboard.press('=')
    await page.keyboard.press('-')
    await expect.poll(async () => (await readGame(page)).history.length).toBe(3)
    const theHistory = (await readGame(page)).history
    const thePoints: number[] = []
    for (let n = 0; n < theHistory.length; n++) {
      expect(theHistory[n].outcome).toBe('adjust')
      expect(theHistory[n].teamId).toBe(teamId(0))
      thePoints.push(theHistory[n].points)
    }
    expect(thePoints).toEqual([1, 1, -1])
    expect((await currentTurn(page)).end).toBeNull()
  })

  test('End game: cancel resumes the clock, confirm opens the podium', async ({ page }) => {
    await liveWith(page, {})
    await page.getByRole('button', { name: 'End game' }).click()
    await expect(dialog(page)).toContainText('End the game now?')
    expect((await currentTurn(page)).pausedAt).not.toBeNull()
    await dialog(page).getByRole('button', { name: /^Keep playing/ }).click()
    await expect(dialog(page)).toHaveCount(0)
    expect((await currentTurn(page)).pausedAt).toBeNull()
    await expect.poll(async () => (await readGame(page)).phase).toBe('live')

    // A clock the teacher paused stays paused after backing out.
    await page.keyboard.press('Space')
    await page.getByRole('button', { name: 'End game' }).click()
    await dialog(page).getByRole('button', { name: /^Keep playing/ }).click()
    await expect(dialog(page)).toHaveCount(0)
    expect((await currentTurn(page)).pausedAt).not.toBeNull()

    await page.getByRole('button', { name: 'End game' }).click()
    await dialog(page).getByRole('button', { name: 'End game' }).click()
    await waitForPhase(page, 'podium')
    await expect(page).toHaveURL(/#\/podium/)
  })

  test('Show word button reveals the word when reveal on time up is off', async ({ page }) => {
    await liveWith(page, { revealOnTimeUp: false, autoAdvance: false })
    const theWord = (await currentTurn(page)).word.word
    await page.keyboard.press('Escape')
    const theBanner = page.locator('section[aria-label="Live turn"] > [role="status"]')
    await expect(theBanner).toContainText('Turn over')
    await expect(theBanner.getByText(theWord, { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: /^Show word/ }).click()
    await expect(theBanner.getByText(theWord, { exact: true })).toBeVisible()
  })

  test('one word per turn ends the turn on Correct and hands off', async ({ page }) => {
    await liveWith(page, { multiWord: false, handoffSeconds: 30 })
    const theWord = (await currentTurn(page)).word.word
    await page.keyboard.press('Enter')
    const theBanner = page.locator('section[aria-label="Live turn"] > [role="status"]')
    await expect(theBanner).toContainText('Correct')
    await expect(theBanner.getByText(theWord, { exact: true })).toBeVisible()
    const theTurn = await currentTurn(page)
    expect(theTurn.end?.outcome).toBe('correct')
    // A second Enter on the banner does not score again.
    await page.keyboard.press('Enter')
    await waitForPhase(page, 'teamup')
    const theGame = await readGame(page)
    expect(theGame.history.length).toBe(1)
    expect(theGame.currentTeamIndex).toBe(1)
  })

  test('N does nothing mid-turn and advances after the turn with auto hand-off off', async ({ page }) => {
    await liveWith(page, { autoAdvance: false })
    await page.keyboard.press('n')
    await page.waitForTimeout(300)
    expect((await readGame(page)).phase).toBe('live')
    expect((await currentTurn(page)).end).toBeNull()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: /^Next team/ })).toBeVisible()
    await page.keyboard.press('n')
    await waitForPhase(page, 'teamup')
    const theGame = await readGame(page)
    expect(theGame.currentTeamIndex).toBe(1)
    expect(theGame.handoffEndsAt).toBeNull()
    await expect(page.getByText('Starts in')).toHaveCount(0)
  })

  test('timer ring turns amber at 10 s and red at 5 s', async ({ page }) => {
    test.setTimeout(60_000)
    await liveWith(page, { turnSeconds: 15, autoAdvance: false })
    const theSamples = await page.evaluate(async () => {
      const theOut: { seconds: number; stroke: string; pulse: boolean; digits: string }[] = []
      const theEnd = Date.now() + 15_500
      while (Date.now() < theEnd) {
        const theRing = document.querySelector('[role="timer"]')
        if (theRing !== null) {
          const theCircles = theRing.querySelectorAll('circle')
          const theLabel = theRing.getAttribute('aria-label') ?? ''
          theOut.push({
            seconds: Number(theLabel.split(' ')[0]),
            stroke: theCircles[1].getAttribute('stroke') ?? '',
            pulse: theRing.className.indexOf('animate-pulse-red') !== -1,
            digits: (theRing.querySelector('span')?.getAttribute('style') ?? '') + '|' + (theRing.querySelector('span')?.textContent ?? ''),
          })
        }
        await new Promise((theResolve) => setTimeout(theResolve, 50))
      }
      return theOut
    })
    const theBySecond = new Map<number, Set<string>>()
    for (let n = 0; n < theSamples.length; n++) {
      const theSet = theBySecond.get(theSamples[n].seconds) ?? new Set<string>()
      theSet.add(theSamples[n].stroke + (theSamples[n].pulse ? ' pulse' : ''))
      theBySecond.set(theSamples[n].seconds, theSet)
    }
    for (const [theSeconds, theStrokes] of theBySecond) {
      let theExpected = 'var(--gold)'
      if (theSeconds <= 10) {
        theExpected = 'var(--warn)'
      }
      if (theSeconds <= 5 && theSeconds > 0) {
        theExpected = 'var(--bad) pulse'
      }
      if (theSeconds === 0) {
        theExpected = 'var(--bad)'
      }
      expect([...theStrokes], 'stroke at ' + String(theSeconds) + ' s').toEqual([theExpected])
    }
    expect(theBySecond.has(11)).toBe(true)
    expect(theBySecond.has(10)).toBe(true)
    expect(theBySecond.has(5)).toBe(true)
  })

  test('career card appears after a correct guess in a class game', async ({ page }) => {
    await seedGame(page, { settings: LONG_TURN, teams: ROSTER, className: 'Period 3' })
    await gotoTeamUp(page)
    expect((await readGame(page)).mode).toBe('class')
    await startTurnWithSpace(page)
    await page.waitForTimeout(700)
    await page.keyboard.press('Enter')
    const theCard = page.getByRole('status').filter({ hasText: /Career:/ })
    await expect(theCard).toBeVisible()
    await expect(theCard).toHaveText(/^Ana, \d+\.\d s\. Career: 1 correct\.$/)
    await expect(theCard).toHaveCount(0, { timeout: 4000 })
  })

  test('no career card in a quick game', async ({ page }) => {
    await liveWith(page, {})
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readGame(page)).history.length).toBe(1)
    await page.waitForTimeout(400)
    await expect(page.getByRole('status').filter({ hasText: /Career:/ })).toHaveCount(0)
  })
})

test.describe('Esc with a dialog open', () => {
  test('closes only the dialog and never ends the turn', async ({ page }) => {
    await liveWith(page, {})
    const theOpeners: Array<{ name: string; open: (thePage: Page) => Promise<void> }> = [
      { name: 'shortcuts', open: (thePage) => thePage.keyboard.press('?') },
      { name: 'clue checker', open: (thePage) => thePage.keyboard.press('c') },
      { name: 'settings drawer', open: (thePage) => thePage.getByRole('button', { name: 'Settings' }).click() },
      { name: 'swap modal', open: (thePage) => thePage.keyboard.press('g') },
      { name: 'end game modal', open: (thePage) => thePage.getByRole('button', { name: 'End game' }).click() },
    ]
    for (let n = 0; n < theOpeners.length; n++) {
      await theOpeners[n].open(page)
      await expect(dialog(page), theOpeners[n].name).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog(page), theOpeners[n].name).toHaveCount(0)
      await page.waitForTimeout(250)
      const theGame = await readGame(page)
      expect(theGame.phase, theOpeners[n].name).toBe('live')
      expect(theGame.turn?.end, theOpeners[n].name).toBeNull()
      expect(theGame.turn?.pausedAt, theOpeners[n].name + ' left the clock running').toBeNull()
      expect(theGame.turn?.swapOpen).toBe(false)
      expect(theGame.history.length).toBe(0)
    }
    await expect(page.getByText('Turn over')).toHaveCount(0)
  })

  test('on Team up, Esc in a dialog neither starts nor skips', async ({ page }) => {
    await seedGame(page, { settings: LONG_TURN, teams: ROSTER })
    await gotoTeamUp(page)
    await page.keyboard.press('?')
    await expect(dialog(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toHaveCount(0)
    const theGame = await readGame(page)
    expect(theGame.phase).toBe('teamup')
    expect(theGame.currentTeamIndex).toBe(0)
  })
})
