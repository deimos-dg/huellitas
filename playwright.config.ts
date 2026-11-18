import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:5174'

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL,
    channel: process.env.HUELLITAS_BROWSER_CHANNEL,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev --workspace @huellitas/web -- --port 5174',
    url: baseURL,
    reuseExistingServer: false,
  },
})
