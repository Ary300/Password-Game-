import { readStore, waitForPhase } from './helpers'
import {
  boxOf,
  boxesIntersect,
  expect,
  gotoSetup,
  openSettings,
  phaseOrSetup,
  setStepper,
  startGameButton,
  test,
} from './helpers-setup'

test.describe('Setup, quick teams', () => {
  test('Start game button starts a quick game with default teams', async ({ page }) => {
    await gotoSetup(page)
    await expect(page.getByText('Plays with Team 1 and Team 2')).toBeVisible()
    await startGameButton(page).click()
    await waitForPhase(page, 'teamup')
    const theState = (await readStore(page)).state as unknown as { teams: { name: string }[]; game: { mode: string } }
    expect(theState.teams.map((t) => t.name)).toEqual(['Team 1', 'Team 2'])
    expect(theState.game.mode).toBe('quick')
    await expect(page).toHaveURL(/#\/teamup$/)
    await expect(page.getByRole('button', { name: /^start turn/i })).toBeVisible()
  })

  test('Enter key starts a game from Setup', async ({ page }) => {
    await gotoSetup(page)
    await page.keyboard.press('Enter')
    await waitForPhase(page, 'teamup')
    await expect(page.getByRole('button', { name: /^start turn/i })).toBeVisible()
  })

  test('Enter while typing a team name does not start a game', async ({ page }) => {
    await gotoSetup(page)
    const theName = page.getByRole('textbox', { name: 'Name of team 1' })
    await theName.click()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    expect(await phaseOrSetup(page)).toBe('setup')
  })

  test('team count stepper runs 2 to 8 and disables at the bounds', async ({ page }) => {
    await gotoSetup(page)
    const theGroup = page.getByRole('group', { name: 'team count', exact: true })
    const theDown = theGroup.getByRole('button', { name: 'Decrease team count' })
    const theUp = theGroup.getByRole('button', { name: 'Increase team count' })
    await expect(theDown).toBeDisabled()
    await expect(theGroup.locator('output')).toHaveText('2')
    for (let n = 3; n <= 8; n++) {
      await theUp.click()
      await expect(theGroup.locator('output')).toHaveText(String(n))
      await expect(page.getByRole('textbox', { name: /^Name of team \d$/ })).toHaveCount(n)
    }
    await expect(theUp).toBeDisabled()
    let theState = (await readStore(page)).state
    expect(theState.teams).toHaveLength(8)
    expect(theState.settings.teamCount).toBe(8)
    expect(theState.teams[7].name).toBe('Team 8')

    await setStepper(page.locator('body'), 'team count', 3)
    theState = (await readStore(page)).state
    expect(theState.teams).toHaveLength(3)
    expect(theState.settings.teamCount).toBe(3)
    await expect(theUp).toBeEnabled()
    await expect(page.getByText('Plays with Team 1, Team 2 and Team 3')).toBeVisible()
  })

  test('rename a team and type players with commas and new lines', async ({ page }) => {
    await gotoSetup(page)
    const theName = page.getByRole('textbox', { name: 'Name of team 1' })
    await theName.fill('Lions')
    await expect.poll(async () => (await readStore(page)).state.teams[0].name).toBe('Lions')
    await expect(page.getByText('Plays with Lions and Team 2')).toBeVisible()

    const thePlayers = page.getByRole('textbox', { name: 'Players on Lions' })
    await thePlayers.fill('Ana, Ben\nCy;  Dee \n\nana')
    // Players are parsed on blur, so move focus away.
    await page.getByRole('textbox', { name: 'Name of team 2' }).click()
    await expect
      .poll(async () => (await readStore(page)).state.teams[0].players.map((p) => p.name))
      .toEqual(['Ana', 'Ben', 'Cy', 'Dee'])
    await expect(page.getByText('4 players')).toBeVisible()
    await expect(thePlayers).toHaveValue('Ana\nBen\nCy\nDee')

    await page.getByRole('button', { name: 'Remove all players from Lions' }).click()
    await expect.poll(async () => (await readStore(page)).state.teams[0].players.length).toBe(0)
    await expect(thePlayers).toHaveValue('')
    await expect(page.getByRole('button', { name: 'Remove all players from Lions' })).toHaveCount(0)
  })

  test('paste a roster with valid lines and a line without a colon', async ({ page }) => {
    await gotoSetup(page)
    await page.getByRole('button', { name: 'Paste a roster' }).click()
    const theDialog = page.getByRole('dialog', { name: 'Paste a roster' })
    await expect(theDialog).toBeVisible()
    await expect(theDialog.getByText('Nothing pasted yet')).toBeVisible()
    await expect(theDialog.getByRole('button', { name: 'Use these teams' })).toBeDisabled()

    await theDialog.getByRole('textbox', { name: 'Roster' }).fill('Lions: Ana, Ben, Cy')
    await expect(theDialog.getByText('1 team, a second empty team is added')).toBeVisible()

    await theDialog.getByRole('textbox', { name: 'Roster' }).fill('Lions: Ana, Ben, Cy\nTigers: Dee, Eli\n\nBears')
    await expect(theDialog.getByText('3 teams', { exact: true })).toBeVisible()
    const thePreview = theDialog.getByRole('list', { name: 'Teams from this roster' }).getByRole('listitem')
    await expect(thePreview).toHaveCount(3)
    await expect(thePreview.nth(0)).toContainText('Lions')
    await expect(thePreview.nth(0)).toContainText('3 players')
    await expect(thePreview.nth(1)).toContainText('2 players')
    await expect(thePreview.nth(2)).toContainText('Bears')
    await expect(thePreview.nth(2)).toContainText('no players')

    await theDialog.getByRole('button', { name: 'Use these teams' }).click()
    await expect(theDialog).toBeHidden()
    const theState = (await readStore(page)).state
    expect(theState.teams.map((t) => t.name)).toEqual(['Lions', 'Tigers', 'Bears'])
    expect(theState.teams[0].players.map((p) => p.name)).toEqual(['Ana', 'Ben', 'Cy'])
    expect(theState.teams[1].players.map((p) => p.name)).toEqual(['Dee', 'Eli'])
    expect(theState.teams[2].players).toEqual([])
    expect(theState.settings.teamCount).toBe(3)
    await expect(page.getByRole('textbox', { name: 'Name of team 3' })).toHaveValue('Bears')
    await expect(page.getByRole('textbox', { name: 'Players on Tigers' })).toHaveValue('Dee\nEli')
  })

  test('paste a roster with more than 8 lines shows the note, cancel keeps teams', async ({ page }) => {
    await gotoSetup(page)
    await page.getByRole('button', { name: 'Paste a roster' }).click()
    const theDialog = page.getByRole('dialog', { name: 'Paste a roster' })
    const theLines: string[] = []
    for (let n = 1; n <= 10; n++) {
      theLines.push('Squad ' + String(n) + ': P' + String(n))
    }
    await theDialog.getByRole('textbox', { name: 'Roster' }).fill(theLines.join('\n'))
    await expect(theDialog.getByText('Only 8 teams fit. The last 2 lines will be left out.')).toBeVisible()
    await expect(theDialog.getByText('8 teams', { exact: true })).toBeVisible()

    await theDialog.getByRole('button', { name: 'Keep current teams' }).click()
    await expect(theDialog).toBeHidden()
    await expect(page.getByRole('textbox', { name: /^Name of team \d$/ })).toHaveCount(2)
    expect(await phaseOrSetup(page)).toBe('setup')

    // Reopening starts empty, and applying the long paste keeps only 8.
    await page.getByRole('button', { name: 'Paste a roster' }).click()
    await expect(theDialog.getByRole('textbox', { name: 'Roster' })).toHaveValue('')
    await theDialog.getByRole('textbox', { name: 'Roster' }).fill(theLines.join('\n'))
    await theDialog.getByRole('button', { name: 'Use these teams' }).click()
    const theState = (await readStore(page)).state
    expect(theState.teams).toHaveLength(8)
    expect(theState.teams[7].name).toBe('Squad 8')

    // Escape closes without applying.
    await page.getByRole('button', { name: 'Paste a roster' }).click()
    await theDialog.getByRole('textbox', { name: 'Roster' }).fill('Only: One')
    await page.keyboard.press('Escape')
    await expect(theDialog).toBeHidden()
    expect((await readStore(page)).state.teams).toHaveLength(8)
  })

  test("Load last game's teams restores the teams from the last game", async ({ page }) => {
    await gotoSetup(page)
    const theLoad = page.getByRole('button', { name: "Load last game's teams" })
    await expect(theLoad).toBeDisabled()
    await expect(theLoad).toHaveAttribute('title', 'Play one game first')

    await page.getByRole('textbox', { name: 'Name of team 1' }).fill('Owls')
    await page.getByRole('textbox', { name: 'Players on Owls' }).fill('Zoe, Yan')
    await startGameButton(page).click()
    await waitForPhase(page, 'teamup')

    // End the game from Team up so the podium goes up, then go back to Setup.
    await expect(page.getByRole('button', { name: /^start turn/i })).toBeVisible()
    await page.getByRole('button', { name: 'End game', exact: true }).click()
    await page.getByRole('dialog', { name: 'End the game now?' }).getByRole('button', { name: 'End game' }).click()
    await waitForPhase(page, 'podium')
    await page.getByRole('link', { name: 'Setup' }).click()
    await expect(startGameButton(page)).toBeVisible()

    await page.getByRole('textbox', { name: 'Name of team 1' }).fill('Changed')
    await setStepper(page.locator('body'), 'team count', 4)
    await expect(theLoad).toBeEnabled()
    await theLoad.click()
    const theState = (await readStore(page)).state
    expect(theState.teams.map((t) => t.name)).toEqual(['Owls', 'Team 2'])
    expect(theState.teams[0].players.map((p) => p.name)).toEqual(['Zoe', 'Yan'])
    expect(theState.settings.teamCount).toBe(2)
    await expect(page.getByRole('textbox', { name: 'Name of team 1' })).toHaveValue('Owls')
    await expect(page.getByRole('textbox', { name: 'Players on Owls' })).toHaveValue('Zoe\nYan')
  })

  test('Start with these teams uses edited names and players, even unblurred', async ({ page }) => {
    await gotoSetup(page)
    await page.getByRole('textbox', { name: 'Name of team 1' }).fill('Hawks')
    await page.getByRole('textbox', { name: 'Name of team 2' }).fill('Foxes')
    await page.getByRole('textbox', { name: 'Players on Foxes' }).fill('Kai, Lu')
    await page.getByRole('textbox', { name: 'Players on Hawks' }).fill('Ana\nBo')
    // Focus is still in the Hawks textarea when Start is clicked.
    await page.getByRole('button', { name: 'Start with these teams' }).click()
    await waitForPhase(page, 'teamup')
    const theState = (await readStore(page)).state
    expect(theState.teams.map((t) => t.name)).toEqual(['Hawks', 'Foxes'])
    expect(theState.teams[0].players.map((p) => p.name)).toEqual(['Ana', 'Bo'])
    expect(theState.teams[1].players.map((p) => p.name)).toEqual(['Kai', 'Lu'])
    await expect(page.getByText('Hawks').first()).toBeVisible()
    await expect(page.getByText(/(Ana|Bo) is guessing/)).toBeVisible()
  })

  test('a blank team name falls back to its default name at start', async ({ page }) => {
    await gotoSetup(page)
    await page.getByRole('textbox', { name: 'Name of team 2' }).fill('   ')
    await page.getByRole('button', { name: 'Start with these teams' }).click()
    await waitForPhase(page, 'teamup')
    expect((await readStore(page)).state.teams[1].name).toBe('Team 2')
  })

  test('the settings summary reflects drawer changes', async ({ page }) => {
    await gotoSetup(page)
    const theSummary = page.locator('dl').filter({ hasText: 'Seconds' })
    await expect(theSummary).toContainText('20')
    await expect(theSummary).toContainText('5')
    await expect(page.getByText('All difficulties / Any syllables / All categories')).toBeVisible()

    await page.getByRole('button', { name: 'Change settings' }).click()
    const theDrawer = page.getByRole('dialog', { name: 'Settings' })
    await expect(theDrawer).toBeVisible()
    await setStepper(theDrawer, 'Turn length', 30)
    await setStepper(theDrawer, 'Rounds per game', 7)
    await setStepper(theDrawer, 'Number of teams', 3)
    await theDrawer.getByRole('radiogroup', { name: 'Syllables' }).getByRole('radio', { name: '1', exact: true }).click()
    await theDrawer.getByRole('radiogroup', { name: 'Difficulty' }).getByRole('radio', { name: 'Easy' }).click()
    await theDrawer.getByRole('radiogroup', { name: 'Word length' }).getByRole('radio', { name: 'Letter range' }).click()
    await theDrawer.getByRole('button', { name: 'Done' }).click()
    await expect(theDrawer).toBeHidden()

    const theItems = theSummary.locator('dd')
    await expect(theItems.nth(0)).toHaveText('30')
    await expect(theItems.nth(1)).toHaveText('7')
    await expect(theItems.nth(2)).toHaveText('3')
    await expect(page.getByText('Easy words / 1 syllable / All categories / 3 to 8 letters')).toBeVisible()
    await expect(page.getByRole('textbox', { name: /^Name of team \d$/ })).toHaveCount(3)
  })

  test('teams and settings survive a reload', async ({ page }) => {
    await gotoSetup(page)
    await page.getByRole('textbox', { name: 'Name of team 1' }).fill('Comets')
    await page.getByRole('textbox', { name: 'Players on Comets' }).fill('Ivy, Jo')
    await setStepper(page.locator('body'), 'team count', 3)
    const theDrawer = await openSettings(page)
    await setStepper(theDrawer, 'Turn length', 45)
    await theDrawer.getByRole('radiogroup', { name: 'Difficulty' }).getByRole('radio', { name: 'Hard' }).click()
    await page.keyboard.press('Escape')
    await expect(theDrawer).toBeHidden()

    await page.reload()
    await expect(startGameButton(page)).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Name of team 1' })).toHaveValue('Comets')
    await expect(page.getByRole('textbox', { name: 'Players on Comets' })).toHaveValue('Ivy\nJo')
    await expect(page.getByRole('textbox', { name: /^Name of team \d$/ })).toHaveCount(3)
    const theState = (await readStore(page)).state
    expect(theState.settings.turnSeconds).toBe(45)
    expect(theState.settings.difficulty).toBe('hard')
    await openSettings(page)
    await expect(page.getByRole('group', { name: 'Turn length', exact: true }).locator('output')).toHaveText('45 s')
  })

  test('hero start button, tabs, and team rows never overlap', async ({ page }) => {
    await gotoSetup(page)
    await setStepper(page.locator('body'), 'team count', 8)
    const theStart = await boxOf(startGameButton(page))
    const theTabs = await boxOf(page.getByRole('tablist', { name: 'Team setup' }))
    const theRows = page.getByRole('textbox', { name: /^Name of team \d$/ })
    await expect(theRows).toHaveCount(8)
    const theRowBoxes = []
    for (let n = 0; n < 8; n++) {
      const theField = page.getByRole('textbox', { name: 'Name of team ' + String(n + 1), exact: true })
      theRowBoxes.push(await boxOf(page.locator('ol > li').filter({ has: theField })))
    }
    expect(boxesIntersect(theStart, theTabs)).toBe(false)
    for (let n = 0; n < theRowBoxes.length; n++) {
      expect(boxesIntersect(theStart, theRowBoxes[n]), 'start vs row ' + String(n)).toBe(false)
      expect(boxesIntersect(theTabs, theRowBoxes[n]), 'tabs vs row ' + String(n)).toBe(false)
      for (let i = n + 1; i < theRowBoxes.length; i++) {
        expect(boxesIntersect(theRowBoxes[n], theRowBoxes[i]), 'row ' + String(n) + ' vs ' + String(i)).toBe(false)
      }
      // A row must be tall enough to hold its name field.
      expect(theRowBoxes[n].height).toBeGreaterThanOrEqual(60)
    }
    // The hero content stays within the viewport width.
    const theWidth = page.viewportSize()?.width ?? 0
    expect(theStart.x + theStart.width).toBeLessThanOrEqual(theWidth + 1)
    expect(theTabs.x + theTabs.width).toBeLessThanOrEqual(theWidth + 1)
    const theScrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(theScrollW).toBeLessThanOrEqual(theWidth + 1)
  })
})
