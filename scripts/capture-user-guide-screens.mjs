import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const appUrl = process.env.ROLLZ_DOCS_URL || 'http://127.0.0.1:8081/';
const outputDir = resolve(process.cwd(), 'docs', 'images');

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function preparePage(page, mockValues) {
  let cursor = 0;

  await page.route(/random\.org\/integers/, async route => {
    const url = new URL(route.request().url());
    const count = Number.parseInt(url.searchParams.get('num') || '1', 10);
    const batch = mockValues.slice(cursor, cursor + count);
    cursor += count;

    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: `${batch.join('\n')}\n`,
    });
  });

  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

async function captureHome(page) {
  await preparePage(page, []);
  await page.screenshot({ path: resolve(outputDir, 'guide-accueil.png'), fullPage: true });
}

async function captureBasicRoll(page) {
  await preparePage(page, [4, 5]);
  await page.locator('#formula-input').fill('2d6 + 3');
  await page.locator('#roll-btn').click();
  await page.locator('#result-section').waitFor({ state: 'visible' });
  await page.locator('#result-section').screenshot({ path: resolve(outputDir, 'guide-lancer-classique.png') });
}

async function captureExpertMode(page) {
  await preparePage(page, []);
  await page.locator('label[for="expert-check"]').click();
  await page.locator('.expert-pad').waitFor({ state: 'visible' });
  await page.locator('.advantage-row').scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(outputDir, 'guide-mode-expert.png'), fullPage: true });
}

async function captureAdvancedRoll(page) {
  await preparePage(page, [1, 2, 4, 6, 5, 3]);
  await page.locator('label[for="expert-check"]').click();
  await page.locator('.expert-pad').waitFor({ state: 'visible' });
  await page.locator('.expert-numpad .expert-btn', { hasText: '4' }).click();
  await page.locator('.expert-dice .expert-btn', { hasText: 'd6' }).click();
  await page.locator('.expert-operators .expert-btn', { hasText: 'R' }).click();
  await page.locator('.expert-numpad .expert-btn', { hasText: '2' }).click();
  await page.locator('.expert-operators .expert-btn', { hasText: '≥' }).click();
  await page.locator('.expert-numpad .expert-btn', { hasText: '5' }).click();
  await page.locator('#roll-btn').click();
  await page.locator('#result-section').waitFor({ state: 'visible' });
  await page.locator('#result-card').screenshot({ path: resolve(outputDir, 'guide-formule-avancee.png') });
}

async function captureHistoryFavorites(page) {
  await preparePage(page, [4, 5, 2]);
  await page.locator('#formula-input').fill('1d6');
  await page.locator('#roll-btn').click();
  await page.locator('.history-entry').waitFor({ state: 'visible' });
  await page.locator('.favorite-btn').first().click();
  await page.locator('#formula-input').fill('1d8 + 2');
  await page.locator('#roll-btn').click();
  await page.locator('.history-entry').nth(1).waitFor({ state: 'visible' });
  await page.locator('.favorites-card').scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(outputDir, 'guide-historique-favoris.png'), fullPage: true });
}

async function main() {
  await ensureDir(outputDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1600 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    await captureHome(page);
    await captureBasicRoll(page);
    await captureExpertMode(page);
    await captureAdvancedRoll(page);
    await captureHistoryFavorites(page);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});