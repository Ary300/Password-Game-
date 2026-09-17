import type { Page } from '@playwright/test'
import { readStore, waitForPhase } from './helpers'
import { expect, gotoSetup, openSettings, setStepper, setToggle, startGameButton, test, waitClockRunning } from './helpers-setup'

type FullStudent = { id: string; name: string; absent: boolean; career: { correct: number; turns: number; skips: number } }
type FullClass = { id: string; name: string; students: FullStudent[]; totals: { games: number; turns: number; correct: number } }
type FullTeam = { id: string; name: string; players: { id: string; name: string }[] }
type FullState = {
  teams: FullTeam[]
  classes: FullClass[]
  activeClassId: string | null
  settings: Record<string, unknown>
  game: { phase: string; mode: string; classId: string | null; history: { outcome: string; guesserId: string | null }[] }
}

async function stateOf(thePage: Page): Promise<FullState> {
  return (await readStore(thePage)).state as unknown as FullState
}

async function openClassesTab(thePage: Page): Promise<void> {
  await gotoSetup(thePage)
  await thePage.getByRole('tab', { name: 'Classes' }).click()
  await expect(thePage.getByRole('tab', { name: 'Classes' })).toHaveAttribute('aria-selected', 'true')
}

// Adds a class through the first-class form, or through the Add class modal once a class exists.
async function addClass(thePage: Page, theName: string, theNames: string[]): Promise<void> {
  const theModalButton = thePage.getByRole('tabpanel').getByRole('button', { name: 'Add class', exact: true })
  const theHasClasses = (await thePage.getByRole('list', { name: 'Saved classes' }).count()) > 0
  let theScope = thePage.getByRole('tabpanel')
  if (theHasClasses) {
    await theModalButton.first().click()
    theScope = thePage.getByRole('dialog', { name: 'Add a class' })
    await expect(theScope).toBeVisible()
  }
  await theScope.getByRole('textbox', { name: 'Class name' }).fill(theName)
  await theScope.getByRole('textbox', { name: 'Paste names, one per line' }).fill(theNames.join('\n'))
  await theScope.locator('form').getByRole('button', { name: 'Add class', exact: true }).click()
  await expect(thePage.getByRole('list', { name: 'Saved classes' }).getByRole('button', { name: new RegExp('^' + theName) })).toBeVisible()
}

function makeNames(theCount: number): string[] {
  const theNames: string[] = []
  for (let n = 1; n <= theCount; n++) {
    theNames.push('Student ' + String(n).padStart(2, '0'))
  }
  return theNames
}

function tile(thePage: Page, theName: string) {
  return thePage.getByRole('button', { name: new RegExp('^' + theName + ', (Here|Absent)\\. Toggle attendance$') })
}

