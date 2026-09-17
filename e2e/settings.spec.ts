import type { Locator, Page } from '@playwright/test'
import { readStore, waitForPhase } from './helpers'
import {
  expect,
  gotoSetup,
  openSettings,
  setStepper,
  setToggle,
  settingsDrawer,
  settingsOf,
  startGameButton,
  startToLive,
  test,
  waitClockRunning,
  wordIndex,
} from './helpers-setup'

// Labels are matched loosely so copy edits to a row do not hide a broken behavior.
const TURN_LENGTH = /^Turn length$/
const SKIPS = /^Skips per turn$/
const HANDOFF_WAIT = /wait before the next team|hand-off countdown/i
const ROUNDS = /^Rounds per game$/
const POINTS = /^Points per correct guess$/
const KEEP_GUESSING = /keep guessing/i
const AUTO_HANDOFF = /next team automatically|auto hand-off/i
const COUNTDOWN = /3-2-1|countdown before turn/i
const REVEAL = /show the word when time runs out|reveal word/i

type FullTurn = {
  turnId: string
  word: { word: string }
  startedAt: number
  turnMs: number
  end: null | { outcome: string; at: number; word: string }
}
type FullGame = {
  phase: string
  round: number
  usedWords: string[]
  poolWarning: string[]
  handoffEndsAt: number | null
  turn: FullTurn | null
  history: { outcome: string; points: number; secondsLeft: number; at: number; word: string; note: string }[]
  turnsLog: { at: number; turnId: string }[]
}

async function gameOf(thePage: Page): Promise<FullGame> {
  return (await readStore(thePage)).state.game as unknown as FullGame
}

async function configure(thePage: Page, theChange: (theDrawer: Locator) => Promise<void>): Promise<void> {
  const theDrawer = await openSettings(thePage)
  await theChange(theDrawer)
  await theDrawer.getByRole('button', { name: 'Done' }).click()
  await expect(theDrawer).toBeHidden()
}

function radio(theDrawer: Locator, theGroup: string, theOption: string): Locator {
  return theDrawer.getByRole('radiogroup', { name: theGroup }).getByRole('radio', { name: theOption, exact: true })
}

// A long turn with no 3-2-1, so tests can draw many words without racing the clock.
async function fastTurns(theDrawer: Locator): Promise<void> {
  await setStepper(theDrawer, TURN_LENGTH, 120)
  await setToggle(theDrawer, COUNTDOWN, false)
}

async function wordsInPlay(theDrawer: Locator): Promise<number> {
  const theText = (await theDrawer.getByText('words in play').locator('xpath=../..').locator('span').first().textContent()) ?? ''
  return parseInt(theText.replace(/,/g, ''), 10)
}

// Scores Enter repeatedly and returns every word that was shown on screen.
async function drawWords(thePage: Page, theCount: number): Promise<string[]> {
  const theSeen: string[] = []
  for (let n = 0; n < theCount; n++) {
    const theGame = await gameOf(thePage)
    const theWord = theGame.turn?.word.word ?? ''
    theSeen.push(theWord)
    await expect(thePage.getByRole('region', { name: 'Live turn' }).getByText(theWord, { exact: true }).filter({ visible: true })).toBeVisible()
    await thePage.keyboard.press('Enter')
    await expect.poll(async () => (await gameOf(thePage)).history.length).toBe(theGame.history.length + 1)
  }
  return theSeen
}

