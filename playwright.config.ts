import { defineConfig, devices } from '@playwright/test'

// Each spec gets its own server-backed browser context, so localStorage starts empty per test.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'projector-1080', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: 'laptop-1000', use: { ...devices['Desktop Chrome'], viewport: { width: 1000, height: 563 } } },
  ],
  webServer: {
    command: 'npx vite --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
