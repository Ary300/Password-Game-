/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// base './' so the built app runs from GitHub Pages, a USB stick, or a local folder
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Playwright writes trace .html files under the project; watching them reloads every open test page mid-run.
  server: {
    watch: {
      ignored: ['**/test-results*/**', '**/playwright-report/**'],
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
