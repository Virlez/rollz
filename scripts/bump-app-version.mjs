import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const constantsPath = path.join(rootDir, 'app', 'js', 'constants.js');
const indexPath = path.join(rootDir, 'app', 'index.html');

const APP_VERSION_RE = /export const APP_VERSION = '([^']+)';/;
const ASSET_VERSION_RE = /(manifest\.webmanifest\?v=|css\/styles\.css\?v=)([^"']+)/g;

function pad(value) {
  return String(value).padStart(2, '0');
}

function todayVersionPrefix() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function computeNextVersion(currentVersion) {
  const match = currentVersion.match(/^(\d{4}-\d{2}-\d{2})-(\d+)$/);
  const todayPrefix = todayVersionPrefix();

  if (!match) {
    return `${todayPrefix}-1`;
  }

  const [, currentPrefix, currentBuild] = match;
  if (currentPrefix === todayPrefix) {
    return `${todayPrefix}-${Number.parseInt(currentBuild, 10) + 1}`;
  }

  return `${todayPrefix}-1`;
}

function parseArgs(args) {
  let explicitVersion = null;
  let dryRun = false;

  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg.startsWith('--version=')) {
      explicitVersion = arg.slice('--version='.length);
      continue;
    }

    if (!explicitVersion) {
      explicitVersion = arg;
    }
  }

  return { explicitVersion, dryRun };
}

function validateVersion(version) {
  if (!/^\d{4}-\d{2}-\d{2}-\d+$/.test(version)) {
    throw new Error(`Invalid version format: ${version}. Expected YYYY-MM-DD-N.`);
  }
}

async function main() {
  const { explicitVersion, dryRun } = parseArgs(process.argv.slice(2));
  const constantsSource = await readFile(constantsPath, 'utf8');
  const indexSource = await readFile(indexPath, 'utf8');

  const versionMatch = constantsSource.match(APP_VERSION_RE);
  if (!versionMatch) {
    throw new Error(`APP_VERSION not found in ${constantsPath}`);
  }

  const currentVersion = versionMatch[1];
  const nextVersion = explicitVersion || computeNextVersion(currentVersion);
  validateVersion(nextVersion);

  const updatedConstants = constantsSource.replace(APP_VERSION_RE, `export const APP_VERSION = '${nextVersion}';`);
  const updatedIndex = indexSource.replace(ASSET_VERSION_RE, `$1${nextVersion}`);

  if (updatedConstants === constantsSource && updatedIndex === indexSource) {
    console.log(`No changes needed. Current version is already ${nextVersion}.`);
    return;
  }

  if (dryRun) {
    console.log(`Current version: ${currentVersion}`);
    console.log(`Next version: ${nextVersion}`);
    return;
  }

  await writeFile(constantsPath, updatedConstants, 'utf8');
  await writeFile(indexPath, updatedIndex, 'utf8');

  console.log(`Updated app version: ${currentVersion} -> ${nextVersion}`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});