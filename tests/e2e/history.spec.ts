import { expect, test } from '@playwright/test';

import { RollzApp } from './support/rollz-app';
import { mockRandomOrg } from './support/test-helpers';

test.describe('Roll history', () => {
  test('history shows entry after a roll', async ({ page }) => {
    await mockRandomOrg(page, [4]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');

    await expect(app.historyEntries).toHaveCount(1);
  });

  test('history entry shows formula and total', async ({ page }) => {
    await mockRandomOrg(page, [4]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');

    await expect(app.historyFormula(0)).toHaveText('1d6');
    await expect(app.historyTotal(0)).toHaveText('4');
  });

  test('multi-roll history entry keeps the full formula and both totals', async ({ page }) => {
    await mockRandomOrg(page, [10, 3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d20 + 4;1d8 + 2');

    await expect(app.historyFormula(0)).toHaveText('1d20 + 4;1d8 + 2');
    await expect(app.historyTotal(0)).toHaveText('14 | 5');
  });

  test('multiple rolls add multiple history entries', async ({ page }) => {
    await mockRandomOrg(page, [3, 5, 2]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d6');
    await app.roll();
    await app.roll();
    await app.roll();

    await expect(app.historyEntries).toHaveCount(3);
  });

  test('most recent roll appears first in history', async ({ page }) => {
    await mockRandomOrg(page, [3, 6]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d6');
    await app.roll();
    await app.roll();
    await expect(app.historyEntries).toHaveCount(2);

    await expect(app.historyTotal(0)).toHaveText('6');
  });

  test('clicking a history entry rerolls the same formula automatically', async ({ page }) => {
    await mockRandomOrg(page, [4, 6]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await expect(app.resultTotal).toHaveText('4');

    await app.clearFormula();
    await app.clickHistoryEntry(0);

    await expect(app.formulaInput).toHaveValue('1d6');
    await expect(app.resultTotal).toHaveText('6');
    await expect(app.historyEntries).toHaveCount(2);
  });

  test('clicking history entry records a new roll with the same formula', async ({ page }) => {
    await mockRandomOrg(page, [4, 2]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await app.clearFormula();
    await app.clickHistoryEntry(0);

    await expect(app.historyFormula(0)).toHaveText('1d6');
    await expect(app.historyTotal(0)).toHaveText('2');
  });

  test('history reroll preserves saved advantage instead of current toggles', async ({ page }) => {
    await mockRandomOrg(page, [3, 18, 4, 2]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20');
    await app.toggleMode('advantage');
    await app.roll();
    await expect(app.resultTotal).toHaveText('18');

    await app.toggleMode('advantage');
    await app.clearFormula();
    await app.clickHistoryEntry(0);

    await expect(app.resultTotal).toHaveText('4');
    await expect(page.locator('.is-kept')).toHaveCount(1);
  });

  test('history reroll preserves saved normal mode instead of current toggles', async ({ page }) => {
    await mockRandomOrg(page, [5, 2, 6]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await expect(app.resultTotal).toHaveText('5');

    await app.toggleMode('advantage');
    await app.clearFormula();
    await app.clickHistoryEntry(0);

    await expect(app.resultTotal).toHaveText('2');
    await expect(page.locator('.is-kept')).toHaveCount(0);
    await expect(page.locator('.is-discarded')).toHaveCount(0);
  });

  test('history reroll preserves saved success mode instead of current toggles', async ({ page }) => {
    await mockRandomOrg(page, [2, 3, 6, 1]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('success');
    await app.roll();
    await expect(app.resultTotal).toHaveText('1');
    await expect(app.resultTotalLabel).toHaveText('Réussites');

    await app.toggleMode('advantage');
    await app.clearFormula();
    await app.clickHistoryEntry(0);

    await expect(app.resultTotal).toHaveText('1');
    await expect(app.resultTotalLabel).toHaveText('Réussites');
    await expect(app.resultBreakdown.locator('.die-result.is-success')).toHaveCount(1);
    await expect(app.resultBreakdown.locator('.die-result.is-failure')).toHaveCount(1);
  });

  test('clear all button removes all history entries', async ({ page }) => {
    await mockRandomOrg(page, [4, 5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d6');
    await app.roll();
    await app.roll();
    await app.clearHistory();

    await expect(app.historyEntries).toHaveCount(0);
    await expect(app.historyEmpty).toBeVisible();
  });

  test('history is persisted across page reloads', async ({ page }) => {
    await mockRandomOrg(page, [3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await expect(app.historyEntries).toHaveCount(1);

    await app.reload();

    await expect(app.historyEntries).toHaveCount(1);
  });
});