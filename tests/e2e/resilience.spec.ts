import { RollzApp } from './support/rollz-app';
import { expect, test } from './support/test';
import { disableCryptoFallback, mockRandomOrg } from './support/test-helpers';

test.describe('Error handling', () => {
  test('error banner is hidden after a successful retry', async ({ page }) => {
    await disableCryptoFallback(page);

    let callCount = 0;
    await page.route(/random\.org\/integers/, async route => {
      callCount += 1;

      if (callCount === 1) {
        await route.abort();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: '4\n',
      });
    });

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await expect(app.errorBanner).toBeVisible();

    await app.roll();

    await expect(app.errorBanner).toBeHidden();
  });

});

test.describe('Edge cases', () => {
  test('d100 (percentile) die works', async ({ page }) => {
    await mockRandomOrg(page, [77]);

    const app = new RollzApp(page);
    await app.goto();
    await app.clickDie(100);
    await app.roll();

    await expect(app.resultTotal).toHaveText('77');
  });

  test('roll result card can be re-rolled without clearing', async ({ page }) => {
    await mockRandomOrg(page, [2, 5]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await expect(app.resultTotal).toHaveText('2');

    await app.roll();

    await expect(app.resultTotal).toHaveText('5');
  });

  test('formula built from dice then manually cleared resets counters', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.buildFormulaFromDice(6, 6, 8);
    await app.clearFormula();

    for (const sides of [6, 8]) {
      await expect(app.dieCounter(sides)).toHaveText('0');
    }
  });

});