import { expect, test } from '@playwright/test'
import { collectConsoleErrors, startQuickGameToLive, waitForClockRunning } from './helpers'

test('first open, Start twice, playable live turn', async ({ page }) => {
  const theErrors = collectConsoleErrors(page)
  await startQuickGameToLive(page)
  await waitForClockRunning(page)
  await expect(page.getByRole('timer')).toBeVisible()
  expect(theErrors).toEqual([])
})
