import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { collectConsoleErrors, readStore, seedSettings, waitForClockRunning, waitForPhase } from './helpers'
import { goLiveFromTeamUp, startGameWithPlayers } from './helpers-visual'

type AxeFinding = { id: string; impact: string; nodes: string[] }

// Serious and critical only: those are the ones that stop a student or teacher from reading or operating the game.
async function seriousViolations(thePage: Page): Promise<AxeFinding[]> {
  const theResults = await new AxeBuilder({ page: thePage }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const theOut: AxeFinding[] = []
  for (let n = 0; n < theResults.violations.length; n++) {
    const theViolation = theResults.violations[n]
    if (theViolation.impact !== 'serious' && theViolation.impact !== 'critical') {
      continue
    }
    const theNodes: string[] = []
    for (let i = 0; i < theViolation.nodes.length && i < 6; i++) {
      theNodes.push(theViolation.nodes[i].target.join(' ') + ' :: ' + (theViolation.nodes[i].failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 160))
    }
    theOut.push({ id: theViolation.id, impact: theViolation.impact ?? '', nodes: theNodes })
  }
  return theOut
}

async function expectAxeClean(thePage: Page, theName: string) {
  // Entrance animations fade text in; axe reads mid-fade colors as low contrast, so let them settle.
  await thePage.waitForTimeout(1_200)
  expect.soft(await seriousViolations(thePage), theName).toEqual([])
}

async function unnamedButtons(thePage: Page): Promise<string[]> {
  return thePage.evaluate(() => {
    const theAll = document.querySelectorAll('button, [role="button"], a[href], [role="tab"], [role="switch"], [role="menuitem"]')
    const theOut: string[] = []
    for (let n = 0; n < theAll.length; n++) {
      const theEl = theAll[n] as HTMLElement
      const theName = (theEl.getAttribute('aria-label') ?? '') + (theEl.getAttribute('aria-labelledby') ?? '') + (theEl.innerText ?? '').trim() + (theEl.getAttribute('title') ?? '')
      let theLabelled = false
      if (theEl.id.length > 0) {
        theLabelled = document.querySelector('label[for="' + theEl.id + '"]') !== null
      }
      if (theName.trim().length === 0 && !theLabelled) {
        theOut.push(theEl.outerHTML.slice(0, 120))
      }
    }
    return theOut
  })
}

test.describe('accessibility', () => {
  test.beforeEach(({}, theInfo) => {
    test.skip(theInfo.project.name !== 'projector-1080', 'axe runs once, at projector size')
  })

  test('setup, settings, clue checker, shortcuts pass axe', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await page.goto('/#/')
    await expect(page.getByRole('button', { name: /start game/i }).first()).toBeVisible()
    await expectAxeClean(page, 'setup quick teams')
    expect(await unnamedButtons(page)).toEqual([])
    await page.getByRole('tab', { name: 'Classes' }).click()
    await expectAxeClean(page, 'setup classes')
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
    await expectAxeClean(page, 'settings drawer')
    expect(await unnamedButtons(page)).toEqual([])
    await page.keyboard.press('Escape')
    await page.keyboard.press('c')
    const theDialog = page.getByRole('dialog', { name: 'Clue checker' })
    await theDialog.getByLabel(/^Word/).fill('sunflower')
    await theDialog.getByLabel('Clue someone said').fill('sun')
    await expectAxeClean(page, 'clue checker not allowed')
    await theDialog.getByLabel('Clue someone said').fill('yellow')
    await expectAxeClean(page, 'clue checker allowed')
    await page.keyboard.press('Escape')
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
    await expectAxeClean(page, 'shortcuts')
    expect(theErrors).toEqual([])
  })

  test('team up, live, leaderboard, podium pass axe', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await seedSettings(page, { turnSeconds: 60, autoAdvance: false })
    await startGameWithPlayers(page)
    await expectAxeClean(page, 'team up')
    expect(await unnamedButtons(page)).toEqual([])
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await expectAxeClean(page, 'live running')
    expect(await unnamedButtons(page)).toEqual([])
    await page.keyboard.press('Space')
    await expectAxeClean(page, 'live paused')
    await page.keyboard.press('Space')
    await page.keyboard.press('g')
    await expect(page.getByRole('dialog', { name: 'Swap guesser' })).toBeVisible()
    await expectAxeClean(page, 'swap guesser')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Escape')
    await expect(page.getByText('Turn over')).toBeVisible()
    await expectAxeClean(page, 'turn over band')
    await page.keyboard.press('l')
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    const theTabs = ['This game', 'Players', 'Round history', 'Class board']
    for (let n = 0; n < theTabs.length; n++) {
      await page.getByRole('tab', { name: theTabs[n] }).click()
      await expectAxeClean(page, 'leaderboard ' + theTabs[n])
    }
    await page.keyboard.press('Escape')
    await page.keyboard.press('n')
    await waitForPhase(page, 'teamup')
    await page.getByRole('button', { name: 'End game' }).first().click()
    await expectAxeClean(page, 'end game modal')
    await page.getByRole('dialog').getByRole('button', { name: /end game/i }).click()
    await waitForPhase(page, 'podium')
    await page.waitForTimeout(2_500)
    await expectAxeClean(page, 'podium')
    expect(await unnamedButtons(page)).toEqual([])
    expect(theErrors).toEqual([])
  })

  test('light theme team up and live pass axe', async ({ page }) => {
    await seedSettings(page, { turnSeconds: 60, theme: 'light' })
    await startGameWithPlayers(page)
    await expectAxeClean(page, 'light team up')
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    await expectAxeClean(page, 'light live')
  })

  test('keyboard focus is visible when tabbing through the top bar and setup', async ({ page }) => {
    await page.goto('/#/')
    await expect(page.getByRole('button', { name: /start game/i }).first()).toBeVisible()
    await page.locator('body').click({ position: { x: 5, y: 700 } })
    for (let n = 0; n < 14; n++) {
      await page.keyboard.press('Tab')
      const theFocus = await page.evaluate(() => {
        const theEl = document.activeElement as HTMLElement | null
        if (theEl === null || theEl === document.body) {
          return { tag: 'body', visible: true }
        }
        const theStyle = getComputedStyle(theEl)
        const theOutline = theStyle.outlineStyle !== 'none' && parseFloat(theStyle.outlineWidth) >= 2
        const theRing = theStyle.boxShadow !== 'none'
        const theBorder = theEl.tagName === 'INPUT' || theEl.tagName === 'TEXTAREA'
        return { tag: theEl.tagName + ' ' + (theEl.getAttribute('aria-label') ?? theEl.innerText.slice(0, 20)), visible: theOutline || theRing || theBorder }
      })
      expect.soft(theFocus.visible, 'no focus ring on ' + theFocus.tag).toBe(true)
    }
  })

  test('reduced motion removes animations and a turn still plays through', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await seedSettings(page, { turnSeconds: 5, handoffSeconds: 30 })
    await startGameWithPlayers(page)
    // The team banner slides in normally; with reduced motion it must already sit in place.
    const theTransform = await page.locator('section[aria-label="Team up"] h1').first().evaluate((theEl) => getComputedStyle(theEl.parentElement as HTMLElement).transform)
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(theTransform)
    await goLiveFromTeamUp(page)
    await waitForClockRunning(page)
    const theDurations = await page.evaluate(() => {
      const theAll = document.getAnimations()
      const theLong: string[] = []
      for (let n = 0; n < theAll.length; n++) {
        const theTiming = theAll[n].effect?.getComputedTiming()
        if (theTiming !== undefined && typeof theTiming.duration === 'number' && theTiming.duration > 1) {
          theLong.push(String(theTiming.duration))
        }
      }
      return theLong
    })
    expect(theDurations).toEqual([])
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readStore(page)).state.game.history.length).toBe(1)
    await waitForPhase(page, 'teamup', 12_000)
    await expect(page.getByText('Starts in')).toBeVisible()
    expect(theErrors).toEqual([])
  })
})