test.describe('Classes', () => {
  test('add a class with pasted names drops duplicates', async ({ page }) => {
    await openClassesTab(page)
    await expect(page.getByRole('heading', { name: 'Add your first class' })).toBeVisible()
    const thePanel = page.getByRole('tabpanel')
    await thePanel.getByRole('textbox', { name: 'Class name' }).fill('CS period 3')
    await thePanel.getByRole('textbox', { name: 'Paste names, one per line' }).fill('Aryav Das\nMaya Chen\naryav das\n\nJordan  Brooks, Maya Chen')
    await expect(thePanel.getByText('3 students')).toBeVisible()
    await thePanel.locator('form').getByRole('button', { name: 'Add class' }).click()

    const theChip = page.getByRole('list', { name: 'Saved classes' }).getByRole('button', { name: /^CS period 3/ })
    await expect(theChip).toBeVisible()
    await expect(theChip).toHaveAttribute('aria-pressed', 'true')
    await expect(theChip).toContainText('3/3')
    const theState = await stateOf(page)
    expect(theState.classes).toHaveLength(1)
    expect(theState.classes[0].name).toBe('CS period 3')
    expect(theState.classes[0].students.map((s) => s.name)).toEqual(['Aryav Das', 'Maya Chen', 'Jordan Brooks'])
    expect(theState.activeClassId).toBe(theState.classes[0].id)
    await expect(tile(page, 'Maya Chen')).toBeVisible()
  })

  test('switch classes, rename, and delete with cancel and confirm', async ({ page }) => {
    await openClassesTab(page)
    await addClass(page, 'Period 1', ['Ana', 'Ben'])
    await addClass(page, 'Period 2', ['Cy', 'Dee', 'Eli'])
    const theChips = page.getByRole('list', { name: 'Saved classes' })
    await expect(theChips.getByRole('button', { name: /^Period 2/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(tile(page, 'Cy')).toBeVisible()

    await theChips.getByRole('button', { name: /^Period 1/ }).click()
    await expect(theChips.getByRole('button', { name: /^Period 1/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(theChips.getByRole('button', { name: /^Period 2/ })).toHaveAttribute('aria-pressed', 'false')
    await expect(tile(page, 'Ana')).toBeVisible()
    await expect(tile(page, 'Cy')).toHaveCount(0)
    let theState = await stateOf(page)
    expect(theState.activeClassId).toBe(theState.classes[0].id)

    const theName = page.getByRole('textbox', { name: 'Class name' })
    await theName.fill('Period 1 Honors')
    await expect(theChips.getByRole('button', { name: /^Period 1 Honors/ })).toBeVisible()
    theState = await stateOf(page)
    expect(theState.classes[0].name).toBe('Period 1 Honors')

    await page.getByRole('button', { name: 'Delete class' }).click()
    const theDialog = page.getByRole('dialog', { name: 'Delete Period 1 Honors?' })
    await expect(theDialog).toBeVisible()
    await expect(theDialog).toContainText('This removes 2 students')
    await theDialog.getByRole('button', { name: 'Keep class' }).click()
    await expect(theDialog).toBeHidden()
    expect((await stateOf(page)).classes).toHaveLength(2)

    await page.getByRole('button', { name: 'Delete class' }).click()
    await theDialog.getByRole('button', { name: 'Delete class' }).click()
    await expect(theDialog).toBeHidden()
    theState = await stateOf(page)
    expect(theState.classes.map((c) => c.name)).toEqual(['Period 2'])
    expect(theState.activeClassId).toBeNull()
    await expect(page.getByText('Pick a class')).toBeVisible()
    await theChips.getByRole('button', { name: /^Period 2/ }).click()
    await expect(tile(page, 'Dee')).toBeVisible()

    // Deleting the last class returns to the first-class form.
    await page.getByRole('button', { name: 'Delete class' }).click()
    await page.getByRole('dialog', { name: 'Delete Period 2?' }).getByRole('button', { name: 'Delete class' }).click()
    await expect(page.getByRole('heading', { name: 'Add your first class' })).toBeVisible()
    expect((await stateOf(page)).classes).toHaveLength(0)
  })

  test('add and remove students', async ({ page }) => {
    await openClassesTab(page)
    await addClass(page, 'Bio', ['Ana', 'Ben'])
    const theAdd = page.getByRole('textbox', { name: 'Add students to this class' })
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeDisabled()
    await theAdd.fill('Cy, Dee, ana')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(theAdd).toHaveValue('')
    await expect(tile(page, 'Dee')).toBeVisible()
    let theStudents = (await stateOf(page)).classes[0].students
    expect(theStudents.map((s) => s.name)).toEqual(['Ana', 'Ben', 'Cy', 'Dee'])

    // Enter in the add field submits the form.
    await theAdd.fill('Eli')
    await theAdd.press('Enter')
    await expect(tile(page, 'Eli')).toBeVisible()
    expect(await page.evaluate(() => location.hash)).toBe('#/')

    await tile(page, 'Ben').hover()
    await page.getByRole('button', { name: 'Remove Ben from class' }).click()
    await expect(tile(page, 'Ben')).toHaveCount(0)
    theStudents = (await stateOf(page)).classes[0].students
    expect(theStudents.map((s) => s.name)).toEqual(['Ana', 'Cy', 'Dee', 'Eli'])
    await expect(page.getByRole('list', { name: 'Saved classes' }).getByRole('button', { name: /^Bio/ })).toContainText('4/4')
  })

  test('removing a student after the split keeps the class teams', async ({ page }) => {
    await openClassesTab(page)
    await addClass(page, 'Leavers', ['Ana', 'Ben', 'Cy', 'Dee', 'Eli'])
    await page.getByRole('button', { name: 'Split into 2' }).click()
    await expect(page.getByRole('button', { name: 'Reshuffle' })).toBeVisible()
    const theVictim = (await stateOf(page)).teams[0].players[0]
    await tile(page, theVictim.name).hover()
    await page.getByRole('button', { name: 'Remove ' + theVictim.name + ' from class' }).click()
    await expect(tile(page, theVictim.name)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Reshuffle' })).toBeVisible()
    await expect(page.getByText('No teams yet')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Start class game' })).toBeEnabled()
    const theState = await stateOf(page)
    const theIds = theState.teams.flatMap((t) => t.players.map((p) => p.id))
    expect(theIds).toHaveLength(4)
    expect(theIds).not.toContain(theVictim.id)
  })

  test('absent toggle and Mark all here', async ({ page }) => {
    await openClassesTab(page)
    await addClass(page, 'Chem', ['Ana', 'Ben', 'Cy'])
    await expect(page.getByRole('button', { name: 'Mark all here' })).toHaveCount(0)
    await tile(page, 'Ben').click()
    await expect(page.getByRole('button', { name: 'Ben, Absent. Toggle attendance' })).toHaveAttribute('aria-pressed', 'false')
    await tile(page, 'Cy').click()
    await expect(page.getByRole('list', { name: 'Saved classes' }).getByRole('button', { name: /^Chem/ })).toContainText('1/3')
    let theStudents = (await stateOf(page)).classes[0].students
    expect(theStudents.map((s) => s.absent)).toEqual([false, true, true])

    // Toggling again marks one back.
    await tile(page, 'Cy').click()
    await expect(page.getByRole('button', { name: 'Cy, Here. Toggle attendance' })).toBeVisible()
    theStudents = (await stateOf(page)).classes[0].students
    expect(theStudents.map((s) => s.absent)).toEqual([false, true, false])

    await page.getByRole('button', { name: 'Mark all here' }).click()
    await expect(page.getByRole('button', { name: 'Mark all here' })).toHaveCount(0)
    theStudents = (await stateOf(page)).classes[0].students
    expect(theStudents.map((s) => s.absent)).toEqual([false, false, false])
  })

  test('split into N teams, sizes within one, absent excluded, reshuffle, move a student', async ({ page }) => {
    await openClassesTab(page)
    const theNames = makeNames(24)
    await addClass(page, 'Big class', theNames)
    await tile(page, 'Student 03').click()
    await tile(page, 'Student 17').click()
    await expect(page.getByText('No teams yet')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start class game' })).toBeDisabled()

    await setStepper(page.locator('body'), 'teams to split into', 8)
    await expect(page.getByRole('button', { name: 'Increase teams to split into' })).toBeDisabled()
    await setStepper(page.locator('body'), 'teams to split into', 4)
    await page.getByRole('button', { name: 'Split into 4' }).click()
    await expect(page.getByRole('button', { name: 'Reshuffle' })).toBeVisible()

    const checkSplit = async (theCount: number) => {
      const theState = await stateOf(page)
      expect(theState.teams).toHaveLength(theCount)
      expect(theState.settings.teamCount).toBe(theCount)
      const theSizes = theState.teams.map((t) => t.players.length)
      expect(Math.max(...theSizes) - Math.min(...theSizes)).toBeLessThanOrEqual(1)
      const theAll = theState.teams.flatMap((t) => t.players.map((p) => p.name)).sort()
      expect(theAll).toEqual(theNames.filter((n) => n !== 'Student 03' && n !== 'Student 17').sort())
      return theState
    }
    const theFirst = await checkSplit(4)

    await page.getByRole('button', { name: 'Reshuffle' }).click()
    await expect.poll(async () => (await stateOf(page)).teams[0].id).not.toBe(theFirst.teams[0].id)
    const theSecond = await checkSplit(4)

    // Move a student from team 1 to team 2 through the menu.
    const theMover = theSecond.teams[0].players[0]
    await page.getByRole('button', { name: 'Move ' + theMover.name + ' to another team' }).click()
    const theMenu = page.getByRole('menu')
    await expect(theMenu).toBeVisible()
    await expect(theMenu.getByRole('menuitem')).toHaveCount(3)
    await theMenu.getByRole('menuitem', { name: theSecond.teams[1].name }).click()
    await expect(theMenu).toBeHidden()
    await expect.poll(async () => (await stateOf(page)).teams[1].players.map((p) => p.id)).toContain(theMover.id)
    const theMoved = await stateOf(page)
    expect(theMoved.teams[0].players.map((p) => p.id)).not.toContain(theMover.id)
    expect(theMoved.teams[0].players.length + theMoved.teams[1].players.length).toBe(
      theSecond.teams[0].players.length + theSecond.teams[1].players.length,
    )

    // Split into a different count.
    await setStepper(page.locator('body'), 'teams to split into', 3)
    await page.getByRole('button', { name: 'Reshuffle' }).click()
    await checkSplit(3)

    // The Quick teams tab shows the class teams, locked to the roster.
    await page.getByRole('tab', { name: 'Quick teams' }).click()
    await expect(page.getByText(/Teams from/)).toContainText('Big class')
    await expect(page.getByRole('textbox', { name: /^Players on/ })).toHaveCount(0)
    await expect(page.getByText(/from Big class$/)).toBeVisible()
  })

  test('absent students are hidden after the split and never picked as guesser', async ({ page }) => {
    await openClassesTab(page)
    await addClass(page, 'Small', ['Ana', 'Ben', 'Cy', 'Dee'])
    await setStepper(page.locator('body'), 'teams to split into', 2)
    await page.getByRole('button', { name: 'Split into 2' }).click()
    await expect(page.getByRole('button', { name: 'Reshuffle' })).toBeVisible()
    const theState = await stateOf(page)
    const theAbsent = theState.teams[0].players[0]
    await tile(page, theAbsent.name).click()
    await expect(page.getByRole('button', { name: 'Move ' + theAbsent.name + ' to another team' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Start class game' }).click()
    await waitForPhase(page, 'teamup')
    await expect(page.getByRole('button', { name: /^Start turn/ })).toBeVisible()
    const theOther = theState.teams[0].players[1].name
    await expect(page.getByText(theOther + ' is guessing')).toBeVisible()
  })

  test('start a class game from the class teams', async ({ page }) => {
    await openClassesTab(page)
    await addClass(page, 'Period 5', ['Ana', 'Ben', 'Cy', 'Dee', 'Eli'])
    await page.getByRole('button', { name: 'Split into 2' }).click()
    await page.getByRole('button', { name: 'Start class game' }).click()
    await waitForPhase(page, 'teamup')
    const theState = await stateOf(page)
    expect(theState.game.mode).toBe('class')
    expect(theState.game.classId).toBe(theState.classes[0].id)
    await expect(page).toHaveURL(/#\/teamup$/)
    const theNames = theState.teams[0].players.map((p) => p.name)
    await expect(page.getByText(new RegExp('^(' + theNames.join('|') + ') is guessing'))).toBeVisible()
  })

  test('careers show after a finished class game', async ({ page }) => {
    await openClassesTab(page)
    const theDrawer = await openSettings(page)
    await setStepper(theDrawer, /^Rounds per game$/, 1)
    await setToggle(theDrawer, /3-2-1|countdown before turn/i, false)
    await setStepper(theDrawer, /wait before the next team|hand-off countdown/i, 0)
    await setStepper(theDrawer, /^Turn length$/, 60)
    await theDrawer.getByRole('button', { name: 'Done' }).click()
    await expect(theDrawer).toBeHidden()

    await addClass(page, 'Career class', ['Ana', 'Ben', 'Cy', 'Dee'])
    await page.getByRole('button', { name: 'Split into 2' }).click()
    await page.getByRole('button', { name: 'Start class game' }).click()
    await waitForPhase(page, 'teamup')
    await expect(page.getByRole('button', { name: /^Start turn/ })).toBeVisible()
    await page.keyboard.press('Space')
    await waitForPhase(page, 'live')
    await waitClockRunning(page)
    await expect(page.getByRole('group', { name: 'Turn controls' })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await stateOf(page)).game.history.length).toBe(1)
    const theGuesserId = (await stateOf(page)).game.history[0].guesserId
    const theGuesser = (await stateOf(page)).classes[0].students.find((s) => s.id === theGuesserId)
    expect(theGuesser).toBeDefined()
    const theName = (theGuesser as FullStudent).name
    await expect(page.getByRole('status').filter({ hasText: theName + ',' })).toContainText('Career: 1 correct.')

    await page.keyboard.press('Escape')
    await expect.poll(async () => (await readStore(page)).state.game.turnsLog.length, { timeout: 8_000 }).toBe(2)
    await waitForPhase(page, 'live')
    await waitClockRunning(page)
    await page.keyboard.press('Escape')
    await waitForPhase(page, 'podium', 8_000)

    const theState = await stateOf(page)
    const theClass = theState.classes[0]
    expect(theClass.totals.games).toBe(1)
    expect(theClass.totals.correct).toBe(1)
    const theStar = theClass.students.find((s) => s.id === theGuesserId) as FullStudent
    expect(theStar.career.correct).toBe(1)
    expect(theStar.career.turns).toBe(1)

    await page.getByRole('link', { name: 'Setup' }).click()
    await expect(startGameButton(page)).toBeVisible()
    // A teacher who last played a class lands back on the Classes tab.
    await expect(page.getByRole('tab', { name: 'Classes' })).toHaveAttribute('aria-selected', 'true')
    await expect(tile(page, theName)).toContainText('1 correct in 1 turn')
    const theUnplayed = theClass.students.filter((s) => s.career.turns === 0)
    expect(theUnplayed.length).toBeGreaterThan(0)
    await expect(tile(page, theUnplayed[0].name)).toContainText('No turns yet')
  })

  test('a class and its attendance survive a reload', async ({ page }) => {
    await openClassesTab(page)
    await addClass(page, 'Keep me', ['Ana', 'Ben', 'Cy', 'Dee'])
    await tile(page, 'Dee').click()
    await page.getByRole('button', { name: 'Split into 2' }).click()
    await expect(page.getByRole('button', { name: 'Reshuffle' })).toBeVisible()
    const theBefore = await stateOf(page)

    await page.reload()
    await expect(startGameButton(page)).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Classes' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('list', { name: 'Saved classes' }).getByRole('button', { name: /^Keep me/ })).toContainText('3/4')
    await expect(page.getByRole('button', { name: 'Dee, Absent. Toggle attendance' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reshuffle' })).toBeVisible()
    const theAfter = await stateOf(page)
    expect(theAfter.classes).toEqual(theBefore.classes)
    expect(theAfter.teams.map((t) => t.players.map((p) => p.id))).toEqual(theBefore.teams.map((t) => t.players.map((p) => p.id)))
  })

  test('the hero Start game button starts a class game when the teams come from a class', async ({ page }) => {
    await openClassesTab(page)
    await addClass(page, 'Enter class', ['Ana', 'Ben', 'Cy', 'Dee'])
    await page.getByRole('button', { name: 'Split into 2' }).click()
    await expect(page.getByRole('button', { name: 'Reshuffle' })).toBeVisible()
    await expect(page.getByText(/from Enter class$/)).toBeVisible()
    await startGameButton(page).click()
    await waitForPhase(page, 'teamup')
    expect((await stateOf(page)).game.mode).toBe('class')
  })
})