test.describe('Settings drawer', () => {
  test('opens from the top bar and the summary, closes with Escape, Close, and Done', async ({ page }) => {
    await gotoSetup(page)
    await openSettings(page)
    await page.keyboard.press('Escape')
    await expect(settingsDrawer(page)).toBeHidden()

    await page.getByRole('button', { name: 'Change settings' }).click()
    await expect(settingsDrawer(page)).toBeVisible()
    await settingsDrawer(page).getByRole('button', { name: 'Close' }).click()
    await expect(settingsDrawer(page)).toBeHidden()

    await openSettings(page)
    await settingsDrawer(page).getByRole('button', { name: 'Done' }).click()
    await expect(settingsDrawer(page)).toBeHidden()
    await expect(page).toHaveURL(/#\/$/)

    // Mid-game the drawer keeps the teacher's place and locks the team count.
    await startGameButton(page).click()
    await waitForPhase(page, 'teamup')
    const theDrawer = await openSettings(page)
    await expect(theDrawer.getByText('Locked until the game ends')).toBeVisible()
    await expect(theDrawer.getByRole('group', { name: 'Number of teams' })).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/#\/teamup$/)
    expect((await gameOf(page)).phase).toBe('teamup')
  })

  test('turn length 5 s times out in about 5 s', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setStepper(theDrawer, TURN_LENGTH, 5)
      await expect(theDrawer.getByRole('button', { name: 'Decrease Turn length' })).toBeDisabled()
      await setToggle(theDrawer, COUNTDOWN, false)
    })
    expect((await settingsOf(page)).turnSeconds).toBe(5)
    await expect(page.locator('dl dd').first()).toHaveText('5')
    await startToLive(page)
    const theStart = Date.now()
    await expect.poll(async () => (await gameOf(page)).turn?.end?.outcome ?? null, { timeout: 9_000 }).toBe('timeup')
    const theWall = Date.now() - theStart
    const theGame = await gameOf(page)
    const theTurn = theGame.turn as FullTurn
    expect(theTurn.turnMs).toBe(5000)
    expect((theTurn.end as { at: number }).at - theTurn.startedAt).toBeGreaterThanOrEqual(5000)
    expect((theTurn.end as { at: number }).at - theTurn.startedAt).toBeLessThan(5300)
    expect(theWall).toBeGreaterThan(4000)
    expect(theWall).toBeLessThan(7000)
    await expect(page.getByText("Time's up")).toBeVisible()
  })

  test('1 round with 2 teams ends at the podium', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setStepper(theDrawer, ROUNDS, 1)
      await expect(theDrawer.getByRole('button', { name: 'Decrease Rounds per game' })).toBeDisabled()
      await setToggle(theDrawer, COUNTDOWN, false)
      await setStepper(theDrawer, HANDOFF_WAIT, 0)
    })
    expect((await settingsOf(page)).roundsPerGame).toBe(1)
    await startToLive(page)
    await expect(page.getByText('Round 1 of 1')).toBeVisible()
    await page.keyboard.press('Escape')
    // After the banner the second team starts on its own, since the hand-off wait is 0.
    await expect.poll(async () => (await gameOf(page)).turnsLog.length, { timeout: 8_000 }).toBe(2)
    await waitForPhase(page, 'live')
    await expect(page.getByRole('group', { name: 'Turn controls' })).toBeVisible()
    await waitClockRunning(page)
    await page.keyboard.press('Escape')
    await waitForPhase(page, 'podium', 8_000)
    await expect(page).toHaveURL(/#\/podium$/)
    await expect(page.getByRole('button', { name: /^play again/i })).toBeVisible()
  })

  test('unlimited rounds keeps playing past the round limit', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setStepper(theDrawer, ROUNDS, 1)
      await setToggle(theDrawer, /^Unlimited rounds$/, true)
      await expect(theDrawer.getByText('No limit')).toBeVisible()
      await expect(theDrawer.getByRole('group', { name: 'Rounds per game' })).toHaveCount(0)
      await setToggle(theDrawer, COUNTDOWN, false)
      await setStepper(theDrawer, HANDOFF_WAIT, 0)
    })
    expect((await settingsOf(page)).roundsPerGame).toBe(0)
    await expect(page.locator('dl dd').nth(1)).toHaveText('No limit')
    await startToLive(page)
    await page.keyboard.press('Escape')
    await expect.poll(async () => (await gameOf(page)).turnsLog.length, { timeout: 8_000 }).toBe(2)
    await waitForPhase(page, 'live')
    await waitClockRunning(page)
    await page.keyboard.press('Escape')
    await expect.poll(async () => (await gameOf(page)).round, { timeout: 8_000 }).toBe(2)
    expect((await gameOf(page)).phase).not.toBe('podium')
    await expect(page.getByText(/^Round 2$/)).toBeVisible()

    // Turning unlimited off restores the default round count.
    await configure(page, async (theDrawer) => {
      await setToggle(theDrawer, /^Unlimited rounds$/, false)
    })
    expect((await settingsOf(page)).roundsPerGame).toBe(5)
  })

  test('1 syllable only ever draws 1-syllable words', async ({ page }) => {
    await gotoSetup(page)
    let theBefore = 0
    let theAfter = 0
    await configure(page, async (theDrawer) => {
      await fastTurns(theDrawer)
      theBefore = await wordsInPlay(theDrawer)
      await radio(theDrawer, 'Syllables', '1').click()
      await expect(radio(theDrawer, 'Syllables', '1')).toHaveAttribute('aria-checked', 'true')
      await expect.poll(async () => wordsInPlay(theDrawer)).toBeLessThan(theBefore)
      theAfter = await wordsInPlay(theDrawer)
    })
    expect((await settingsOf(page)).syllables).toBe('1')
    let theExpected = 0
    for (const theEntry of wordIndex().values()) {
      if (theEntry.syllables === 1) {
        theExpected = theExpected + 1
      }
    }
    expect(theAfter).toBe(theExpected)
    await startToLive(page)
    const theWords = await drawWords(page, 15)
    expect(theWords).toHaveLength(15)
    expect(new Set(theWords).size).toBe(15)
    for (const theWord of theWords) {
      expect(wordIndex().get(theWord)?.syllables, theWord).toBe(1)
    }
  })

  test('custom syllable range draws only words inside it', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await fastTurns(theDrawer)
      await radio(theDrawer, 'Syllables', 'Custom').click()
      await setStepper(theDrawer, 'Fewest syllables', 2)
      await setStepper(theDrawer, 'Most syllables', 3)
      await expect(theDrawer.getByRole('button', { name: 'Decrease Most syllables' })).toBeEnabled()
      await expect(theDrawer.getByRole('button', { name: 'Increase Fewest syllables' })).toBeEnabled()
    })
    const theSettings = await settingsOf(page)
    expect([theSettings.syllables, theSettings.syllableMin, theSettings.syllableMax]).toEqual(['custom', 2, 3])
    await expect(page.getByText(/2 to 3 syllables/)).toBeVisible()
    await startToLive(page)
    for (const theWord of await drawWords(page, 10)) {
      const theSyllables = wordIndex().get(theWord)?.syllables ?? 0
      expect(theSyllables, theWord).toBeGreaterThanOrEqual(2)
      expect(theSyllables, theWord).toBeLessThanOrEqual(3)
    }
  })

  test('word length min and max limit the letters', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await fastTurns(theDrawer)
      const theBefore = await wordsInPlay(theDrawer)
      await radio(theDrawer, 'Word length', 'Letter range').click()
      await expect(theDrawer.getByRole('group', { name: 'Fewest letters' }).locator('output')).toHaveText('3')
      await expect(theDrawer.getByRole('group', { name: 'Most letters' }).locator('output')).toHaveText('8')
      await setStepper(theDrawer, 'Fewest letters', 4)
      await setStepper(theDrawer, 'Most letters', 5)
      // Min cannot pass max.
      await setStepper(theDrawer, 'Fewest letters', 5)
      await expect(theDrawer.getByRole('button', { name: 'Increase Fewest letters' })).toBeDisabled()
      await setStepper(theDrawer, 'Fewest letters', 4)
      await expect.poll(async () => wordsInPlay(theDrawer)).toBeLessThan(theBefore)
    })
    const theSettings = await settingsOf(page)
    expect([theSettings.lengthMin, theSettings.lengthMax]).toEqual([4, 5])
    await startToLive(page)
    for (const theWord of await drawWords(page, 10)) {
      expect(theWord.length, theWord).toBeGreaterThanOrEqual(4)
      expect(theWord.length, theWord).toBeLessThanOrEqual(5)
    }
    // Any restores the full range.
    await configure(page, async (theDrawer) => {
      await radio(theDrawer, 'Word length', 'Any').click()
    })
    const theReset = await settingsOf(page)
    expect([theReset.lengthMin, theReset.lengthMax]).toEqual([0, 0])
  })

  test('difficulty easy draws only easy words', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await fastTurns(theDrawer)
      const theBefore = await wordsInPlay(theDrawer)
      await radio(theDrawer, 'Difficulty', 'Easy').click()
      await expect.poll(async () => wordsInPlay(theDrawer)).toBeLessThan(theBefore)
    })
    expect((await settingsOf(page)).difficulty).toBe('easy')
    await expect(page.getByText(/^Easy words/)).toBeVisible()
    await startToLive(page)
    for (const theWord of await drawWords(page, 10)) {
      expect(wordIndex().get(theWord)?.tier, theWord).toBe('easy')
    }
  })

  test('one category draws from it and the last category cannot be cleared', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await fastTurns(theDrawer)
      const theChip = (theName: string) => theDrawer.getByRole('button', { name: theName, exact: true })
      await theDrawer.getByRole('button', { name: 'Clear', exact: true }).click()
      await expect(theChip('Animals')).toHaveAttribute('aria-pressed', 'true')
      await expect(theChip('Food')).toHaveAttribute('aria-pressed', 'false')
      await expect(theDrawer.getByRole('button', { name: 'Clear', exact: true })).toBeDisabled()
      await expect(theDrawer.getByText('At least one category stays on.')).toBeVisible()
      // The last chip refuses to switch off.
      await theChip('Animals').click()
      await expect(theChip('Animals')).toHaveAttribute('aria-pressed', 'true')
      await theChip('Food').click()
      await theChip('Animals').click()
      await expect(theChip('Animals')).toHaveAttribute('aria-pressed', 'false')
      await expect(theChip('Food')).toHaveAttribute('aria-pressed', 'true')
      await theChip('Food').click()
      await expect(theChip('Food')).toHaveAttribute('aria-pressed', 'true')
    })
    expect((await settingsOf(page)).categories).toEqual(['food'])
    await expect(page.getByText(/Food only/)).toBeVisible()
    await startToLive(page)
    for (const theWord of await drawWords(page, 10)) {
      expect(wordIndex().get(theWord)?.category, theWord).toBe('food')
    }
    await configure(page, async (theDrawer) => {
      await theDrawer.getByRole('button', { name: 'Select all' }).click()
      await expect(theDrawer.getByRole('button', { name: 'Select all' })).toBeDisabled()
    })
    expect((await settingsOf(page)).categories).toHaveLength(10)
  })

  test('skips per turn 0 disables skip', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setStepper(theDrawer, SKIPS, 0)
      await expect(theDrawer.getByRole('button', { name: 'Decrease Skips per turn' })).toBeDisabled()
      await setToggle(theDrawer, COUNTDOWN, false)
    })
    expect((await settingsOf(page)).skipsPerTurn).toBe(0)
    await startToLive(page)
    await waitClockRunning(page)
    await expect(page.getByRole('button', { name: /^Skip 0/ })).toBeDisabled()
    const theWord = (await gameOf(page)).turn?.word.word
    await page.keyboard.press('s')
    await page.waitForTimeout(400)
    const theGame = await gameOf(page)
    expect(theGame.history).toHaveLength(0)
    expect(theGame.turn?.word.word).toBe(theWord)
  })

  test('skips per turn 2 allows exactly two skips', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setStepper(theDrawer, SKIPS, 2)
      await fastTurns(theDrawer)
    })
    await startToLive(page)
    await expect(page.getByRole('button', { name: /^Skip 2/ })).toBeEnabled()
    await page.keyboard.press('s')
    await expect(page.getByRole('button', { name: /^Skip 1/ })).toBeEnabled()
    await page.keyboard.press('s')
    await expect(page.getByRole('button', { name: /^Skip 0/ })).toBeDisabled()
    await page.keyboard.press('s')
    await page.waitForTimeout(300)
    const theGame = await gameOf(page)
    expect(theGame.history.filter((r) => r.outcome === 'skip')).toHaveLength(2)
  })

  test('points per correct and time bonus score a guess', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setStepper(theDrawer, POINTS, 3)
      await setToggle(theDrawer, /^Time bonus/, true)
      await setToggle(theDrawer, COUNTDOWN, false)
    })
    const theSettings = await settingsOf(page)
    expect([theSettings.pointsPerCorrect, theSettings.timeBonus]).toEqual([3, true])
    await startToLive(page)
    await waitClockRunning(page)
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await gameOf(page)).history.length).toBe(1)
    const theRow = (await gameOf(page)).history[0]
    expect(theRow.outcome).toBe('correct')
    expect(theRow.secondsLeft).toBeGreaterThanOrEqual(15)
    expect(theRow.points).toBe(3 + Math.floor(theRow.secondsLeft / 5))
    expect(theRow.points).toBeGreaterThanOrEqual(6)
  })

  test('points per correct without time bonus gives the flat value', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setStepper(theDrawer, POINTS, 10)
      await expect(theDrawer.getByRole('button', { name: 'Increase Points per correct guess' })).toBeDisabled()
      await setToggle(theDrawer, COUNTDOWN, false)
    })
    await startToLive(page)
    await waitClockRunning(page)
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await gameOf(page)).history.length).toBe(1)
    expect((await gameOf(page)).history[0].points).toBe(10)
  })

  test('countdown on waits 3 s, countdown off starts the clock immediately', async ({ page }) => {
    await gotoSetup(page)
    await startToLive(page)
    let theGame = await gameOf(page)
    expect((theGame.turn as FullTurn).startedAt - theGame.turnsLog[0].at).toBe(3000)
    await expect(page.getByRole('button', { name: /^Correct/ })).toBeDisabled()

    // A fresh game with countdown off.
    await page.getByRole('button', { name: 'End game', exact: true }).first().click()
    await page.getByRole('dialog', { name: 'End the game now?' }).getByRole('button', { name: 'End game' }).click()
    await waitForPhase(page, 'podium')
    await page.getByRole('link', { name: 'Setup' }).click()
    await expect(startGameButton(page)).toBeVisible()
    await configure(page, async (theDrawer) => {
      await setToggle(theDrawer, COUNTDOWN, false)
    })
    expect((await settingsOf(page)).countdown).toBe(false)
    await startToLive(page)
    theGame = await gameOf(page)
    expect((theGame.turn as FullTurn).startedAt - theGame.turnsLog[theGame.turnsLog.length - 1].at).toBe(0)
    await expect(page.getByRole('button', { name: /^Correct/ })).toBeEnabled()
  })

  test('keep guessing off ends the turn on a correct guess', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setToggle(theDrawer, KEEP_GUESSING, false)
      await fastTurns(theDrawer)
    })
    expect((await settingsOf(page)).multiWord).toBe(false)
    await startToLive(page)
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await gameOf(page)).turn?.end?.outcome ?? null).toBe('correct')
    await expect(page.getByRole('status').getByText('Correct', { exact: true })).toBeVisible()
    expect((await gameOf(page)).history).toHaveLength(1)
  })

  test('keep guessing on draws a new word after a correct guess', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await fastTurns(theDrawer)
    })
    await startToLive(page)
    const theFirst = (await gameOf(page)).turn?.word.word
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await gameOf(page)).history.length).toBe(1)
    const theGame = await gameOf(page)
    expect(theGame.turn?.end).toBeNull()
    expect(theGame.turn?.word.word).not.toBe(theFirst)
  })

  test('auto hand-off off waits for N', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setToggle(theDrawer, AUTO_HANDOFF, false)
      await expect(theDrawer.getByRole('group', { name: HANDOFF_WAIT })).toHaveCount(0)
      await fastTurns(theDrawer)
    })
    expect((await settingsOf(page)).autoAdvance).toBe(false)
    await startToLive(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: /^Next team/ })).toBeVisible()
    await page.waitForTimeout(2800)
    expect((await gameOf(page)).phase).toBe('live')
    await page.keyboard.press('n')
    await waitForPhase(page, 'teamup')
    await expect(page.getByRole('button', { name: /^Start turn/ })).toBeVisible()
    expect((await gameOf(page)).handoffEndsAt).toBeNull()
    await page.waitForTimeout(1500)
    expect((await gameOf(page)).phase).toBe('teamup')
    await page.keyboard.press('Space')
    await waitForPhase(page, 'live')
  })

  test('hand-off seconds sets the wait before the next team starts', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setStepper(theDrawer, HANDOFF_WAIT, 2)
      await fastTurns(theDrawer)
    })
    expect((await settingsOf(page)).handoffSeconds).toBe(2)
    await startToLive(page)
    await page.keyboard.press('Escape')
    await waitForPhase(page, 'teamup', 6_000)
    const theTeamUp = await gameOf(page)
    const theEndedAt = theTeamUp.history[0].at
    expect(theTeamUp.handoffEndsAt).not.toBeNull()
    // Banner 2 s, then the 2 s hand-off.
    expect((theTeamUp.handoffEndsAt as number) - theEndedAt).toBeGreaterThanOrEqual(4000)
    expect((theTeamUp.handoffEndsAt as number) - theEndedAt).toBeLessThan(4400)
    await waitForPhase(page, 'live', 5_000)
    const theLive = await gameOf(page)
    const theStartAt = theLive.turnsLog[1].at
    expect(theStartAt - (theTeamUp.handoffEndsAt as number)).toBeGreaterThanOrEqual(0)
    expect(theStartAt - (theTeamUp.handoffEndsAt as number)).toBeLessThan(400)
  })

  test('reveal on time up off hides the word until Show word', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setToggle(theDrawer, REVEAL, false)
      await setToggle(theDrawer, AUTO_HANDOFF, false)
      await setStepper(theDrawer, TURN_LENGTH, 5)
      await setToggle(theDrawer, COUNTDOWN, false)
    })
    expect((await settingsOf(page)).revealOnTimeUp).toBe(false)
    await startToLive(page)
    const theWord = (await gameOf(page)).turn?.word.word ?? ''
    await expect.poll(async () => (await gameOf(page)).turn?.end?.outcome ?? null, { timeout: 9_000 }).toBe('timeup')
    const theBanner = page.getByRole('status').filter({ hasText: "Time's up" })
    await expect(theBanner).toBeVisible()
    await expect(theBanner.getByText(theWord, { exact: true })).toHaveCount(0)
    await theBanner.getByRole('button', { name: /^Show word/ }).click()
    await expect(theBanner.getByText(theWord, { exact: true })).toBeVisible()
  })

  test('reveal on time up on shows the word', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setToggle(theDrawer, AUTO_HANDOFF, false)
      await setStepper(theDrawer, TURN_LENGTH, 5)
      await setToggle(theDrawer, COUNTDOWN, false)
    })
    await startToLive(page)
    const theWord = (await gameOf(page)).turn?.word.word ?? ''
    await expect.poll(async () => (await gameOf(page)).turn?.end?.outcome ?? null, { timeout: 9_000 }).toBe('timeup')
    const theBanner = page.getByRole('status').filter({ hasText: "Time's up" })
    await expect(theBanner.getByText(theWord, { exact: true })).toBeVisible()
    await expect(theBanner.getByRole('button', { name: /^Show word/ })).toHaveCount(0)
  })

  test('custom words in replace mode only draw those words and warn about the pool', async ({ page }) => {
    const theCustom = ['zorbix', 'quendle', 'flumph']
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await fastTurns(theDrawer)
      await setToggle(theDrawer, AUTO_HANDOFF, false)
      await theDrawer.getByRole('textbox', { name: 'Custom word list' }).fill(theCustom.join('\n') + '\nZorbix\n')
      await expect(theDrawer.getByText('3 words', { exact: true })).toBeVisible()
      // Add mode keeps the built-in list.
      expect(await wordsInPlay(theDrawer)).toBeGreaterThan(1000)
      await radio(theDrawer, 'Custom word mode', 'Replace built-in list').click()
      await expect.poll(async () => wordsInPlay(theDrawer)).toBe(3)
      await expect(theDrawer.getByText('of 3', { exact: true })).toBeVisible()
      await expect(theDrawer.getByText(/Under 10 exact matches/)).toBeVisible()
    })
    const theSettings = await settingsOf(page)
    expect(theSettings.customWordMode).toBe('replace')
    expect(String(theSettings.customWords)).toContain('quendle')
    await expect(page.getByText(/Your words only/)).toBeVisible()
    await startToLive(page)
    const theWords = await drawWords(page, 5)
    for (const theWord of theWords) {
      expect(theCustom, theWord).toContain(theWord)
    }
    // The first three draws use each word once before the list restarts.
    expect(new Set(theWords.slice(0, 3)).size).toBe(3)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: /^Next team/ })).toBeVisible()
    await page.keyboard.press('n')
    await waitForPhase(page, 'teamup')
    expect((await gameOf(page)).poolWarning.length).toBeGreaterThan(0)
    await expect(page.getByText(/Word pool ran low/)).toBeVisible()
  })

  test('custom banned clue appears in the clue checker verdict', async ({ page }) => {
    await gotoSetup(page)
    await expect(startGameButton(page)).toBeVisible()
    await page.keyboard.press('c')
    const theChecker = page.getByRole('dialog', { name: 'Clue checker' })
    await expect(theChecker).toBeVisible()
    await theChecker.getByRole('textbox', { name: /^Word/ }).fill('cat')
    await theChecker.getByRole('textbox', { name: 'Clue someone said' }).fill('kitty')
    await expect(theChecker.getByText('Allowed', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(theChecker).toBeHidden()

    await configure(page, async (theDrawer) => {
      await theDrawer.getByRole('textbox', { name: 'Custom banned clues' }).fill('Kitty\nfeline')
    })
    expect((await settingsOf(page)).customBanned).toBe('Kitty\nfeline')
    await page.keyboard.press('c')
    await expect(theChecker).toBeVisible()
    await theChecker.getByRole('textbox', { name: /^Word/ }).fill('cat')
    await theChecker.getByRole('textbox', { name: 'Clue someone said' }).fill('kitty')
    await expect(theChecker.getByText('Not allowed', { exact: true })).toBeVisible()
    await expect(theChecker.getByText('"kitty" is on the class banned list.')).toBeVisible()
    await theChecker.getByRole('textbox', { name: 'Clue someone said' }).fill('meow')
    await expect(theChecker.getByText('Allowed', { exact: true })).toBeVisible()
  })

  test('theme light sets data-theme and changes the background', async ({ page }) => {
    await gotoSetup(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const theDarkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    await configure(page, async (theDrawer) => {
      await radio(theDrawer, 'Theme', 'Light').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    })
    expect((await settingsOf(page)).theme).toBe('light')
    const theLightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(theLightBg).not.toBe(theDarkBg)
    await page.reload()
    await expect(startGameButton(page)).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await configure(page, async (theDrawer) => {
      await radio(theDrawer, 'Theme', 'Dark').click()
    })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('sound toggle updates the setting and the top bar mute button', async ({ page }) => {
    await gotoSetup(page)
    await expect(page.getByRole('button', { name: 'Mute sound (M)' })).toBeVisible()
    await configure(page, async (theDrawer) => {
      await setToggle(theDrawer, /^Sound$/, false)
    })
    expect((await settingsOf(page)).sound).toBe(false)
    await expect(page.getByRole('button', { name: 'Turn sound on (M)' })).toBeVisible()
    await page.keyboard.press('m')
    await expect(page.getByRole('button', { name: 'Mute sound (M)' })).toBeVisible()
    expect((await settingsOf(page)).sound).toBe(true)
    const theDrawer = await openSettings(page)
    await expect(theDrawer.getByRole('switch', { name: /^Sound$/ })).toHaveAttribute('aria-checked', 'true')
  })

  test('Reset to defaults restores every changed setting', async ({ page }) => {
    await gotoSetup(page)
    const theDrawer = await openSettings(page)
    await setStepper(theDrawer, TURN_LENGTH, 60)
    await setStepper(theDrawer, SKIPS, 3)
    await setToggle(theDrawer, KEEP_GUESSING, false)
    await setToggle(theDrawer, COUNTDOWN, false)
    await setStepper(theDrawer, ROUNDS, 9)
    await setStepper(theDrawer, POINTS, 4)
    await radio(theDrawer, 'Syllables', '2').click()
    await radio(theDrawer, 'Difficulty', 'Hard').click()
    await theDrawer.getByRole('textbox', { name: 'Custom word list' }).fill('zorbix')
    await setToggle(theDrawer, /^Sound$/, false)
    await expect.poll(async () => (await settingsOf(page)).sound).toBe(false)

    await theDrawer.getByRole('button', { name: 'Reset to defaults' }).click()
    await expect(theDrawer.getByRole('group', { name: TURN_LENGTH }).locator('output')).toHaveText('20 s')
    const theSettings = await settingsOf(page)
    expect(theSettings).toMatchObject({
      turnSeconds: 20,
      roundsPerGame: 5,
      syllables: 'any',
      lengthMin: 0,
      lengthMax: 0,
      difficulty: 'mixed',
      skipsPerTurn: 1,
      pointsPerCorrect: 1,
      timeBonus: false,
      countdown: true,
      sound: true,
      revealOnTimeUp: true,
      multiWord: true,
      autoAdvance: true,
      handoffSeconds: 5,
      customWords: '',
      customWordMode: 'add',
      customBanned: '',
      teamCount: 2,
    })
    expect(theSettings.categories).toHaveLength(10)
    await expect(theDrawer.getByRole('switch', { name: COUNTDOWN })).toHaveAttribute('aria-checked', 'true')
    await expect(radio(theDrawer, 'Difficulty', 'All')).toHaveAttribute('aria-checked', 'true')
  })

  test('settings survive a reload', async ({ page }) => {
    await gotoSetup(page)
    await configure(page, async (theDrawer) => {
      await setStepper(theDrawer, TURN_LENGTH, 35)
      await setToggle(theDrawer, REVEAL, false)
      await setToggle(theDrawer, AUTO_HANDOFF, false)
      await radio(theDrawer, 'Syllables', '3').click()
      await theDrawer.getByRole('textbox', { name: 'Custom banned clues' }).fill('kitty')
    })
    await page.reload()
    await expect(startGameButton(page)).toBeVisible()
    const theDrawer = await openSettings(page)
    await expect(theDrawer.getByRole('group', { name: TURN_LENGTH }).locator('output')).toHaveText('35 s')
    await expect(theDrawer.getByRole('switch', { name: REVEAL })).toHaveAttribute('aria-checked', 'false')
    await expect(theDrawer.getByRole('switch', { name: AUTO_HANDOFF })).toHaveAttribute('aria-checked', 'false')
    await expect(radio(theDrawer, 'Syllables', '3')).toHaveAttribute('aria-checked', 'true')
    await expect(theDrawer.getByRole('textbox', { name: 'Custom banned clues' })).toHaveValue('kitty')
  })
})
