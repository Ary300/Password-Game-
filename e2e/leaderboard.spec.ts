import { expect, test, type Page } from '@playwright/test'
import { collectConsoleErrors, expectNoPageScroll } from './helpers'
import {
  classRoom,
  downloadText,
  expectNamesNotClipped,
  game,
  openLeaderboardTab,
  readFull,
  readStandingRows,
  row,
  seedStore,
  standingRows,
  startGameFromSetup,
  startTurnFromTeamUp,
  student,
  team,
  teamFromStudents,
  type SeedRow,
} from './helpers-board'

function threeTeamHistory(): SeedRow[] {
  return [
    row({ teamId: 'team-0', outcome: 'correct', turnId: 't0', word: 'apple', guesser: 'Ava', secondsLeft: 12 }),
    row({ teamId: 'team-0', outcome: 'skip', turnId: 't0', word: 'banana', guesser: 'Ava', secondsLeft: 8 }),
    row({ teamId: 'team-1', outcome: 'correct', turnId: 't1', word: 'cherry, ripe', guesser: 'Ben', points: 2 }),
    row({ teamId: 'team-1', outcome: 'correct', turnId: 't1', word: 'date', guesser: 'Ben' }),
    row({ teamId: 'team-2', outcome: 'timeup', turnId: 't2', word: 'elderberry', guesser: 'Cy', secondsLeft: 0 }),
  ]
}

async function seedThreeTeams(thePage: Page, thePhase: 'teamup' | 'podium' = 'teamup'): Promise<void> {
  await seedStore(thePage, {
    teams: [team(0, 'Panthers', ['Ava']), team(1, 'Owls', ['Ben']), team(2, 'Foxes', ['Cy'])],
    game: game({ phase: thePhase, handoffHeld: true, round: 2, currentTeamIndex: 0, committed: thePhase === 'podium', history: threeTeamHistory() }),
  })
}

// A class game already on the podium, with its numbers committed to the class exactly as endGame would have.
function committedClassSeed() {
  const theAva = student('s-ava', 'Ava', { correct: 2, turns: 1, skips: 1, bestMs: 2500 })
  const theBen = student('s-ben', 'Ben', { correct: 1, turns: 1, skips: 0, bestMs: 6000 })
  const theCy = student('s-cy', 'Cy', { correct: 0, turns: 1, skips: 0, bestMs: null })
  const theDee = student('s-dee', 'Dee')
  const theHistory = [
    row({ teamId: 'team-0', outcome: 'correct', turnId: 'ta', word: 'kite', guesserId: 's-ava', guesser: 'Ava', elapsedMs: 2500, secondsLeft: 17 }),
    row({ teamId: 'team-0', outcome: 'skip', turnId: 'ta', word: 'lamp', guesserId: 's-ava', guesser: 'Ava', secondsLeft: 12 }),
    row({ teamId: 'team-0', outcome: 'correct', turnId: 'ta', word: 'moon', guesserId: 's-ava', guesser: 'Ava', elapsedMs: 3000, secondsLeft: 9, swappedFrom: ['Dee'] }),
    row({ teamId: 'team-1', outcome: 'correct', turnId: 'tb', word: 'nest', guesserId: 's-ben', guesser: 'Ben', elapsedMs: 6000, secondsLeft: 14 }),
    row({ teamId: 'team-1', outcome: 'timeup', turnId: 'tc', word: 'oven', guesserId: 's-cy', guesser: 'Cy', secondsLeft: 6, note: 'Ended early' }),
    row({ teamId: 'team-0', outcome: 'adjust', points: 1, note: 'Score edited +1 (2 to 3)' }),
  ]
  const theClass = classRoom('class-a', 'Period 1', [theAva, theBen, theCy, theDee], { games: 1, turns: 3, correct: 3 })
  return {
    teams: [teamFromStudents(0, 'Panthers', [theAva, theDee]), teamFromStudents(1, 'Owls', [theBen, theCy])],
    game: game({ phase: 'podium', mode: 'class', classId: 'class-a', committed: true, history: theHistory }),
    classes: [theClass],
    activeClassId: 'class-a',
  }
}

