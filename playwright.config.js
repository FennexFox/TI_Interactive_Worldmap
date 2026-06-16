import { defineConfig } from '@playwright/test';

const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'on-first-retry',
    ...(chromiumExecutablePath
      ? {launchOptions: {executablePath: chromiumExecutablePath}}
      : {}),
  },
  webServer: {
    command: 'python -m http.server 4174 --directory docs',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
  },
});
