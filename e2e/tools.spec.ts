import { expect, test, type Page } from '@playwright/test'
import { collectConsoleErrors, readStore, seedSettings, startQuickGameToLive, waitForClockRunning, waitForPhase } from './helpers'
import { goLiveFromTeamUp, startGameWithPlayers } from './helpers-visual'

type Verdict = { word: string; clue: string; allowed: boolean }

// Store fields the shared helper type does not list yet.
type GameExtras = { game: { handoffHeld: boolean; turn: null | { swapOpen: boolean } } }

async function readExtras(thePage: Page): Promise<GameExtras> {
  return (await readStore(thePage)).state as unknown as GameExtras
}

const theVerdicts: Verdict[] = [
  { word: 'sunflower', clue: 'sun', allowed: false },
  { word: 'sunflower', clue: 'flower', allowed: false },
  { word: 'banana', clue: 'banana', allowed: false },
  { word: 'banana', clue: 'bananas', allowed: false },
  { word: 'jumped', clue: 'jumping', allowed: false },
  { word: 'run', clue: 'running', allowed: false },
  { word: 'elephant', clue: 'elepant', allowed: false },
  { word: 'bear', clue: 'ear', allowed: false },
  { word: 'banana', clue: 'yellow', allowed: true },
]

async function waitForSetup(thePage: Page) {
  await thePage.goto('/#/')
  await expect(thePage.getByRole('button', { name: /start game/i }).first()).toBeVisible()
}

async function checkVerdict(thePage: Page, theCase: Verdict) {
  const theDialog = thePage.getByRole('dialog', { name: 'Clue checker' })
  await theDialog.getByLabel(/^Word/).fill(theCase.word)
  await theDialog.getByLabel('Clue someone said').fill(theCase.clue)
  if (theCase.allowed) {
    await expect(theDialog.getByText('Allowed', { exact: true })).toBeVisible()
    await expect(theDialog.getByText(theCase.clue + ' for ' + theCase.word)).toBeVisible()
    return
  }
  await expect(theDialog.getByText('Not allowed', { exact: true })).toBeVisible()
  await expect(theDialog.getByText(theCase.clue + ' for ' + theCase.word)).toBeVisible()
  // The verdict list sits right after the red band; each line has a rule number and a reason sentence.
  const theReasons = theDialog.locator('div[aria-live="polite"] > ol > li')
  expect(await theReasons.count()).toBeGreaterThan(0)
  const theFirst = (await theReasons.first().innerText()).trim()
  expect(theFirst.length).toBeGreaterThan(8)
}

