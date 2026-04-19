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

  test('clicking the same die twice increments the counter', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.buildFormulaFromDice(6, 6);

    await expect(app.formulaInput).toHaveValue('2d6');
    await expect(app.dieCounter(6)).toHaveText('2');
  });

  test('clicking different dice builds a combined formula', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.buildFormulaFromDice(20, 4);

    await expect(app.formulaInput).toHaveValue('1d20 + 1d4');
  });

  test('die button gets is-selected class when clicked', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.clickDie(8);

    await expect(app.dieButton(8)).toHaveClass(/is-selected/);
  });

  test('clicking a die enables the roll button', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.clickDie(12);

    await expect(app.rollButton).toBeEnabled();
  });

  test('modifier buttons update the built formula', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.clickDie(6);
    await app.incrementModifier();

    await expect(app.formulaInput).toHaveValue('1d6 + 1');

    await app.decrementModifier();
    await app.decrementModifier();

    await expect(app.formulaInput).toHaveValue('1d6 - 1');
  });

  test('typing in the modifier input updates the formula', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.clickDie(20);
    await app.setModifier('-3');

    await expect(app.formulaInput).toHaveValue('1d20 - 3');
  });

  test('manual formula typing resets the modifier widget', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.clickDie(8);
    await app.incrementModifier();
    await expect(app.modifierInput).toHaveValue('1');

    await app.fillFormula('2d6 + 4');

    await expect(app.modifierInput).toHaveValue('0');
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

  test('preview shows check mark for valid formula', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20');

    await expect(app.formulaPreview).toContainText('✓');
  });

  test('typing an invalid formula disables roll button and marks preview invalid', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('abc');

    await expect(app.rollButton).toBeDisabled();
    await expect(app.formulaPreview).toHaveClass(/is-invalid/);
  });

  test('clearing the input resets preview to empty state', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.fillFormula('');

    await expect(app.formulaPreview).not.toHaveClass(/is-valid/);
    await expect(app.formulaPreview).not.toHaveClass(/is-invalid/);
  });

  test('modifier-only formula is invalid (no dice)', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('5');

    await expect(app.rollButton).toBeDisabled();
    await expect(app.formulaPreview).toHaveClass(/is-invalid/);
  });

  test('complex formula with multiple groups is valid', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('3d8 + 1d4 + 5');

    await expect(app.rollButton).toBeEnabled();
    await expect(app.formulaPreview).toHaveClass(/is-valid/);
  });

  test('semicolon-separated formulas are valid when each segment is valid', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20 + 4;1d8 + 2');

    await expect(app.rollButton).toBeEnabled();
    await expect(app.formulaPreview).toHaveClass(/is-valid/);
  });

  test('formula with subtraction is valid', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20 - 2');

    await expect(app.rollButton).toBeEnabled();
  });

  test('manual typing clears dice button selection', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.clickDie(6);
    await expect(app.dieCounter(6)).toHaveText('1');

    await app.fillFormula('1d8');

    await expect(app.dieCounter(6)).toHaveText('0');
    await expect(app.dieButton(6)).not.toHaveClass(/is-selected/);
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

  test('disables the roll button after clearing', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.clearFormula();

    await expect(app.rollButton).toBeDisabled();
  });

  test('resets dice counter badges', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.buildFormulaFromDice(6, 6);
    await app.clearFormula();

    await expect(app.dieCounter(6)).toHaveText('0');
    await expect(app.dieButton(6)).not.toHaveClass(/is-selected/);
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

  test('hides error banner after clearing', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.primeInvalidFormulaState();
    await app.roll();
    await expect(app.errorBanner).toBeVisible();

    await app.clearFormula();

    await expect(app.errorBanner).toBeHidden();
  });
});

test.describe('Mode toggles', () => {
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

  test('advantage and disadvantage are mutually exclusive', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleMode('advantage');
    await expect(app.modeCheckbox('advantage')).toBeChecked();

    await app.toggleMode('disadvantage');

    await expect(app.modeCheckbox('disadvantage')).toBeChecked();
    await expect(app.modeCheckbox('advantage')).not.toBeChecked();
  });

  test('advantage and success mode are mutually exclusive', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleMode('advantage');
    await app.toggleMode('success');

    await expect(app.modeCheckbox('success')).toBeChecked();
    await expect(app.modeCheckbox('advantage')).not.toBeChecked();
  });

  test('disadvantage and success mode are mutually exclusive', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleMode('disadvantage');
    await app.toggleMode('success');

    await expect(app.modeCheckbox('success')).toBeChecked();
    await expect(app.modeCheckbox('disadvantage')).not.toBeChecked();
  });

  test('success mode shows warning in formula preview', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('3d6');
    await app.toggleMode('success');

    await expect(app.formulaPreview).toContainText('⚠');
  });

  test('advantage mode shows warning when multiple dice are used', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('advantage');

    await expect(app.formulaPreview).toContainText('⚠');
  });

  test('multi-roll preview warns that special modes apply only to the first formula', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('1d20;1d8');
    await app.toggleMode('advantage');

    await expect(app.formulaPreview).toContainText('premiere formule');
  });

  test('unchecking advantage resets mode and removes warning', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.fillFormula('2d6');
    await app.toggleMode('advantage');
    await app.toggleMode('advantage');

    await expect(app.formulaPreview).not.toContainText('⚠');
  });
});

test.describe('Expert mode', () => {
  test('shows expert pad and hides classic options', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await app.toggleExpertMode();

    await expect(app.expertPad).toBeVisible();
    await expect(page.locator('#dice-grid')).toBeHidden();
    await expect(app.modifierInput).toBeHidden();
    await expect(page.locator('.advantage-row')).toBeVisible();
    await expect(page.locator('#advantage-label')).toBeVisible();
    await expect(page.locator('.expert-dice .expert-btn')).toHaveCount(7);
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

  test('clicking a die in expert mode inserts notation at the cursor', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleExpertMode();

    await app.clickExpertDigit(2);
    await app.clickExpertDie('d6');

    await expect(app.formulaInput).toHaveValue('2d6');
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