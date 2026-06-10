import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalTeardown: './tests/global-teardown.mjs',
  timeout: 15000,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'tests/report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4000',
    headless: true,
    screenshot: 'on',
    video: 'off',
    // Save screenshots to tests/screenshots/<test-name>/
    screenshotPath: 'tests/screenshots',
  },
  projects: [
    { name: 'chromium' },
  ],
});