test.describe('clue checker', () => {
  test('C opens it outside a game and every verdict gives a reason', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await waitForSetup(page)
    await page.keyboard.press('c')
    const theDialog = page.getByRole('dialog', { name: 'Clue checker' })
    await expect(theDialog).toBeVisible()
    await expect(theDialog.getByText('Enter a word and a clue')).toBeVisible()
    for (let n = 0; n < theVerdicts.length; n++) {
      await checkVerdict(page, theVerdicts[n])
    }
    await page.keyboard.press('Escape')
    await expect(theDialog).toBeHidden()
    await expect(page).toHaveURL(/#\/$/)
    expect(theErrors).toEqual([])
  })

  test('top bar button opens it, including from the More tools menu when narrow', async ({ page }) => {
    await waitForSetup(page)
    const theWidth = page.viewportSize()?.width ?? 1920
    if (theWidth >= 900) {
      await page.getByRole('button', { name: 'Check a clue' }).click()
    } else {
      await page.getByRole('button', { name: 'More tools' }).click()
      await page.getByRole('menuitem', { name: /Check a clue/ }).click()
    }
    await expect(page.getByRole('dialog', { name: 'Clue checker' })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    await page.setViewportSize({ width: 800, height: 600 })
    await expect(page.getByRole('button', { name: 'Check a clue' })).toBeHidden()
    await page.getByRole('button', { name: 'More tools' }).click()
    await page.getByRole('menuitem', { name: /Check a clue/ }).click()
    await expect(page.getByRole('dialog', { name: 'Clue checker' })).toBeVisible()
  })

  test('during a live turn the word is prefilled, the clock pauses, and it resumes on close', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await seedSettings(page, { turnSeconds: 60 })
    await startQuickGameToLive(page)
    await waitForClockRunning(page)
    const theWord = (await readStore(page)).state.game.turn?.word.word ?? ''
    await page.keyboard.press('c')
    const theDialog = page.getByRole('dialog', { name: 'Clue checker' })
    await expect(theDialog).toBeVisible()
    await expect(theDialog.getByLabel('Word (from this turn)')).toHaveValue(theWord)
    await expect(theDialog.getByLabel('Clue someone said')).toBeFocused()
    await expect.poll(async () => (await readStore(page)).state.game.turn?.pausedAt ?? null).not.toBeNull()
    // Typing a clue must not trigger live hotkeys like S or Enter.
    await theDialog.getByLabel('Clue someone said').pressSequentially('sees')
    await page.keyboard.press('Enter')
    expect((await readStore(page)).state.game.history.length).toBe(0)
    await page.keyboard.press('Escape')
    await expect(theDialog).toBeHidden()
    await expect.poll(async () => { const theTurn = (await readStore(page)).state.game.turn; return theTurn === null ? 'no turn' : theTurn.pausedAt }).toBeNull()
    const theTurn = (await readStore(page)).state.game.turn
    expect(theTurn?.end ?? null).toBeNull()
    expect(theErrors).toEqual([])
  })

  test('a turn the teacher paused stays paused after the checker closes', async ({ page }) => {
    await seedSettings(page, { turnSeconds: 60 })
    await startQuickGameToLive(page)
    await waitForClockRunning(page)
    await page.keyboard.press('Space')
    await expect.poll(async () => (await readStore(page)).state.game.turn?.pausedAt ?? null).not.toBeNull()
    await page.keyboard.press('c')
    await expect(page.getByRole('dialog', { name: 'Clue checker' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    expect((await readStore(page)).state.game.turn?.pausedAt ?? null).not.toBeNull()
  })

  test('custom banned list blocks an otherwise allowed clue', async ({ page }) => {
    await waitForSetup(page)
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    const theField = page.getByLabel('Custom banned clues')
    await theField.scrollIntoViewIfNeeded()
    await theField.fill('yellow\nmonkey food')
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    expect((await readStore(page)).state.settings.customBanned).toBe('yellow\nmonkey food')
    await page.keyboard.press('c')
    const theDialog = page.getByRole('dialog', { name: 'Clue checker' })
    await expect(theDialog.getByText('on the class banned list (2)')).toBeVisible()
    await theDialog.getByLabel(/^Word/).fill('banana')
    await theDialog.getByLabel('Clue someone said').fill('Yellow!')
    await expect(theDialog.getByText('Not allowed', { exact: true })).toBeVisible()
    await expect(theDialog.locator('div[aria-live="polite"] > ol > li').first()).toContainText('List')
    await theDialog.getByLabel('Clue someone said').fill('peel')
    await expect(theDialog.getByText('Allowed', { exact: true })).toBeVisible()
  })
})

test.describe('shortcuts overlay', () => {
  test('? and the top bar open it and it lists every key', async ({ page }) => {
    await waitForSetup(page)
    await page.keyboard.press('?')
    const theDialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
    await expect(theDialog).toBeVisible()
    const theKeys = ['Space', 'Enter', 'N', 'H', 'X', 'G', 'S', 'Esc', '+', '-', 'U', 'L', 'C', 'M', 'F', '?']
    const theCaps = await theDialog.locator('kbd').allInnerTexts()
    for (let n = 0; n < theKeys.length; n++) {
      expect(theCaps, 'missing key ' + theKeys[n]).toContain(theKeys[n])
    }
    await page.keyboard.press('Escape')
    await expect(theDialog).toBeHidden()
    if ((page.viewportSize()?.width ?? 1920) >= 900) {
      await page.getByRole('button', { name: 'Keyboard shortcuts' }).click()
    } else {
      await page.getByRole('button', { name: 'More tools' }).click()
      await page.getByRole('menuitem', { name: /Keyboard shortcuts/ }).click()
    }
    await expect(theDialog).toBeVisible()
  })

  test('Anywhere keys: U, L, C, M, F, ? each do something', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await page.addInitScript(() => {
      const theWindow = window as unknown as { fullscreenCalls: number }
      theWindow.fullscreenCalls = 0
      Element.prototype.requestFullscreen = function () {
        theWindow.fullscreenCalls = theWindow.fullscreenCalls + 1
        return Promise.resolve()
      }
    })
    await seedSettings(page, { turnSeconds: 60 })
    await startQuickGameToLive(page)
    await waitForClockRunning(page)
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readStore(page)).state.game.history.length).toBe(1)
    await page.keyboard.press('u')
    await expect.poll(async () => (await readStore(page)).state.game.history.length).toBe(0)
    await expect(page.getByText(/Undone/)).toBeVisible()
    // Undo lands on the paused moment, so resume before moving on.
    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/leaderboard$/)
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/live$/)
    await expect(page.getByRole('timer')).toBeVisible()
    const theSound = (await readStore(page)).state.settings.sound
    await page.keyboard.press('m')
    await expect.poll(async () => (await readStore(page)).state.settings.sound).toBe(!theSound)
    await page.keyboard.press('f')
    await expect.poll(() => page.evaluate(() => (window as unknown as { fullscreenCalls: number }).fullscreenCalls)).toBe(1)
    await page.keyboard.press('c')
    await expect(page.getByRole('dialog', { name: 'Clue checker' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
    expect(theErrors).toEqual([])
  })

  test('Live keys: Enter, S, Space, Esc, G, N, +, -', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await seedSettings(page, { turnSeconds: 60, skipsPerTurn: 2, autoAdvance: false })
    await startGameWithPlayers(page)
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readStore(page)).state.game.history.filter((theRow) => theRow.outcome === 'correct').length).toBe(1)
    await page.keyboard.press('s')
    await expect.poll(async () => (await readStore(page)).state.game.turn?.skipsUsed).toBe(1)
    await page.keyboard.press('+')
    await expect.poll(async () => (await readStore(page)).state.game.history.filter((theRow) => theRow.outcome === 'adjust').length).toBe(1)
    await page.keyboard.press('-')
    await expect.poll(async () => (await readStore(page)).state.game.history.filter((theRow) => theRow.outcome === 'adjust').length).toBeGreaterThanOrEqual(1)
    await page.keyboard.press('Space')
    await expect.poll(async () => (await readStore(page)).state.game.turn?.pausedAt ?? null).not.toBeNull()
    await page.keyboard.press('Space')
    await expect.poll(async () => { const theTurn = (await readStore(page)).state.game.turn; return theTurn === null ? 'no turn' : theTurn.pausedAt }).toBeNull()
    await page.keyboard.press('g')
    await expect(page.getByRole('dialog', { name: 'Swap guesser' })).toBeVisible()
    await page.getByRole('dialog').getByRole('button').filter({ hasNotText: 'Guessing now' }).filter({ hasNot: page.locator('svg') }).first().click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect.poll(async () => (await readExtras(page)).game.turn?.swapOpen).toBe(false)
    await page.keyboard.press('Escape')
    await expect.poll(async () => (await readStore(page)).state.game.turn?.end?.outcome ?? null).toBe('ended')
    await expect(page.getByRole('button', { name: /Next team/ })).toBeVisible()
    await page.keyboard.press('n')
    await waitForPhase(page, 'teamup')
    expect(theErrors).toEqual([])
  })

  test('Team up keys: G, X, H, N and Setup Enter, Podium Enter', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await seedSettings(page, { turnSeconds: 5, handoffSeconds: 30, roundsPerGame: 1 })
    await startGameWithPlayers(page)
    expect((await readStore(page)).state.game.currentTeamIndex).toBe(0)
    await page.keyboard.press('g')
    await expect(page.getByRole('listbox').or(page.getByRole('menu')).first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox').or(page.getByRole('menu'))).toHaveCount(0)
    await page.keyboard.press('x')
    await expect.poll(async () => (await readStore(page)).state.game.currentTeamIndex).toBe(1)
    await expect(page.getByRole('button', { name: /start turn|start now/i }).first()).toBeVisible()
    await page.keyboard.press('n')
    await waitForPhase(page, 'live')
    await page.keyboard.press('Escape')
    // Team 2 was the last team of the only round, so the game should now end or hand off to team 1.
    await expect.poll(async () => (await readStore(page)).state.game.phase, { timeout: 12_000 }).not.toBe('live')
    const thePhase = (await readStore(page)).state.game.phase
    if (thePhase === 'teamup') {
      await expect(page.getByRole('button', { name: 'Hold' })).toBeVisible()
      await page.keyboard.press('h')
      await expect.poll(async () => (await readExtras(page)).game.handoffHeld).toBe(true)
      await page.keyboard.press('h')
      await expect.poll(async () => (await readExtras(page)).game.handoffHeld).toBe(false)
    }
    // End the game from the top of Team up or Live to reach the podium.
    if ((await readStore(page)).state.game.phase !== 'podium') {
      await page.getByRole('button', { name: 'End game' }).first().click()
      await page.getByRole('alertdialog').or(page.getByRole('dialog')).getByRole('button', { name: /end game/i }).click()
    }
    await waitForPhase(page, 'podium')
    await expect(page).toHaveURL(/#\/podium$/)
    await expect(page.getByRole('button', { name: /Play again/ })).toBeVisible({ timeout: 10_000 })
    // Enter is ignored for 2.5 s on the podium so a late Correct press cannot wipe the results.
    await page.waitForTimeout(2_700)
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readStore(page)).state.game.phase).not.toBe('podium')
    expect(theErrors).toEqual([])
  })
})

