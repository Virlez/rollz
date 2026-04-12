import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, test as base } from '@playwright/test';

const coverageEnabled = process.env.E2E_COVERAGE === '1';
const rawCoverageDir = resolve(process.cwd(), 'coverage', 'e2e', 'raw');

export const test = base.extend<{ _coverageCollector: void }>({
  _coverageCollector: [
    async ({ browserName, page }, use) => {
      if (!coverageEnabled || browserName !== 'chromium') {
        await use();
        return;
      }

      await mkdir(rawCoverageDir, { recursive: true });
      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
      });

      await use();

      const coverageEntries = await page.coverage.stopJSCoverage();

      const outputPath = resolve(rawCoverageDir, `${Date.now()}-${randomUUID()}.json`);
      await writeFile(outputPath, JSON.stringify(coverageEntries), 'utf8');
    },
    { auto: true },
  ],
});

export { expect };