test.describe('leaderboard', () => {
  test('This game tab lists ranked rows with points, correct, skipped, and turns', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await seedThreeTeams(page)
    await page.goto('/#/leaderboard')
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    await expect(standingRows(page)).toHaveCount(3)
    expect(await readStandingRows(page)).toEqual([
      ['1', 'Owls', '3', '2', '0', '1'],
      ['2', 'Panthers', '1', '1', '1', '1'],
      ['3', 'Foxes', '0', '0', '0', '1'],
    ])
    await expect(page.getByText('Round 2', { exact: true })).toBeVisible()
    await expectNoPageScroll(page)
    expect(theErrors).toEqual([])
  })

  test('inline score edit saves on Enter, Escape cancels and stays, bad input is refused', async ({ page }) => {
    await seedThreeTeams(page)
    await page.goto('/#/leaderboard')
    await page.getByRole('button', { name: 'Edit score for Foxes, now 0' }).click()
    const theInput = page.getByRole('spinbutton', { name: 'New score for Foxes' })
    await expect(theInput).toBeFocused()
    await theInput.fill('4')
    await theInput.press('Enter')
    await expect(page.getByRole('button', { name: 'Edit score for Foxes, now 4' })).toBeVisible()
    expect((await readStandingRows(page))[0]).toEqual(['1', 'Foxes', '4', '0', '0', '1'])

    await page.getByRole('button', { name: 'Edit score for Foxes, now 4' }).click()
    await page.getByRole('spinbutton', { name: 'New score for Foxes' }).fill('99')
    await page.getByRole('spinbutton', { name: 'New score for Foxes' }).press('Escape')
    await expect(page.getByRole('spinbutton', { name: 'New score for Foxes' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Edit score for Foxes, now 4' })).toBeVisible()
    await page.waitForTimeout(300)
    await expect(page).toHaveURL(/#\/leaderboard$/)
    expect((await readFull(page)).state.game.history.length).toBe(6)

    await page.getByRole('button', { name: 'Edit score for Owls, now 3' }).click()
    await page.getByRole('spinbutton', { name: 'New score for Owls' }).fill('')
    await page.getByRole('spinbutton', { name: 'New score for Owls' }).press('Enter')
    await expect(page.getByText("Type a whole number to set Owls's score")).toBeVisible()
    await expect(page.getByRole('spinbutton', { name: 'New score for Owls' })).toBeVisible()
    expect((await readFull(page)).state.game.history.length).toBe(6)
  })

  test('Resume game returns to Team up, and End game has cancel and confirm', async ({ page }) => {
    await seedThreeTeams(page)
    await page.goto('/#/leaderboard')
    await page.getByRole('button', { name: 'Resume game' }).click()
    await expect(page).toHaveURL(/#\/teamup$/)
    await expect(page.getByRole('region', { name: 'Team up' })).toBeVisible()

    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/leaderboard$/)
    await page.getByRole('button', { name: 'End game' }).click()
    const theDialog = page.getByRole('dialog', { name: 'End the game now?' })
    await expect(theDialog).toBeVisible()
    await theDialog.getByRole('button', { name: 'Keep playing' }).click()
    await expect(theDialog).toHaveCount(0)
    await expect(page).toHaveURL(/#\/leaderboard$/)
    expect((await readFull(page)).state.game.phase).toBe('teamup')

    await page.getByRole('button', { name: 'End game' }).click()
    await page.getByRole('dialog', { name: 'End the game now?' }).getByRole('button', { name: 'End game' }).click()
    await expect(page).toHaveURL(/#\/podium$/)
    const theGame = (await readFull(page)).state.game
    expect(theGame.phase).toBe('podium')
    expect(theGame.committed).toBe(true)
    await expect(page.getByRole('heading', { name: 'Owls takes it' })).toBeVisible()

    // After the game ends the leaderboard offers the podium instead of Resume.
    await page.getByRole('button', { name: 'View history' }).click()
    await expect(page).toHaveURL(/#\/leaderboard$/)
    await expect(page.getByRole('button', { name: 'Resume game' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'End game' })).toHaveCount(0)
    await page.getByRole('button', { name: 'View podium' }).click()
    await expect(page).toHaveURL(/#\/podium$/)
  })

  test('Export CSV downloads standings and history rows', async ({ page }) => {
    await seedThreeTeams(page)
    await page.goto('/#/leaderboard')
    const theFile = await downloadText(page, () => page.getByRole('button', { name: 'Export CSV' }).click())
    expect(theFile.name).toBe('park-tudor-password-results.csv')
    const theLines = theFile.text.split('\n')
    expect(theLines.slice(0, 5)).toEqual([
      'Rank,Team,Points,Correct,Skipped,Turns',
      '1,Owls,3,2,0,1',
      '2,Panthers,1,1,1,1',
      '3,Foxes,0,0,0,1',
      '',
    ])
    expect(theLines[5]).toBe('Round,Team,Guesser,Swapped from,Word,Outcome,Seconds left,Seconds to guess,Points,Note')
    expect(theLines.length).toBe(11)
    expect(theLines[6]).toBe('1,Panthers,Ava,,apple,correct,12,4.0,1,')
    expect(theLines[7]).toBe('1,Panthers,Ava,,banana,skip,8,4.0,0,')
    expect(theLines[8]).toBe('1,Owls,Ben,,"cherry, ripe",correct,10,4.0,2,')
    expect(theLines[10]).toBe('1,Foxes,Cy,,elderberry,timeup,0,4.0,0,')
  })

  test('round history shows every outcome, and editing or removing a row updates standings, podium, and class careers', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await seedStore(page, committedClassSeed())
    await page.goto('/#/leaderboard')
    expect(await readStandingRows(page)).toEqual([
      ['1', 'Panthers', '3', '2', '1', '1'],
      ['2', 'Owls', '1', '1', '0', '2'],
    ])
    await openLeaderboardTab(page, 'Round history')
    const theRound = page.getByRole('region', { name: 'Round 1' })
    await expect(theRound.getByText('3 correct, 4 points')).toBeVisible()
    const theItems = theRound.locator('li')
    await expect(theItems).toHaveCount(6)
    // Newest first.
    await expect(theItems.nth(0)).toContainText('Score edited +1 (2 to 3)')
    await expect(theItems.nth(0)).toContainText('Score edit')
    await expect(theItems.nth(1)).toContainText('oven')
    await expect(theItems.nth(1)).toContainText('Time up')
    await expect(theItems.nth(1)).toContainText('Ended early')
    await expect(theItems.nth(2)).toContainText('nest')
    await expect(theItems.nth(2)).toContainText('Correct')
    await expect(theItems.nth(3)).toContainText('moon')
    await expect(theItems.nth(3)).toContainText('Swapped from Dee')
    await expect(theItems.nth(4)).toContainText('lamp')
    await expect(theItems.nth(4)).toContainText('Skip')

    // Change Ava's "kite" from correct to time up.
    await page.getByRole('button', { name: 'Change or remove kite for Panthers' }).click()
    const theDialog = page.getByRole('dialog', { name: 'Change kite' })
    await expect(theDialog).toBeVisible()
    await expect(theDialog.getByText('Career and class totals update too.')).toBeVisible()
    await theDialog.getByRole('radio', { name: 'Time up' }).click()
    await expect(theDialog.getByText('17 s left')).toBeVisible()
    await theDialog.getByRole('button', { name: 'Save' }).click()
    await expect(theDialog).toHaveCount(0)
    await expect(theItems.nth(5)).toContainText('Time up')
    await expect(theItems.nth(5)).toContainText('Changed from Correct')

    let theState = (await readFull(page)).state
    let theClass = theState.classes[0]
    expect(theClass.totals).toEqual({ games: 1, turns: 3, correct: 2 })
    expect(theClass.students[0].career.correct).toBe(1)

    // Remove Ben's only correct row.
    await page.getByRole('button', { name: 'Change or remove nest for Owls' }).click()
    const theRemove = page.getByRole('dialog', { name: 'Change nest' })
    await theRemove.getByRole('button', { name: 'Remove row' }).click()
    await theRemove.getByRole('button', { name: 'Click again to remove' }).click()
    await expect(theRemove).toHaveCount(0)
    await expect(theRound.locator('li')).toHaveCount(5)
    await expect(theRound.getByText('nest')).toHaveCount(0)

    theState = (await readFull(page)).state
    theClass = theState.classes[0]
    expect(theClass.totals).toEqual({ games: 1, turns: 3, correct: 1 })
    expect(theClass.students[1].career.correct).toBe(0)

    await openLeaderboardTab(page, 'This game')
    expect(await readStandingRows(page)).toEqual([
      ['1', 'Panthers', '2', '1', '1', '1'],
      ['2', 'Owls', '0', '0', '0', '1'],
    ])
    await openLeaderboardTab(page, 'Class board')
    const theClassRow = page.getByRole('list', { name: 'Class standings' }).locator(':scope > li').first()
    await expect(theClassRow).toContainText('0.33')
    await expect(page.getByRole('list', { name: 'Top guessers in Period 1' })).toContainText('Ava')
    await expect(page.getByRole('list', { name: 'Top guessers in Period 1' })).not.toContainText('Ben')

    await openLeaderboardTab(page, 'This game')
    await page.getByRole('button', { name: 'View podium' }).click()
    await expect(page).toHaveURL(/#\/podium$/)
    const theTable = page.getByRole('list', { name: 'Full standings' }).locator(':scope > li')
    await expect(theTable.nth(0)).toContainText('Panthers')
    await expect(theTable.nth(0)).toContainText('2')
    await expect(theTable.nth(1)).toContainText('Owls')
    await expect(page.getByRole('heading', { name: 'Panthers takes it' })).toBeVisible()

    // Removing the score edit row takes its point away.
    await page.goto('/#/leaderboard')
    await openLeaderboardTab(page, 'Round history')
    await page.getByRole('button', { name: 'Remove score edit for Panthers' }).click()
    const theAdjust = page.getByRole('dialog', { name: 'Remove score edit' })
    await theAdjust.getByRole('button', { name: 'Remove row' }).click()
    await theAdjust.getByRole('button', { name: 'Click again to remove' }).click()
    await openLeaderboardTab(page, 'This game')
    expect((await readStandingRows(page))[0]).toEqual(['1', 'Panthers', '1', '1', '1', '1'])
    expect(theErrors).toEqual([])
  })

  test('Players tab shows turns, correct, skips, and best time per player', async ({ page }) => {
    await seedStore(page, committedClassSeed())
    await page.goto('/#/leaderboard')
    await openLeaderboardTab(page, 'Players')
    const theRows = page.getByRole('list', { name: 'Player stats this game' }).locator(':scope > li')
    await expect(theRows).toHaveCount(4)
    const theTexts: string[][] = []
    for (let n = 0; n < 4; n++) {
      const theCells = theRows.nth(n).locator(':scope > span')
      theTexts.push(await theCells.allInnerTexts())
    }
    expect(theTexts.map((theCells) => theCells.map((theText) => theText.trim()))).toEqual([
      ['1', 'Ava', 'Panthers', '1', '2', '1', '2.5 s'],
      ['2', 'Ben', 'Owls', '1', '1', '0', '6.0 s'],
      ['3', 'Cy', 'Owls', '1', '0', '0', 'None'],
      ['', 'Dee', 'Panthers', '0', '0', '0', 'None'],
    ])
    await expectNoPageScroll(page)
  })

  test('Class board ranks classes by average, resets with cancel, confirm, and careers, and lists top guessers', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    const theP1 = classRoom('class-1', 'Period 1', [student('a1', 'Ava', { correct: 4 }), student('a2', 'Ben', { correct: 1 })], { games: 2, turns: 10, correct: 5 })
    const theP2 = classRoom(
      'class-2',
      'Period 2',
      [student('b1', 'Cy', { correct: 2 }), student('b2', 'Dee', { correct: 1 }), student('b3', 'Eli', { correct: 3 }), student('b4', 'Fay', { correct: 5 })],
      { games: 1, turns: 4, correct: 3 },
    )
    const theP3 = classRoom('class-3', 'Period 3', [student('c1', 'Gus')])
    await seedStore(page, {
      teams: [team(0, 'Team 1'), team(1, 'Team 2')],
      game: game({ phase: 'setup', history: [] }),
      classes: [theP1, theP3, theP2],
    })
    await page.goto('/#/leaderboard')
    await openLeaderboardTab(page, 'Class board')
    const theRows = page.getByRole('list', { name: 'Class standings' }).locator(':scope > li')
    await expect(theRows).toHaveCount(3)
    await expect(theRows.nth(0)).toContainText('Period 2')
    await expect(theRows.nth(0)).toContainText('0.75')
    await expect(theRows.nth(1)).toContainText('Period 1')
    await expect(theRows.nth(1)).toContainText('0.50')
    await expect(theRows.nth(2)).toContainText('Period 3')
    await expect(theRows.nth(2)).toContainText('No guesses yet')
    const theTop = page.getByRole('list', { name: 'Top guessers in Period 2' }).locator('li')
    await expect(theTop).toHaveCount(3)
    const theTopTexts = (await theTop.allInnerTexts()).map((theText) => theText.replace(/\s+/g, ' ').trim())
    expect(theTopTexts).toEqual(['Fay 5', 'Eli 3', 'Cy 2'])

    // Cancel keeps everything.
    await page.getByRole('button', { name: 'Reset totals for Period 2' }).click()
    const theDialog = page.getByRole('dialog', { name: 'Reset Period 2?' })
    await expect(theDialog).toBeVisible()
    await theDialog.getByRole('button', { name: 'Keep totals' }).click()
    await expect(theDialog).toHaveCount(0)
    expect((await readFull(page)).state.classes[2].totals).toEqual({ games: 1, turns: 4, correct: 3 })

    // Reset totals only: careers and top guessers stay.
    await page.getByRole('button', { name: 'Reset totals for Period 1' }).click()
    await page.getByRole('dialog', { name: 'Reset Period 1?' }).getByRole('button', { name: 'Reset class' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    let theClasses = (await readFull(page)).state.classes
    expect(theClasses[0].totals).toEqual({ games: 0, turns: 0, correct: 0 })
    expect(theClasses[0].students[0].career.correct).toBe(4)
    await expect(page.getByRole('list', { name: 'Top guessers in Period 1' })).toContainText('Ava')
    await expect(theRows.nth(0)).toContainText('Period 2')

    // Reset with careers clears the top guessers too.
    await page.getByRole('button', { name: 'Reset totals for Period 2' }).click()
    const theCareerDialog = page.getByRole('dialog', { name: 'Reset Period 2?' })
    await theCareerDialog.getByRole('switch').click()
    await expect(theCareerDialog.getByRole('switch')).toHaveAttribute('data-state', 'checked')
    await theCareerDialog.getByRole('button', { name: 'Reset class' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    theClasses = (await readFull(page)).state.classes
    expect(theClasses[2].totals).toEqual({ games: 0, turns: 0, correct: 0 })
    for (let n = 0; n < theClasses[2].students.length; n++) {
      expect(theClasses[2].students[n].career).toEqual({ correct: 0, turns: 0, skips: 0, bestMs: null })
    }
    await expect(page.getByRole('list', { name: 'Top guessers in Period 2' })).toHaveCount(0)
    await expectNoPageScroll(page)
    expect(theErrors).toEqual([])
  })

  test('L opens the leaderboard mid-turn and back, and the clock keeps running', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await seedStore(page, {
      settings: { turnSeconds: 5, roundsPerGame: 3, autoAdvance: true, handoffSeconds: 30 },
      teams: [team(0, 'Panthers'), team(1, 'Owls')],
      game: game({ phase: 'setup', history: [] }),
    })
    await startGameFromSetup(page)
    await startTurnFromTeamUp(page)
    const theTurnId = ((await readFull(page)).state.game.turn as { turnId: string }).turnId
    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/leaderboard$/)
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    await page.waitForTimeout(800)
    let theTurn = (await readFull(page)).state.game.turn as { turnId: string; pausedAt: number | null; end: unknown }
    expect(theTurn.turnId).toBe(theTurnId)
    expect(theTurn.pausedAt).toBeNull()
    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/live$/)
    await expect(page.getByRole('timer')).toBeVisible()
    theTurn = (await readFull(page)).state.game.turn as { turnId: string; pausedAt: number | null; end: unknown }
    expect(theTurn.pausedAt).toBeNull()

    // Leave again and let the clock run out while the leaderboard is up.
    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/leaderboard$/)
    await expect.poll(async () => (await readFull(page)).state.game.phase, { timeout: 12_000 }).toBe('teamup')
    await expect(page).toHaveURL(/#\/leaderboard$/)
    expect(await readStandingRows(page)).toEqual([
      ['1', 'Panthers', '0', '0', '0', '1'],
      ['1', 'Owls', '0', '0', '0', '0'],
    ])
    await page.getByRole('button', { name: 'Resume game' }).click()
    await expect(page).toHaveURL(/#\/teamup$/)
    await expect(page.getByRole('region', { name: 'Team up' })).toContainText('Owls')

    // Escape on the leaderboard also goes back.
    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/leaderboard$/)
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/#\/teamup$/)
    expect(theErrors).toEqual([])
  })

  test('no page scroll on every tab with eight teams and a long history', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    const theTeams = []
    const theHistory: SeedRow[] = []
    for (let n = 0; n < 8; n++) {
      theTeams.push(team(n, 'Tigers Rugby Gang ' + String(n + 1), ['Peggy ' + String(n) + 'a', 'Peggy ' + String(n) + 'b']))
      for (let i = 0; i < 6; i++) {
        theHistory.push(row({ teamId: 'team-' + String(n), outcome: i % 3 === 0 ? 'skip' : 'correct', round: i + 1, turnId: 'x' + String(n) + String(i), guesserId: 'team-' + String(n) + '-p' + String(i % 2), guesser: 'Peggy ' + String(n) + (i % 2 === 0 ? 'a' : 'b'), word: 'juggling' + String(n) + String(i) }))
      }
    }
    const theClasses = []
    for (let n = 0; n < 6; n++) {
      theClasses.push(classRoom('k' + String(n), 'Spring Group ' + String(n + 1), [student('k' + String(n) + 's', 'Peggy ' + String(n), { correct: n + 1 })], { games: 1, turns: 10, correct: n }))
    }
    await seedStore(page, { teams: theTeams, game: game({ phase: 'teamup', handoffHeld: true, round: 6, history: theHistory }), classes: theClasses })
    await page.goto('/#/leaderboard')
    await expect(standingRows(page)).toHaveCount(8)
    await expectNoPageScroll(page)
    await expectNamesNotClipped(standingRows(page).locator(':scope > div:nth-child(2) > span'))
    const theNameCells: Record<string, string> = {
      Players: '[aria-label="Player stats this game"] > li > span:nth-child(2)',
      'Round history': 'section[aria-label="Round 6"] li > span:nth-child(3)',
      'Class board': '[aria-label="Class standings"] > li > div > div > span:first-child',
      'This game': '[aria-label="Team standings"] > li > div:nth-child(2) > span',
    }
    for (const theTab of ['Players', 'Round history', 'Class board', 'This game']) {
      await openLeaderboardTab(page, theTab)
      await page.waitForTimeout(200)
      await expectNoPageScroll(page)
      await expectNamesNotClipped(page.locator(theNameCells[theTab]))
    }
    expect(theErrors).toEqual([])
  })
})

test('leaderboard empty state before any game', async ({ page }) => {
  await page.goto('/#/leaderboard')
  await expect(page.getByRole('heading', { name: 'No scores yet' })).toBeVisible()
  await expectNoPageScroll(page)
  await page.getByRole('button', { name: 'Start a game' }).click()
  await expect(page).toHaveURL(/#\/$/)
})
