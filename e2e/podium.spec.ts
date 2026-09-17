import { expect, test, type Locator, type Page } from '@playwright/test'
import { collectConsoleErrors, expectNoPageScroll } from './helpers'
import {
  classRoom,
  downloadText,
  expectNamesNotClipped,
  game,
  overlaps,
  podiumBlocks,
  pressForRow,
  pressNextTeam,
  readFull,
  row,
  seedStore,
  startGameFromSetup,
  startTurnFromTeamUp,
  student,
  team,
  teamFromStudents,
  type Box,
  type SeedRow,
  type SeedTeam,
} from './helpers-board'

const NAMES = ['Panthers', 'Owls', 'The Magnificent Seven Foxes', 'Hawks', 'Wolves of Room 214', 'Bears', 'Tigers Tigers', 'Otters']

function rankedGame(theCount: number): { teams: SeedTeam[]; history: SeedRow[] } {
  const theTeams: SeedTeam[] = []
  const theHistory: SeedRow[] = []
  for (let n = 0; n < theCount; n++) {
    theTeams.push(team(n, NAMES[n]))
    // Later teams score more, so standings order differs from team order.
    const thePoints = n + 1
    for (let i = 0; i < thePoints; i++) {
      theHistory.push(row({ teamId: 'team-' + String(n), outcome: 'correct', turnId: 'turn-' + String(n), round: 1 }))
    }
  }
  return { teams: theTeams, history: theHistory }
}

async function box(theLocator: Locator): Promise<Box> {
  const theBox = await theLocator.boundingBox()
  if (theBox === null) {
    throw new Error('element has no box')
  }
  return theBox
}

function blockParts(theBlock: Locator) {
  const theLabel = theBlock.locator(':scope > div').nth(0)
  return {
    name: theLabel.locator(':scope > span').nth(0),
    points: theLabel.locator(':scope > span').nth(1),
    stand: theBlock.locator(':scope > div').nth(1),
  }
}

async function expectPodiumLayout(thePage: Page, theCount: number): Promise<void> {
  const theBlocks = podiumBlocks(thePage)
  const theShown = Math.min(3, theCount)
  await expect(theBlocks).toHaveCount(theShown)
  const theBoxes: { name: Box; points: Box; stand: Box; rank: string }[] = []
  for (let n = 0; n < theShown; n++) {
    const theParts = blockParts(theBlocks.nth(n))
    await expect(theParts.name).toBeVisible()
    theBoxes.push({
      name: await box(theParts.name),
      points: await box(theParts.points),
      stand: await box(theParts.stand),
      rank: (await theParts.stand.innerText()).trim(),
    })
    const theRankBox = await box(theParts.stand.locator('span'))
    const theStand = theBoxes[n].stand
    expect(theRankBox.y + theRankBox.height, 'rank numeral fits its block').toBeLessThanOrEqual(theStand.y + theStand.height + 1)
  }
  // Second on the left, first in the middle and tallest, third on the right.
  const theExpected = ['2', '1', '3'].slice(0, theShown)
  expect(theBoxes.map((theItem) => theItem.rank)).toEqual(theExpected)
  for (let n = 1; n < theBoxes.length; n++) {
    expect(theBoxes[n].name.x).toBeGreaterThan(theBoxes[n - 1].name.x)
  }
  expect(theBoxes[1].stand.height).toBeGreaterThan(theBoxes[0].stand.height)
  if (theShown === 3) {
    expect(theBoxes[0].stand.height).toBeGreaterThan(theBoxes[2].stand.height)
  }
  const theAll: Box[] = []
  for (let n = 0; n < theBoxes.length; n++) {
    expect(overlaps(theBoxes[n].name, theBoxes[n].points), 'name and points overlap').toBe(false)
    expect(overlaps(theBoxes[n].points, theBoxes[n].stand), 'points and block overlap').toBe(false)
    expect(overlaps(theBoxes[n].name, theBoxes[n].stand), 'name and block overlap').toBe(false)
    theAll.push(theBoxes[n].name, theBoxes[n].points, theBoxes[n].stand)
  }
  for (let n = 0; n < theAll.length; n++) {
    for (let i = n + 1; i < theAll.length; i++) {
      if (Math.floor(n / 3) !== Math.floor(i / 3)) {
        expect(overlaps(theAll[n], theAll[i]), 'blocks overlap across places').toBe(false)
      }
    }
  }
  // The header, the stands, and the table stack without touching.
  const theHeading = await box(thePage.locator('main section header h1'))
  const theTable = await box(thePage.getByRole('list', { name: 'Full standings' }))
  for (let n = 0; n < theAll.length; n++) {
    expect(overlaps(theHeading, theAll[n]), 'heading overlaps the podium').toBe(false)
    expect(overlaps(theTable, theAll[n]), 'table overlaps the podium').toBe(false)
  }
  const theNames = []
  for (let n = 0; n < theShown; n++) {
    theNames.push(blockParts(theBlocks.nth(n)).name)
  }
  for (let n = 0; n < theNames.length; n++) {
    await expectNamesNotClipped(theNames[n])
  }
  await expectNamesNotClipped(thePage.getByRole('list', { name: 'Full standings' }).locator(':scope > li > span:nth-child(2)'))
  await expectNamesNotClipped(thePage.locator('main section header h1'))
  await expectNoPageScroll(thePage)
}

