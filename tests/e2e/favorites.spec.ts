import { RollzApp } from './support/rollz-app';
import { expect, test } from './support/test';
import { clearLocalStorageOnInit, mockRandomOrg } from './support/test-helpers';

const DEFAULT_CATEGORY = 'General';

test.describe('Favorite formulas', () => {
  test('saving a history entry creates a persistent favorite in the default category', async ({ page }) => {
    await mockRandomOrg(page, [4]);

    const app = new RollzApp(page);
    await app.goto();
    await page.evaluate(() => localStorage.clear());
    await app.reload();
    await app.rollFormula('1d6');
    await app.saveHistoryFavorite(0);

    await expect(app.favoriteCategories).toHaveCount(1);
    await expect(app.favoriteCategoryByName(DEFAULT_CATEGORY)).toBeVisible();
    await expect(app.favoriteFormulaInCategory(DEFAULT_CATEGORY, 0)).toHaveText('1d6');
    await expect(app.historyFavoriteButton(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(app.historyFavoriteButton(0)).toHaveText('★');

    await app.reload();

    await expect(app.favoriteCategories).toHaveCount(1);
    await expect(app.favoriteFormulaInCategory(DEFAULT_CATEGORY, 0)).toHaveText('1d6');
  });

  test('favorites are deduplicated inside a category but can exist in another category', async ({ page }) => {
    await clearLocalStorageOnInit(page);
    await mockRandomOrg(page, [2, 5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.createFavoriteCategory('Attaques');
    await app.rollFormula('1d6');
    await app.rollFormula('1d6');
    await app.saveHistoryFavorite(0, { expectedCount: 1 });
    await app.saveHistoryFavorite(0, { expectedCount: 1 });
    await app.saveHistoryFavorite(0, { category: 'Attaques', label: 'Epee', expectedCount: 2 });

    await expect(app.favoritesEntries).toHaveCount(2);
    await expect(app.favoriteFormulaInCategory(DEFAULT_CATEGORY, 0)).toHaveText('1d6');
    await expect(app.favoriteFormulaInCategory('Attaques', 0)).toHaveText('1d6');
    await expect(app.favoriteLabelInCategory('Attaques', 0)).toHaveText('Epee');
  });

  test('success-mode favorites restore the success toggle automatically', async ({ page }) => {
    await clearLocalStorageOnInit(page);
    await mockRandomOrg(page, [2, 5, 6, 1]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('success');
    await app.roll();
    await app.saveHistoryFavorite(0, { label: 'Jet de groupe' });

    await app.toggleMode('success');
    await app.clearFormula();
    await app.favoriteEntryInCategory(DEFAULT_CATEGORY, 0).locator('.favorite-load-btn').click();

    await expect(app.formulaInput).toHaveValue('2d6');
    await expect(app.modeCheckbox('success')).toBeChecked();
    await expect(app.modeCheckbox('advantage')).not.toBeChecked();
    await expect(app.modeCheckbox('disadvantage')).not.toBeChecked();

    await app.roll();

    await expect(app.resultTotalLabel).toHaveText('Réussites');
  });

  test('clicking a favorite loads its formula without rolling', async ({ page }) => {
    await clearLocalStorageOnInit(page);
    await mockRandomOrg(page, [6, 2, 5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('2d6R2');
    await expect(app.resultTotal).toHaveText('11');
    await app.saveHistoryFavorite(0, { label: 'Dommages' });
    await app.clearFormula();
    await app.favoriteEntryInCategory(DEFAULT_CATEGORY, 0).locator('.favorite-load-btn').click();

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
    await app.saveHistoryFavorite(0);
    await app.rollFormula('1d8');
    await app.saveHistoryFavorite(0);

    await expect(app.favoriteFormulaInCategory(DEFAULT_CATEGORY, 0)).toHaveText('1d8');
    await expect(app.favoriteFormulaInCategory(DEFAULT_CATEGORY, 1)).toHaveText('1d6');

    await app.dragFavoriteTo(0, 1);

    await expect(app.favoriteFormulaInCategory(DEFAULT_CATEGORY, 0)).toHaveText('1d6');
    await expect(app.favoriteFormulaInCategory(DEFAULT_CATEGORY, 1)).toHaveText('1d8');

    await app.reload();

    await expect(app.favoriteFormulaInCategory(DEFAULT_CATEGORY, 0)).toHaveText('1d6');
    await expect(app.favoriteFormulaInCategory(DEFAULT_CATEGORY, 1)).toHaveText('1d8');
  });

  test('favorites can move across categories and collapsed state persists', async ({ page }) => {
    await mockRandomOrg(page, [3, 6]);

    const app = new RollzApp(page);
    await app.goto();
    await page.evaluate(() => localStorage.clear());
    await app.reload();
    await app.createFavoriteCategory('Sorts');
    await app.rollFormula('1d6');
    await app.saveHistoryFavorite(0);
    await app.rollFormula('1d8');
    await app.saveHistoryFavorite(0);

    await app.dragFavoriteToCategory(DEFAULT_CATEGORY, 0, 'Sorts');
    await expect(app.favoriteEntryInCategory('Sorts', 0)).toBeVisible();

    await app.toggleFavoriteCategory('Sorts');
    await expect(app.favoriteCategoryByName('Sorts')).toHaveClass(/is-collapsed/);

    await app.reload();

    await expect(app.favoriteCategoryByName('Sorts')).toHaveClass(/is-collapsed/);
    await expect(app.favoriteEntryInCategory('Sorts', 0)).toBeHidden();
  });

  test('deleting a category updates the history button state when it removes the last matching favorite', async ({ page }) => {
    await clearLocalStorageOnInit(page);
    await mockRandomOrg(page, [3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.createFavoriteCategory('Temporaire');
    await app.rollFormula('1d6');
    await app.saveHistoryFavorite(0, { category: 'Temporaire' });
    await app.deleteFavoriteCategory('Temporaire');

    await expect(app.favoritesEntries).toHaveCount(0);
    await expect(app.favoriteCategoryByName(DEFAULT_CATEGORY)).toBeVisible();
    await expect(app.historyFavoriteButton(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(app.historyFavoriteButton(0)).toHaveText('☆');
  });
});