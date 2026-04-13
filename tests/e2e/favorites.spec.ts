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

  test('success-mode favorites restore the success toggle automatically', async ({ page }) => {
    await clearLocalStorageOnInit(page);
    await mockRandomOrg(page, [2, 5, 6, 1]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('success');
    await app.roll();
    await app.toggleHistoryFavorite(0);

    await app.toggleMode('success');
    await app.clearFormula();
    await app.clickFavoriteFormula(0);

    await expect(app.formulaInput).toHaveValue('2d6');
    await expect(app.modeCheckbox('success')).toBeChecked();
    await expect(app.modeCheckbox('advantage')).not.toBeChecked();
    await expect(app.modeCheckbox('disadvantage')).not.toBeChecked();

    await app.roll();

    await expect(app.resultTotalLabel).toHaveText('Réussites');
  });

  test('normal and success-mode favorites are stored separately for the same formula', async ({ page }) => {
    await clearLocalStorageOnInit(page);
    await mockRandomOrg(page, [4, 5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await app.toggleHistoryFavorite(0);
    await app.toggleMode('success');
    await app.rollFormula('1d6');
    await app.toggleHistoryFavorite(0);

    await expect(app.favoritesEntries).toHaveCount(2);
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
    await expect(app.formulaInputWrap).toBeFocused();
    await expect(app.formulaInput).not.toBeFocused();
    await expect(app.formulaInputWrap).toBeInViewport();
  });

  test('favorites can be reordered and keep their order after reload', async ({ page }) => {
    await mockRandomOrg(page, [2, 7]);

    const app = new RollzApp(page);
    await app.goto();
    await page.evaluate(() => localStorage.clear());
    await app.reload();
    await app.rollFormula('1d6');
    await app.toggleHistoryFavorite(0);
    await app.rollFormula('1d8');
    await app.toggleHistoryFavorite(0);

    await expect(app.favoriteFormula(0)).toHaveText('1d8');
    await expect(app.favoriteFormula(1)).toHaveText('1d6');

    await app.dragFavoriteTo(0, 1);

    await expect(app.favoriteFormula(0)).toHaveText('1d6');
    await expect(app.favoriteFormula(1)).toHaveText('1d8');

    await app.reload();

    await expect(app.favoriteFormula(0)).toHaveText('1d6');
    await expect(app.favoriteFormula(1)).toHaveText('1d8');
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