test.describe('top bar', () => {
  test('mute button and M flip the sound setting and the icon label', async ({ page }) => {
    await waitForSetup(page)
    expect((await readStore(page).catch(() => null))?.state.settings.sound ?? true).toBe(true)
    await page.getByRole('button', { name: 'Mute sound (M)' }).click()
    await expect(page.getByRole('button', { name: 'Turn sound on (M)' })).toBeVisible()
    expect((await readStore(page)).state.settings.sound).toBe(false)
    await page.keyboard.press('m')
    await expect(page.getByRole('button', { name: 'Mute sound (M)' })).toBeVisible()
    expect((await readStore(page)).state.settings.sound).toBe(true)
  })

  test('theme toggle flips data-theme and persists across reload', async ({ page }) => {
    await waitForSetup(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    if ((page.viewportSize()?.width ?? 1920) >= 900) {
      await page.getByRole('button', { name: 'Switch theme' }).click()
    } else {
      await page.getByRole('button', { name: 'More tools' }).click()
      await page.getByRole('menuitem', { name: /Switch theme/ }).click()
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect((await readStore(page)).state.settings.theme).toBe('light')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    const theBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(theBg).not.toBe('rgb(0, 0, 0)')
  })

  test('fullscreen button calls requestFullscreen, also from the More tools menu', async ({ page }) => {
    await page.addInitScript(() => {
      const theWindow = window as unknown as { fullscreenCalls: number }
      theWindow.fullscreenCalls = 0
      Element.prototype.requestFullscreen = function () {
        theWindow.fullscreenCalls = theWindow.fullscreenCalls + 1
        return Promise.resolve()
      }
    })
    await page.setViewportSize({ width: 1280, height: 720 })
    await waitForSetup(page)
    await page.getByRole('button', { name: 'Enter fullscreen (F)' }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { fullscreenCalls: number }).fullscreenCalls)).toBe(1)
    await page.setViewportSize({ width: 800, height: 600 })
    await page.getByRole('button', { name: 'More tools' }).click()
    await page.getByRole('menuitem', { name: /Enter fullscreen/ }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { fullscreenCalls: number }).fullscreenCalls)).toBe(2)
  })

  for (const theWidth of [1920, 1000, 800]) {
    test('nav links reach every screen at ' + String(theWidth) + ' wide', async ({ page }) => {
      const theErrors = collectConsoleErrors(page)
      await page.setViewportSize({ width: theWidth, height: 700 })
      await waitForSetup(page)
      const theNav = page.getByRole('navigation', { name: 'Screens' })
      const theTargets = [
        { name: 'Team up', url: /#\/teamup$/ },
        { name: 'Live', url: /#\/live$/ },
        { name: 'Leaderboard', url: /#\/leaderboard$/ },
        { name: 'Podium', url: /#\/podium$/ },
        { name: 'Setup', url: /#\/$/ },
      ]
      for (let n = 0; n < theTargets.length; n++) {
        const theLink = theNav.getByRole('link', { name: theTargets[n].name, exact: true })
        await expect(theLink).toBeInViewport()
        await theLink.click()
        await expect(page).toHaveURL(theTargets[n].url)
        await expect(theLink).toHaveAttribute('aria-current', 'page')
        await expect(page.locator('main')).not.toBeEmpty()
      }
      // Every top bar control stays on screen, with the folded tools reachable from More tools.
      const theOverflow = await page.evaluate(() => {
        const theHeader = document.querySelector('header')
        return theHeader === null ? 0 : theHeader.scrollWidth - theHeader.clientWidth
      })
      expect(theOverflow).toBeLessThanOrEqual(1)
      await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeInViewport()
      if (theWidth < 900) {
        await page.getByRole('button', { name: 'More tools' }).click()
        const theItems = await page.getByRole('menuitem').allInnerTexts()
        expect(theItems.join('|')).toContain('Check a clue')
        expect(theItems.join('|')).toContain('Keyboard shortcuts')
        expect(theItems.join('|')).toContain('Open projector window')
        await page.keyboard.press('Escape')
      } else {
        await expect(page.getByRole('button', { name: 'More tools' })).toBeHidden()
      }
      expect(theErrors).toEqual([])
    })
  }

  test('round chip shows the round during Team up and Live', async ({ page }) => {
    await seedSettings(page, { roundsPerGame: 3, turnSeconds: 60 })
    await waitForSetup(page)
    await expect(page.locator('header').getByText(/^Round /)).toHaveCount(0)
    await page.keyboard.press('Enter')
    await waitForPhase(page, 'teamup')
    const theChip = page.locator('header').getByText(/^Round /)
    await expect(theChip).toHaveText('Round 1 of 3')
    await expect(theChip).toBeVisible()
    await page.getByRole('button', { name: /start turn/i }).first().click()
    await waitForPhase(page, 'live')
    await expect(theChip).toHaveText('Round 1 of 3')
  })
})
