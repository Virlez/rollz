import { resolve } from 'node:path';
import { execPath } from 'node:process';

import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:8080';
const appDir = resolve(__dirname, '..', 'app');
const httpServerCli = require.resolve('http-server/bin/http-server');
const webServerCommand = `"${execPath}" "${httpServerCli}" "${appDir}" -p 8080 --silent`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: webServerCommand,
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
        timeout: 20000,
      },
});