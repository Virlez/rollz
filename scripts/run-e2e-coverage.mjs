import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = process.cwd();
const coverageDir = resolve(rootDir, 'coverage', 'e2e');
const playwrightCli = require.resolve('@playwright/test/cli');

function runCommand(command, args, env = process.env) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env,
      stdio: 'inherit',
    });

    child.on('error', rejectPromise);
    child.on('exit', code => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

await rm(coverageDir, { recursive: true, force: true });

await runCommand(process.execPath, [playwrightCli, 'test', '-c', 'tests/playwright.config.ts', '--project=chromium'], {
  ...process.env,
  E2E_COVERAGE: '1',
});

await runCommand(process.execPath, ['scripts/generate-e2e-coverage.mjs']);