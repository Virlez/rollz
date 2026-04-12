import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import MCR from 'monocart-coverage-reports';

const rootDir = process.cwd();
const rawCoverageDir = resolve(rootDir, 'coverage', 'e2e', 'raw');
const reportDir = resolve(rootDir, 'coverage', 'e2e', 'report');
const appJsDir = resolve(rootDir, 'app', 'js').replace(/\\/g, '/');

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function resolveCoveragePath(filePath) {
  const normalized = normalizePath(filePath).replace(/\?.*$/, '');
  const knownBases = ['http://127.0.0.1:8080/', 'http://localhost:8080/'];

  for (const base of knownBases) {
    if (normalized.startsWith(base)) {
      return resolve(rootDir, 'app', normalized.slice(base.length));
    }
  }

  return filePath;
}

const rawFiles = (await readdir(rawCoverageDir, { withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
  .map(entry => resolve(rawCoverageDir, entry.name));

if (rawFiles.length === 0) {
  throw new Error('No E2E coverage data found. Run the coverage-enabled E2E suite first.');
}

const report = MCR({
  name: 'Rollz E2E Coverage',
  outputDir: reportDir,
  reports: [
    ['console-summary'],
    ['text-summary'],
    ['html'],
    ['lcovonly', { file: 'lcov.info' }],
    ['json-summary', { file: 'summary.json' }],
  ],
  sourcePath: resolveCoveragePath,
  sourceFilter: sourcePath => normalizePath(sourcePath).startsWith(appJsDir),
  all: {
    dir: [resolve(rootDir, 'app', 'js')],
    filter: {
      '**/*.js': true,
      '**/*': false,
    },
  },
});

for (const rawFile of rawFiles) {
  const coverageData = JSON.parse(await readFile(rawFile, 'utf8'));
  await report.add(coverageData);
}

await report.generate();