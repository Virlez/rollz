import { RollzApp } from './support/rollz-app';
import { expect, test } from './support/test';
import { clearLocalStorageOnInit, mockRandomOrg } from './support/test-helpers';

test.describe('Favorite formulas', () => {
  test('saving a history entry creates a persistent favorite', async ({ page }) => {
    await mockRandomOrg(page, [4]);

    const app = new RollzApp(page);
    await app.goto();
    await page.evaluate(() => localStorage.clear());
    await app.reload();
    await app.rollFormula('1d6');
    await app.toggleHistoryFavorite(0);

    await expect(app.favoritesEntries).toHaveCount(1);
    await expect(app.favoriteFormula(0)).toHaveText('1d6');
    await expect(app.historyFavoriteButton(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(app.historyFavoriteButton(0)).toHaveText('★');

    await app.reload();

    await expect(app.favoritesEntries).toHaveCount(1);
    await expect(app.favoriteFormula(0)).toHaveText('1d6');
  });

  test('favorites are deduplicated by exact formula', async ({ page }) => {
    await clearLocalStorageOnInit(page);
    await mockRandomOrg(page, [2, 5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await app.rollFormula('1d6');
    await app.toggleHistoryFavorite(0);

    await expect(app.favoritesEntries).toHaveCount(1);
  });

  test('clicking a favorite loads its formula without rolling', async ({ page }) => {
    await clearLocalStorageOnInit(page);
    await mockRandomOrg(page, [6, 2, 5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('2d6R2');
    await expect(app.resultTotal).toHaveText('11');
    await app.toggleHistoryFavorite(0);
    await app.clearFormula();
    await app.clickFavoriteFormula(0);

    await expect(app.formulaInput).toHaveValue('2d6R2');
    await expect(app.resultTotal).toHaveText('11');
    await expect(app.rollButton).toBeEnabled();
  });

  test('removing a favorite updates the list and the history button state', async ({ page }) => {
    await clearLocalStorageOnInit(page);
    await mockRandomOrg(page, [3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await app.toggleHistoryFavorite(0);
    await app.removeFavorite(0);

    await expect(app.favoritesEntries).toHaveCount(0);
    await expect(app.favoritesEmpty).toBeVisible();
    await expect(app.historyFavoriteButton(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(app.historyFavoriteButton(0)).toHaveText('☆');
  });
});