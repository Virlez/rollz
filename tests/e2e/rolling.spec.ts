import { RollzApp } from './support/rollz-app';
import { expect, test } from './support/test';
import { mockRandomOrg, setStoredLanguageOnInit } from './support/test-helpers';

test.describe('Roll action — normal mode', () => {
  test('shows result section after a successful roll', async ({ page }) => {
    await mockRandomOrg(page, [3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');

    await expect(app.resultSection).toBeVisible();
  });

  test('displays the correct total', async ({ page }) => {
    await mockRandomOrg(page, [5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');

    await expect(app.resultTotal).toHaveText('5');
  });

  test('adds modifier to dice result', async ({ page }) => {
    await mockRandomOrg(page, [3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6 + 4');

    await expect(app.resultTotal).toHaveText('7');
  });

  test('subtracts modifier from dice result', async ({ page }) => {
    await mockRandomOrg(page, [15]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d20 - 5');

    await expect(app.resultTotal).toHaveText('10');
  });

  test('sums multiple dice groups', async ({ page }) => {
    await mockRandomOrg(page, [3, 4, 2]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('2d6 + 1d4');

    await expect(app.resultTotal).toHaveText('9');
  });

  test('result shows die values in breakdown chips', async ({ page }) => {
    await mockRandomOrg(page, [6]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');

    await expect(app.dieResults().first()).toHaveText('6');
  });

  test('max roll chip has is-max class', async ({ page }) => {
    await mockRandomOrg(page, [6]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');

    await expect(app.dieResults('.die-result.is-max')).toHaveCount(1);
  });

  test('min roll chip has is-min class', async ({ page }) => {
    await mockRandomOrg(page, [1]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');

    await expect(app.dieResults('.die-result.is-min')).toHaveCount(1);
  });

  test('Enter key triggers roll', async ({ page }) => {
    await mockRandomOrg(page, [4]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d6');
    await app.pressEnterOnFormula();

    await expect(app.resultSection).toBeVisible();
  });

  test('negative modifier formula works', async ({ page }) => {
    await mockRandomOrg(page, [4]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d4 - 3');

    await expect(app.resultTotal).toHaveText('1');
  });

  test('semicolon-separated formulas render one result block per formula', async ({ page }) => {
    await mockRandomOrg(page, [10, 3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d20 + 4;1d8 + 2');

    await expect(app.resultMulti).toBeVisible();
    await expect(app.resultMulti.locator('.result-sub-block')).toHaveCount(2);
    await expect(app.multiResultTotal(0)).toHaveText('14');
    await expect(app.multiResultTotal(1)).toHaveText('5');
  });
});

test.describe('Roll action — advantage/disadvantage', () => {
  test('advantage keeps the higher of two rolls for the first die', async ({ page }) => {
    await mockRandomOrg(page, [8, 15]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20');
    await app.toggleMode('advantage');
    await app.roll();

    await expect(app.resultTotal).toHaveText('15');
  });

  test('disadvantage keeps the lower of two rolls for the first die', async ({ page }) => {
    await mockRandomOrg(page, [12, 5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20');
    await app.toggleMode('disadvantage');
    await app.roll();

    await expect(app.resultTotal).toHaveText('5');
  });

  test('advantage result shows kept and discarded chips', async ({ page }) => {
    await mockRandomOrg(page, [3, 17]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20');
    await app.toggleMode('advantage');
    await app.roll();

    await expect(page.locator('.is-kept')).toHaveCount(1);
    await expect(page.locator('.is-discarded')).toHaveCount(1);
  });

  test('advantage applies only to first die of multi-die roll', async ({ page }) => {
    await mockRandomOrg(page, [2, 5, 4]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('advantage');
    await app.roll();

    await expect(app.resultTotal).toHaveText('9');
  });

  test('equal advantage rolls do not show discarded chip', async ({ page }) => {
    await mockRandomOrg(page, [7, 7]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20');
    await app.toggleMode('advantage');
    await app.roll();

    await expect(page.locator('.is-discarded')).toHaveCount(0);
  });

  test('advantage applies only to the first formula in a semicolon-separated roll', async ({ page }) => {
    await mockRandomOrg(page, [4, 17, 6]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20;1d8');
    await app.toggleMode('advantage');
    await app.roll();

    await expect(app.multiResultTotal(0)).toHaveText('17');
    await expect(app.multiResultTotal(1)).toHaveText('6');
    await expect(app.resultMulti.locator('.is-kept')).toHaveCount(1);
    await expect(app.resultMulti.locator('.is-discarded')).toHaveCount(1);
  });
});

test.describe('Roll action — success mode', () => {
  test('counts even results as successes', async ({ page }) => {
    await mockRandomOrg(page, [2, 4, 3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('3d6');
    await app.toggleMode('success');
    await app.roll();

    await expect(app.resultTotal).toHaveText('2');
  });

  test('adds modifier to success count', async ({ page }) => {
    await mockRandomOrg(page, [4, 3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6 + 3');
    await app.toggleMode('success');
    await app.roll();

    await expect(app.resultTotal).toHaveText('4');
  });

  test('critical failure (all odd) gives total 0', async ({ page }) => {
    await mockRandomOrg(page, [1, 3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('success');
    await app.roll();

    await expect(app.resultTotal).toHaveText('0');
  });

  test('critical failure shows fumble note', async ({ page }) => {
    await setStoredLanguageOnInit(page, 'en');
    await mockRandomOrg(page, [1, 3]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('success');
    await app.roll();

    await expect(app.resultTotalNote).toContainText('Fumble');
  });

  test('bonus reroll triggers when all dice are even', async ({ page }) => {
    await mockRandomOrg(page, [2, 4, 1, 5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('success');
    await app.roll();

    await expect(app.resultTotal).toHaveText('2');
  });

  test('bonus reroll adds its even results', async ({ page }) => {
    await mockRandomOrg(page, [2, 4, 6, 2]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('success');
    await app.roll();

    await expect(app.resultTotal).toHaveText('4');
  });

  test('even dice are styled is-success, odd dice is-failure', async ({ page }) => {
    await mockRandomOrg(page, [2, 3, 4]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('3d6');
    await app.toggleMode('success');
    await app.roll();

    await expect(app.dieResults('.die-result.is-success')).toHaveCount(2);
    await expect(app.dieResults('.die-result.is-failure')).toHaveCount(1);
  });

  test('result total label reads "Successes" in English', async ({ page }) => {
    await setStoredLanguageOnInit(page, 'en');
    await mockRandomOrg(page, [2]);

    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d6');
    await app.toggleMode('success');
    await app.roll();

    await expect(app.resultTotalLabel).toHaveText('Successes');
  });
});