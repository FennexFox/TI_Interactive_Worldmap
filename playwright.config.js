// SPDX-FileCopyrightText: 2026 TI Interactive Worldmap contributors
// SPDX-License-Identifier: MIT

import { defineConfig } from '@playwright/test';

const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const inCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: inCI ? 2 : 0,
  workers: inCI ? 2 : undefined,
  reporter: inCI ? [['list'], ['html', {open: 'never'}]] : [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...(chromiumExecutablePath
      ? {launchOptions: {executablePath: chromiumExecutablePath}}
      : {}),
  },
  webServer: {
    command: 'python -m http.server 4174 --directory docs',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !inCI,
  },
});
