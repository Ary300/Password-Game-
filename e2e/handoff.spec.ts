import { STORE_KEY, waitForPhase } from './helpers'
import { expect, gotoTeamUp, readGame, seedGame, teamId, test, waitForLiveUi } from './helpers-turn'

type Sample = {
  phase: string
  round: number
  index: number
  turnId: string | null
  startedAt: number | null
  turnMs: number | null
  endAt: number | null
  endOutcome: string | null
  handoffEndsAt: number | null
  topBarRound: string
  heading: string
  now: number
}

// Samples inside the page so a sampler round trip never misses a 2 s banner or a phase flip.
async function startSampler(thePage: import('@playwright/test').Page): Promise<void> {
  await thePage.evaluate((theKey) => {
    const theSamples: Sample[] = []
    ;(window as unknown as { __samples: Sample[] }).__samples = theSamples
    window.setInterval(() => {
      const theRaw = localStorage.getItem(theKey)
      if (theRaw === null) {
        return
      }
      const theGame = JSON.parse(theRaw).state.game
      const theTurn = theGame.turn
      let theRoundText = ''
      const theSpans = document.querySelectorAll('header span')
      for (let n = 0; n < theSpans.length; n++) {
        const theText = theSpans[n].textContent ?? ''
        if (theText.indexOf('Round ') === 0) {
          theRoundText = theText
        }
      }
      theSamples.push({
        phase: theGame.phase,
        round: theGame.round,
        index: theGame.currentTeamIndex,
        turnId: theTurn === null ? null : theTurn.turnId,
        startedAt: theTurn === null ? null : theTurn.startedAt,
        turnMs: theTurn === null ? null : theTurn.turnMs,
        endAt: theTurn === null || theTurn.end === null ? null : theTurn.end.at,
        endOutcome: theTurn === null || theTurn.end === null ? null : theTurn.end.outcome,
        handoffEndsAt: theGame.handoffEndsAt,
        topBarRound: theRoundText,
        heading: document.querySelector('section[aria-label="Team up"] h1')?.textContent ?? '',
        now: Date.now(),
      })
    }, 40)
  }, STORE_KEY)
}

async function readSamples(thePage: import('@playwright/test').Page): Promise<Sample[]> {
  return thePage.evaluate(() => (window as unknown as { __samples: Sample[] }).__samples)
}

