import { RollzApp } from './support/rollz-app';
import { expect, test } from './support/test';
import { mockRandomOrg } from './support/test-helpers';

test.describe('Dice buttons', () => {
  test('clicking a die adds it to the formula', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.clickDie(6);

    await expect(app.formulaInput).toHaveValue('1d6');
  });

});

test.describe('Formula input and preview', () => {
  test('typing a valid formula enables roll button and shows valid preview', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6 + 4');

    await expect(app.rollButton).toBeEnabled();
    await expect(app.formulaPreview).toHaveClass(/is-valid/);
  });

  test('typing an invalid formula disables roll button and marks preview invalid', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('abc');

    await expect(app.rollButton).toBeDisabled();
    await expect(app.formulaPreview).toHaveClass(/is-invalid/);
  });

});

test.describe('Clear button', () => {
  test('clears the formula input', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6 + 4');
    await app.clearFormula();

    await expect(app.formulaInput).toHaveValue('');
  });

  test('hides result section after clearing', async ({ page }) => {
    await mockRandomOrg(page, [4]);

    const app = new RollzApp(page);
    await app.goto();
    await app.rollFormula('1d6');
    await expect(app.resultSection).toBeVisible();

    await app.clearFormula();

    await expect(app.resultSection).toBeHidden();
  });

});

test.describe('Mode toggles', () => {
  test('expert mode enables the expert builder and compact layout', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await app.toggleExpertMode();

    await expect(app.expertModeCheckbox).toBeChecked();
    await expect(app.expertPad).toBeVisible();
    await expect(page.locator('#dice-grid')).toBeHidden();
    await expect(app.modifierInput).toBeHidden();
    await expect(page.locator('body')).toHaveClass(/is-vtt-compact/);

    await app.toggleExpertMode();

    await expect(app.expertModeCheckbox).not.toBeChecked();
    await expect(app.expertPad).toBeHidden();
    await expect(page.locator('#dice-grid')).toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(/is-vtt-compact/);
  });

  test('switching to expert mode resets classic builder state immediately', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await app.clickDie(6);
    await app.incrementModifier();
    await app.toggleExpertMode();

    await expect(app.expertModeCheckbox).toBeChecked();
    await expect(app.expertPad).toBeVisible();

    await app.toggleExpertMode();

    await expect(app.expertModeCheckbox).not.toBeChecked();
    await expect(app.dieCounter(6)).toHaveText('0');
    await expect(app.modifierInput).toHaveValue('0');
    await expect(app.formulaInput).toHaveValue('1d6 + 1');
  });

  test('expert mode actions do not focus the formula input', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await app.toggleExpertMode();
    await expect(app.formulaInput).not.toBeFocused();

    await app.clickExpertDie('d20');
    await expect(app.formulaInput).not.toBeFocused();
    await expect(app.formulaInput).toHaveValue('d20');

    await app.clickExpertOperator('≥');
    await expect(app.formulaInput).not.toBeFocused();
    await expect(app.formulaInput).toHaveValue('d20>=');
  });

  test('expert mode can insert a standalone d after d100', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await app.toggleExpertMode();
    await app.clickExpertDie('d100');
    await page.locator('.expert-dice .expert-btn[data-insert="d"]').click();

    await expect(app.formulaInput).toHaveValue('d100d');
  });

  test('advantage and disadvantage are mutually exclusive', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleMode('advantage');
    await expect(app.modeCheckbox('advantage')).toBeChecked();

    await app.toggleMode('disadvantage');

    await expect(app.modeCheckbox('disadvantage')).toBeChecked();
    await expect(app.modeCheckbox('advantage')).not.toBeChecked();
  });

});

test.describe('Expert mode', () => {
  test('shows expert pad and hides classic options', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await app.toggleExpertMode();

    await expect(app.expertPad).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/is-vtt-compact/);
    await expect(page.locator('#dice-grid')).toBeHidden();
    await expect(app.modifierInput).toBeHidden();
    await expect(page.locator('.advantage-row')).toBeVisible();
    await expect(page.locator('#advantage-label')).toBeVisible();
    await expect(page.locator('.expert-dice [data-insert-die]')).toHaveCount(7);
    await expect(page.locator('.expert-dice [data-insert="d"]')).toBeVisible();
  });

  test('expert mode keeps special toggles usable', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleExpertMode();
    await app.fillFormula('2d20');

    await app.toggleMode('advantage');

    await expect(app.modeCheckbox('advantage')).toBeChecked();
    await expect(app.formulaPreview).toContainText('⚠');
  });

  test('expert mode keeps the roll button in normal document flow', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleExpertMode();

    const rollRowPosition = await page.locator('.roll-row').evaluate(element => getComputedStyle(element).position);

    expect(rollRowPosition).toBe('static');
  });

  test('clicking a die in expert mode inserts notation at the cursor', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleExpertMode();

    await app.clickExpertDigit(2);
    await app.clickExpertDie('d6');

    await expect(app.formulaInput).toHaveValue('2d6');
  });

  test('repeat shortcut in expert mode inserts x with a trailing space', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleExpertMode();

    await app.clickExpertDigit(3);
    await app.clickExpertOperator('x');

    await expect(app.formulaInput).toHaveValue('3x ');
  });

  test('expert operator shortcuts stay on a single row on desktop widths', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const app = new RollzApp(page);
    await app.goto();
    await app.toggleExpertMode();

    const operatorButtons = page.locator('.expert-operators .expert-btn');
    await expect(operatorButtons).toHaveCount(7);

    const yPositions = await operatorButtons.evaluateAll(elements =>
      elements.map(element => Math.round(element.getBoundingClientRect().y))
    );

    expect(new Set(yPositions).size).toBe(1);
  });

  test('expert controls can build a complex valid formula', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleExpertMode();

    await app.clickExpertDigit(2);
    await app.clickExpertDie('d6');
    await app.clickExpertOperator('≥');
    await app.clickExpertDigit(4);
    await app.clickExpertOperator(';');
    await app.clickExpertDigit(1);
    await app.clickExpertDie('d20');
    await app.clickExpertOperator('R');
    await app.clickExpertDigit(2);
    await app.clickExpertOperator('+');
    await app.clickExpertDigit(5);

    await expect(app.formulaInput).toHaveValue('2d6>=4 ; 1d20R2 + 5');
    await expect(app.formulaPreview).toHaveClass(/is-valid/);
    await expect(app.rollButton).toBeEnabled();
  });
});