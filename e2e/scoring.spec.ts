import { expect, test } from '@playwright/test'
import { collectConsoleErrors } from './helpers'
import {
  game,
  openLeaderboardTab,
  pressForRow,
  pressNextTeam,
  readFull,
  readStandingRows,
  row,
  seedStore,
  standingRows,
  startGameFromSetup,
  startTurnFromTeamUp,
  team,
} from './helpers-board'

test.describe('scoring', () => {
  test('real game: correct with time bonus, skip, ended early, then podium and standings', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await seedStore(page, {
      settings: { pointsPerCorrect: 3, timeBonus: true, turnSeconds: 20, roundsPerGame: 1, skipsPerTurn: 1 },
      teams: [team(0, 'Panthers'), team(1, 'Owls')],
      game: game({ phase: 'setup', history: [] }),
    })
    await startGameFromSetup(page)
    await startTurnFromTeamUp(page)
    const theCorrect = await pressForRow(page, 'Enter')
    expect(theCorrect.outcome).toBe('correct')
    expect(theCorrect.secondsLeft).toBeGreaterThanOrEqual(19)
    // 3 per correct plus 1 per full 5 s left, so a 20 s turn tops out at 4 bonus points.
    expect(theCorrect.points).toBe(3 + Math.floor(theCorrect.secondsLeft / 5))
    expect(theCorrect.points).toBeGreaterThanOrEqual(6)
    await pressNextTeam(page)

    await startTurnFromTeamUp(page)
    const theSkip = await pressForRow(page, 's')
    expect(theSkip.outcome).toBe('skip')
    expect(theSkip.points).toBe(0)
    // The skip limit is 1, so a second S does nothing.
    await page.keyboard.press('s')
    await page.waitForTimeout(300)
    expect((await readFull(page)).state.game.history.length).toBe(2)
    const theEnded = await pressForRow(page, 'Escape')
    expect(theEnded.outcome).toBe('timeup')
    expect(theEnded.points).toBe(0)
    expect(theEnded.note).toBe('Ended early')
    await pressNextTeam(page)

    await expect.poll(async () => (await readFull(page)).state.game.phase).toBe('podium')
    await expect(page).toHaveURL(/#\/podium$/)
    await expect(page.getByRole('heading', { name: 'Panthers takes it' })).toBeVisible()

    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/leaderboard$/)
    await expect(standingRows(page)).toHaveCount(2)
    expect(await readStandingRows(page)).toEqual([
      ['1', 'Panthers', String(theCorrect.points), '1', '0', '1'],
      ['2', 'Owls', '0', '0', '1', '1'],
    ])
    expect(theErrors).toEqual([])
  })

  test('real game: time up earns 0 and is logged', async ({ page }) => {
    const theErrors = collectConsoleErrors(page)
    await seedStore(page, {
      settings: { turnSeconds: 5, roundsPerGame: 2, pointsPerCorrect: 2 },
      teams: [team(0, 'Panthers'), team(1, 'Owls')],
      game: game({ phase: 'setup', history: [] }),
    })
    await startGameFromSetup(page)
    await startTurnFromTeamUp(page)
    await expect.poll(async () => (await readFull(page)).state.game.history.length, { timeout: 9000 }).toBe(1)
    const theRow = (await readFull(page)).state.game.history[0]
    expect(theRow.outcome).toBe('timeup')
    expect(theRow.points).toBe(0)
    expect(theRow.secondsLeft).toBe(0)
    expect(theRow.note).toBe('')
    await page.keyboard.press('l')
    await expect(page).toHaveURL(/#\/leaderboard$/)
    expect(await readStandingRows(page)).toEqual([
      ['1', 'Panthers', '0', '0', '0', '1'],
      ['1', 'Owls', '0', '0', '0', '0'],
    ])
    await openLeaderboardTab(page, 'Round history')
    await expect(page.getByRole('region', { name: 'Round 1' }).getByText('Time up')).toBeVisible()
    expect(theErrors).toEqual([])
  })

  test('standings rank by points, then correct, then fewest skips, with shared ranks', async ({ page }) => {
    const theTeams = [team(0, 'Echo'), team(1, 'Bravo'), team(2, 'Charlie'), team(3, 'Alpha'), team(4, 'Delta')]
    const theHistory = [
      // Echo: 1 point.
      row({ teamId: 'team-0', outcome: 'correct', points: 1 }),
      // Bravo: 3 points, 3 correct, 1 skip.
      row({ teamId: 'team-1', outcome: 'correct', turnId: 'b1' }),
      row({ teamId: 'team-1', outcome: 'correct', turnId: 'b1' }),
      row({ teamId: 'team-1', outcome: 'skip', turnId: 'b1' }),
      row({ teamId: 'team-1', outcome: 'correct', turnId: 'b2' }),
      // Charlie: 3 points from 2 correct (one with bonus), 0 skips.
      row({ teamId: 'team-2', outcome: 'correct', points: 2 }),
      row({ teamId: 'team-2', outcome: 'correct', points: 1 }),
      // Alpha: 3 points, 3 correct, 0 skips.
      row({ teamId: 'team-3', outcome: 'correct', turnId: 'a1' }),
      row({ teamId: 'team-3', outcome: 'correct', turnId: 'a1' }),
      row({ teamId: 'team-3', outcome: 'correct', turnId: 'a2' }),
      // Delta: identical to Alpha, so they share first.
      row({ teamId: 'team-4', outcome: 'correct', turnId: 'd1' }),
      row({ teamId: 'team-4', outcome: 'correct', turnId: 'd2' }),
      row({ teamId: 'team-4', outcome: 'correct', turnId: 'd2' }),
      row({ teamId: 'team-4', outcome: 'timeup', turnId: 'd3' }),
    ]
    await seedStore(page, { teams: theTeams, game: game({ phase: 'teamup', handoffHeld: true, history: theHistory }) })
    await page.goto('/#/leaderboard')
    await expect(standingRows(page)).toHaveCount(5)
    expect(await readStandingRows(page)).toEqual([
      ['1', 'Alpha', '3', '3', '0', '2'],
      ['1', 'Delta', '3', '3', '0', '3'],
      ['3', 'Bravo', '3', '3', '1', '2'],
      ['4', 'Charlie', '3', '2', '0', '2'],
      ['5', 'Echo', '1', '1', '0', '1'],
    ])
    await expect(standingRows(page).nth(0).getByText('Tied')).toBeVisible()
    await expect(standingRows(page).nth(1).getByText('Tied')).toBeVisible()
    await expect(standingRows(page).nth(2).getByText('Tied')).toHaveCount(0)

    // The podium table uses the same ranks.
    await page.getByRole('button', { name: 'End game' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'End game' }).click()
    await expect(page).toHaveURL(/#\/podium$/)
    const theTable = page.getByRole('list', { name: 'Full standings' }).locator(':scope > li')
    await expect(theTable).toHaveCount(5)
    const theRanks: string[] = []
    for (let n = 0; n < 5; n++) {
      theRanks.push((await theTable.nth(n).locator('span').first().innerText()).trim())
    }
    expect(theRanks).toEqual(['1', '1', '3', '4', '5'])
    await expect(page.getByRole('heading', { name: "It's a tie" })).toBeVisible()
    await expect(page.getByText('Alpha and Delta share first')).toBeVisible()
  })

  test('score edit adds an adjust row and every total is derived from history', async ({ page }) => {
    const theHistory = [
      row({ teamId: 'team-0', outcome: 'correct', points: 2 }),
      row({ teamId: 'team-1', outcome: 'correct', points: 1 }),
    ]
    await seedStore(page, { teams: [team(0, 'Panthers'), team(1, 'Owls')], game: game({ phase: 'teamup', handoffHeld: true, history: theHistory }) })
    await page.goto('/#/leaderboard')
    await page.getByRole('button', { name: 'Edit score for Owls, now 1' }).click()
    const theInput = page.getByRole('spinbutton', { name: 'New score for Owls' })
    await expect(theInput).toBeFocused()
    await theInput.fill('5')
    await theInput.press('Enter')
    await expect(page.getByRole('button', { name: 'Edit score for Owls, now 5' })).toBeVisible()
    expect(await readStandingRows(page)).toEqual([
      ['1', 'Owls', '5', '1', '0', '1'],
      ['2', 'Panthers', '2', '1', '0', '1'],
    ])
    const theStore = (await readFull(page)).state.game
    expect(theStore.history.length).toBe(3)
    const theAdjust = theStore.history[2]
    expect(theAdjust.outcome).toBe('adjust')
    expect(theAdjust.teamId).toBe('team-1')
    expect(theAdjust.points).toBe(4)
    expect(theAdjust.note).toBe('Score edited +4 (1 to 5)')

    // A lower edit logs a negative delta, and the sum of rows still equals the total.
    await page.getByRole('button', { name: 'Edit score for Panthers, now 2' }).click()
    await page.getByRole('spinbutton', { name: 'New score for Panthers' }).fill('-1')
    await page.getByRole('spinbutton', { name: 'New score for Panthers' }).press('Enter')
    await expect(page.getByRole('button', { name: 'Edit score for Panthers, now -1' })).toBeVisible()
    const theAfter = (await readFull(page)).state.game.history
    expect(theAfter[3].points).toBe(-3)
    expect(theAfter[3].note).toBe('Score edited -3 (2 to -1)')
    let thePanthers = 0
    for (let n = 0; n < theAfter.length; n++) {
      if (theAfter[n].teamId === 'team-0') {
        thePanthers = thePanthers + theAfter[n].points
      }
    }
    expect(thePanthers).toBe(-1)

    // A reload recomputes the same totals from the saved history.
    await page.reload()
    await expect(page.getByRole('button', { name: 'Edit score for Owls, now 5' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit score for Panthers, now -1' })).toBeVisible()

    await openLeaderboardTab(page, 'Round history')
    await expect(page.getByText('Score edited +4 (1 to 5)')).toBeVisible()
    await expect(page.getByText('Score edited -3 (2 to -1)')).toBeVisible()
  })
})