test.describe('Automatic hand-off loop', () => {
  test('5 s turns, 3 teams, 2 rounds: one Space plays the whole game to the podium', async ({ page }) => {
    test.setTimeout(200_000)
    await seedGame(page, {
      settings: { turnSeconds: 5, roundsPerGame: 2, sound: false },
      teams: [{ name: 'Red' }, { name: 'Gold' }, { name: 'Blue' }],
    })
    await gotoTeamUp(page)
    await expect(page.getByText('Round 1 of 2')).toBeVisible()
    await startSampler(page)
    await expect.poll(async () => (await readSamples(page)).length).toBeGreaterThan(0)
    await page.keyboard.press('Space')
    await waitForPhase(page, 'podium', 150_000)
    const theSamples = await readSamples(page)
    await expect(page).toHaveURL(/#\/podium/)

    const theGame = await readGame(page)
    const theTeams = ['Red', 'Gold', 'Blue']
    const theExpectedTeams = [teamId(0), teamId(1), teamId(2), teamId(0), teamId(1), teamId(2)]
    const theLogTeams: string[] = []
    const theLogRounds: number[] = []
    const theTurnIds = new Set<string>()
    for (let n = 0; n < theGame.turnsLog.length; n++) {
      theLogTeams.push(theGame.turnsLog[n].teamId)
      theLogRounds.push(theGame.turnsLog[n].round)
      theTurnIds.add(theGame.turnsLog[n].turnId)
    }
    expect(theLogTeams, 'team order, no double turns').toEqual(theExpectedTeams)
    expect(theLogRounds).toEqual([1, 1, 1, 2, 2, 2])
    expect(theTurnIds.size).toBe(6)

    expect(theGame.history.length, 'one timeup row per turn').toBe(6)
    for (let n = 0; n < theGame.history.length; n++) {
      const theRow = theGame.history[n]
      expect(theRow.outcome).toBe('timeup')
      expect(theRow.note).toBe('')
      expect(theRow.teamId).toBe(theExpectedTeams[n])
      expect(theRow.round).toBe(theLogRounds[n])
      expect(theRow.turnId).toBe(theGame.turnsLog[n].turnId)
    }

    // Phase path: collapse repeated samples into the sequence of screens the class saw.
    const thePath: string[] = []
    for (let n = 0; n < theSamples.length; n++) {
      const theSample = theSamples[n]
      let theKey = theSample.phase + ':' + String(theSample.round) + ':' + String(theSample.index)
      if (theSample.phase === 'live' && theSample.endOutcome !== null) {
        theKey = theKey + ':ended'
      }
      if (thePath.length === 0 || thePath[thePath.length - 1] !== theKey) {
        thePath.push(theKey)
      }
    }
    expect(thePath).toEqual([
      'teamup:1:0',
      'live:1:0',
      'live:1:0:ended',
      'teamup:1:1',
      'live:1:1',
      'live:1:1:ended',
      'teamup:1:2',
      'live:1:2',
      'live:1:2:ended',
      'teamup:2:0',
      'live:2:0',
      'live:2:0:ended',
      'teamup:2:1',
      'live:2:1',
      'live:2:1:ended',
      'teamup:2:2',
      'live:2:2',
      'live:2:2:ended',
      'podium:2:2',
    ])

    for (let n = 0; n < theSamples.length; n++) {
      const theSample = theSamples[n]
      if (theSample.phase === 'teamup' && theSample.heading.length > 0) {
        expect(theSample.heading).toBe(theTeams[theSample.index])
      }
      if ((theSample.phase === 'teamup' || theSample.phase === 'live') && theSample.topBarRound.length > 0) {
        expect(theSample.topBarRound).toBe('Round ' + String(theSample.round) + ' of 2')
      }
      // Every turn times out on time, and the hand-off starts after the 2 s banner.
      if (theSample.endAt !== null && theSample.startedAt !== null && theSample.turnMs !== null) {
        expect(theSample.endOutcome).toBe('timeup')
        expect(theSample.endAt - (theSample.startedAt + theSample.turnMs)).toBeGreaterThanOrEqual(0)
        expect(theSample.endAt - (theSample.startedAt + theSample.turnMs)).toBeLessThanOrEqual(50)
      }
    }
  })

  test('refresh during the hand-off keeps the countdown and starts on time', async ({ page }) => {
    test.setTimeout(60_000)
    await seedGame(page, { settings: { turnSeconds: 5, countdown: false, handoffSeconds: 8, sound: false }, teams: [{ name: 'Red' }, { name: 'Gold' }] })
    await gotoTeamUp(page)
    await page.keyboard.press('Space')
    await waitForPhase(page, 'live')
    await waitForPhase(page, 'teamup', 15_000)
    await expect(page.getByText('Starts in')).toBeVisible()
    const theEndsAt = (await readGame(page)).handoffEndsAt
    expect(theEndsAt).not.toBeNull()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Gold' })).toBeVisible()
    await expect(page.getByText('Starts in')).toBeVisible()
    let theAfter = await readGame(page)
    expect(theAfter.phase).toBe('teamup')
    expect(theAfter.handoffEndsAt).toBe(theEndsAt)
    await waitForPhase(page, 'live', 12_000)
    theAfter = await readGame(page)
    expect(theAfter.turnsLog.length).toBe(2)
    const theStartedAt = theAfter.turnsLog[1].at
    expect(theStartedAt - (theEndsAt ?? 0)).toBeGreaterThanOrEqual(0)
    expect(theStartedAt - (theEndsAt ?? 0)).toBeLessThan(250)
    await waitForLiveUi(page)
  })

  test('Space during the hand-off countdown starts early exactly once', async ({ page }) => {
    test.setTimeout(60_000)
    await seedGame(page, { settings: { turnSeconds: 5, countdown: false, handoffSeconds: 10, sound: false }, teams: [{ name: 'Red' }, { name: 'Gold' }] })
    await gotoTeamUp(page)
    await page.keyboard.press('Space')
    await waitForPhase(page, 'teamup', 15_000)
    await expect(page.getByRole('button', { name: /^Start now/ })).toBeVisible()
    await page.keyboard.press('Space')
    await waitForPhase(page, 'live')
    await waitForLiveUi(page)
    const theGame = await readGame(page)
    expect(theGame.turnsLog.length).toBe(2)
    expect(theGame.handoffEndsAt).toBeNull()
    expect(theGame.turn?.teamId).toBe(teamId(1))
    await page.waitForTimeout(1500)
    expect((await readGame(page)).turnsLog.length).toBe(2)
  })
})