test.describe('podium', () => {
  for (const theCount of [2, 3, 4, 8]) {
    test(theCount + ' team podium shows top three, winner line, and full table without overlap', async ({ page }) => {
      const theErrors = collectConsoleErrors(page)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const theSeed = rankedGame(theCount)
      await seedStore(page, { teams: theSeed.teams, game: game({ phase: 'podium', committed: true, history: theSeed.history }) })
      await page.goto('/#/podium')
      const theWinner = NAMES[theCount - 1]
      await expect(page.getByRole('heading', { name: theWinner + ' takes it' })).toBeVisible()
      const theTable = page.getByRole('list', { name: 'Full standings' }).locator(':scope > li')
      await expect(theTable).toHaveCount(theCount)
      for (let n = 0; n < theCount; n++) {
        await expect(theTable.nth(n).locator('span').nth(0)).toHaveText(String(n + 1))
        await expect(theTable.nth(n).locator('span').nth(1)).toHaveText(NAMES[theCount - 1 - n])
        await expect(theTable.nth(n).locator('span').last()).toHaveText(String(theCount - n))
      }
      const theMiddle = blockParts(podiumBlocks(page).nth(1))
      await expect(theMiddle.name).toHaveText(theWinner)
      await expect(theMiddle.points).toHaveText(String(theCount) + (theCount === 1 ? ' pt' : ' pts'))
      await expectPodiumLayout(page, theCount)
      expect(theErrors).toEqual([])
    })
  }

  test('two teams tied for first share the top line and stand equally tall', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const theHistory = [
      row({ teamId: 'team-0', outcome: 'correct', turnId: 'a' }),
      row({ teamId: 'team-1', outcome: 'correct', turnId: 'b' }),
      row({ teamId: 'team-1', outcome: 'correct', turnId: 'b' }),
      row({ teamId: 'team-2', outcome: 'correct', turnId: 'c' }),
      row({ teamId: 'team-2', outcome: 'correct', turnId: 'c' }),
    ]
    await seedStore(page, { teams: [team(0, 'Panthers'), team(1, 'Owls'), team(2, 'Foxes')], game: game({ phase: 'podium', committed: true, history: theHistory }) })
    await page.goto('/#/podium')
    await expect(page.getByRole('heading', { name: "It's a tie" })).toBeVisible()
    await expect(page.getByText('Owls and Foxes share first')).toBeVisible()
    const theBlocks = podiumBlocks(page)
    await expect(theBlocks).toHaveCount(3)
    const theLeft = blockParts(theBlocks.nth(0))
    const theMiddle = blockParts(theBlocks.nth(1))
    const theRight = blockParts(theBlocks.nth(2))
    await expect(theLeft.stand).toHaveText('1')
    await expect(theMiddle.stand).toHaveText('1')
    await expect(theRight.stand).toHaveText('3')
    expect(Math.abs((await box(theLeft.stand)).height - (await box(theMiddle.stand)).height)).toBeLessThanOrEqual(1)
    const theTable = page.getByRole('list', { name: 'Full standings' }).locator(':scope > li')
    await expect(theTable.nth(0).locator('span').nth(0)).toHaveText('1')
    await expect(theTable.nth(1).locator('span').nth(0)).toHaveText('1')
    await expect(theTable.nth(2).locator('span').nth(0)).toHaveText('3')
    await expectNoPageScroll(page)
  })

  test('Enter is ignored for 2.5 s after the podium appears, then plays again', async ({ page }) => {
    const theSeed = rankedGame(3)
    await seedStore(page, { teams: theSeed.teams, game: game({ phase: 'podium', committed: true, history: theSeed.history }) })
    await page.goto('/#/podium')
    await expect(page.getByRole('button', { name: /play again/i })).toBeVisible()
    const theShownAt = Date.now()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    expect(Date.now() - theShownAt).toBeLessThan(2400)
    expect((await readFull(page)).state.game.phase).toBe('podium')
    await expect(page).toHaveURL(/#\/podium$/)
    await page.waitForTimeout(Math.max(0, 2700 - (Date.now() - theShownAt)))
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readFull(page)).state.game.phase).toBe('teamup')
    await expect(page).toHaveURL(/#\/teamup$/)
    const theState = (await readFull(page)).state
    expect(theState.game.history).toEqual([])
    expect(theState.teams.map((theTeam) => theTeam.name)).toEqual(NAMES.slice(0, 3))
  })

  test('Export CSV and View history from the podium', async ({ page }) => {
    const theSeed = rankedGame(2)
    await seedStore(page, { teams: theSeed.teams, game: game({ phase: 'podium', committed: true, history: theSeed.history }) })
    await page.goto('/#/podium')
    const theFile = await downloadText(page, () => page.getByRole('button', { name: 'Export CSV' }).click())
    expect(theFile.name).toBe('park-tudor-password-results.csv')
    const theLines = theFile.text.split('\n')
    expect(theLines.slice(0, 4)).toEqual(['Rank,Team,Points,Correct,Skipped,Turns', '1,Owls,2,2,0,1', '2,Panthers,1,1,0,1', ''])
    expect(theLines[4]).toBe('Round,Team,Guesser,Swapped from,Word,Outcome,Seconds left,Seconds to guess,Points,Note')
    expect(theLines.length).toBe(8)
    await page.getByRole('button', { name: 'View history' }).click()
    await expect(page).toHaveURL(/#\/leaderboard$/)
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
  })

  test('real class games: podium, Play again keeps teams and mode, New game returns to Setup, careers commit once', async ({ page }) => {
    test.setTimeout(150_000)
    const theErrors = collectConsoleErrors(page)
    const theStudents = [student('s-ava', 'Ava'), student('s-ben', 'Ben'), student('s-cy', 'Cy'), student('s-dee', 'Dee')]
    const theTeams = [teamFromStudents(0, 'Panthers', [theStudents[0], theStudents[1]]), teamFromStudents(1, 'Owls', [theStudents[2], theStudents[3]])]
    await seedStore(page, {
      settings: { roundsPerGame: 1, turnSeconds: 20, skipsPerTurn: 1 },
      teams: theTeams,
      game: game({ phase: 'setup', history: [] }),
      classes: [classRoom('class-a', 'Period 1', theStudents)],
      activeClassId: 'class-a',
    })

    // Game one through the real UI.
    await startGameFromSetup(page)
    let theState = (await readFull(page)).state
    expect(theState.game.mode).toBe('class')
    expect(theState.game.classId).toBe('class-a')
    await startTurnFromTeamUp(page)
    const theFirst = await pressForRow(page, 'Enter')
    await pressNextTeam(page)
    await startTurnFromTeamUp(page)
    await pressForRow(page, 's')
    await pressForRow(page, 'Escape')
    await pressNextTeam(page)
    await expect(page).toHaveURL(/#\/podium$/)
    await expect(page.getByRole('heading', { name: 'Panthers takes it' })).toBeVisible()
    theState = (await readFull(page)).state
    expect(theState.game.committed).toBe(true)
    expect(theState.classes[0].totals).toEqual({ games: 1, turns: 2, correct: 1 })
    const theGuesser = theState.classes[0].students.find((theStudent) => theStudent.id === theFirst.guesserId)
    expect(theGuesser?.career.correct).toBe(1)
    expect(theGuesser?.career.turns).toBe(1)
    const theCareersAfterOne = theState.classes[0].students.map((theStudent) => theStudent.career)

    // A reload on the podium must not commit again.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Panthers takes it' })).toBeVisible()
    expect((await readFull(page)).state.classes[0].totals).toEqual({ games: 1, turns: 2, correct: 1 })

    await page.getByRole('button', { name: /play again/i }).click()
    await expect(page).toHaveURL(/#\/teamup$/)
    theState = (await readFull(page)).state
    expect(theState.game.phase).toBe('teamup')
    expect(theState.game.mode).toBe('class')
    expect(theState.game.classId).toBe('class-a')
    expect(theState.game.history).toEqual([])
    expect(theState.game.committed).toBe(false)
    expect(theState.teams.map((theTeam) => theTeam.id)).toEqual(['team-0', 'team-1'])
    expect(theState.teams.map((theTeam) => theTeam.players.map((thePlayer) => thePlayer.id))).toEqual([['s-ava', 's-ben'], ['s-cy', 's-dee']])
    expect(theState.classes[0].totals).toEqual({ games: 1, turns: 2, correct: 1 })
    expect(theState.classes[0].students.map((theStudent) => theStudent.career)).toEqual(theCareersAfterOne)

    // Game two through the real UI.
    await startTurnFromTeamUp(page)
    await pressForRow(page, 'Enter')
    await pressNextTeam(page)
    await startTurnFromTeamUp(page)
    await pressForRow(page, 'Enter')
    await pressNextTeam(page)
    await expect(page).toHaveURL(/#\/podium$/)
    await expect(page.getByRole('heading', { name: "It's a tie" })).toBeVisible()
    expect((await readFull(page)).state.classes[0].totals).toEqual({ games: 2, turns: 4, correct: 3 })

    await page.getByRole('button', { name: 'New game' }).click()
    await expect(page).toHaveURL(/#\/$/)
    await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()
    theState = (await readFull(page)).state
    expect(theState.game.phase).toBe('setup')
    expect(theState.classes[0].totals).toEqual({ games: 2, turns: 4, correct: 3 })
    let theCorrect = 0
    for (let n = 0; n < theState.classes[0].students.length; n++) {
      theCorrect = theCorrect + theState.classes[0].students[n].career.correct
    }
    expect(theCorrect).toBe(3)
    expect(theErrors).toEqual([])
  })

  test('New game from a podium reached by End game commits once, and starting over mid-game still counts the class game', async ({ page }) => {
    const theStudents = [student('s-ava', 'Ava'), student('s-ben', 'Ben')]
    const theHistory = [row({ teamId: 'team-0', outcome: 'correct', turnId: 'x', guesserId: 's-ava', guesser: 'Ava' })]
    await seedStore(page, {
      settings: { roundsPerGame: 3 },
      teams: [teamFromStudents(0, 'Panthers', [theStudents[0]]), teamFromStudents(1, 'Owls', [theStudents[1]])],
      game: game({ phase: 'teamup', handoffHeld: true, mode: 'class', classId: 'class-a', history: theHistory }),
      classes: [classRoom('class-a', 'Period 1', theStudents)],
      activeClassId: 'class-a',
    })
    await page.goto('/#/leaderboard')
    await page.getByRole('button', { name: 'End game' }).click()
    await page.getByRole('dialog', { name: 'End the game now?' }).getByRole('button', { name: 'End game' }).click()
    await expect(page).toHaveURL(/#\/podium$/)
    expect((await readFull(page)).state.classes[0].totals).toEqual({ games: 1, turns: 1, correct: 1 })
    await page.getByRole('button', { name: 'New game' }).click()
    await expect(page).toHaveURL(/#\/$/)
    let theState = (await readFull(page)).state
    expect(theState.classes[0].totals).toEqual({ games: 1, turns: 1, correct: 1 })
    expect(theState.classes[0].students[0].career.correct).toBe(1)

    // Start a class game, play one turn, then start over from Setup: that game ends and counts once.
    await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await readFull(page)).state.game.phase).toBe('teamup')
    expect((await readFull(page)).state.game.mode).toBe('class')
    await startTurnFromTeamUp(page)
    await pressForRow(page, 'Enter')
    await pressNextTeam(page)
    await page.getByRole('navigation', { name: 'Screens' }).getByRole('link', { name: 'Setup' }).click()
    await expect(page).toHaveURL(/#\/$/)
    await expect(page.getByRole('button', { name: /start game/i })).toBeVisible()
    await page.getByRole('button', { name: /start game/i }).click()
    await expect.poll(async () => (await readFull(page)).state.game.history.length).toBe(0)
    theState = (await readFull(page)).state
    expect(theState.classes[0].totals).toEqual({ games: 2, turns: 2, correct: 2 })
    expect(theState.classes[0].students[0].career.correct + theState.classes[0].students[1].career.correct).toBe(2)
  })
})
