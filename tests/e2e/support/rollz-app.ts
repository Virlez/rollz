import { expect, type Locator, type Page } from '@playwright/test';

export type RollMode = 'advantage' | 'disadvantage' | 'success';
export type InstallOutcome = 'accepted' | 'dismissed';

export class RollzApp {
  constructor(private readonly page: Page) {}

  private async getRollSequence(): Promise<string> {
    return (await this.page.locator('body').getAttribute('data-roll-sequence')) || '0';
  }

  private async getRollOutcomeState(): Promise<string> {
    return JSON.stringify({
      sequence: await this.getRollSequence(),
      errorVisible: await this.errorBanner.isVisible(),
    });
  }

  private async waitForRollCompletion(previousOutcomeState: string): Promise<void> {
    await expect.poll(async () => this.getRollOutcomeState()).not.toBe(previousOutcomeState);
    await expect(this.rollButton).toBeEnabled();
  }

  private async runAndWaitForRoll(action: () => Promise<void>): Promise<void> {
    const previousOutcomeState = await this.getRollOutcomeState();
    await action();
    await this.waitForRollCompletion(previousOutcomeState);
  }

  private async clickButtonViaDom(locator: Locator, errorMessage: string): Promise<void> {
    await locator.evaluate((button, message) => {
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error(message);
      }

      button.click();
    }, errorMessage);
  }

  private async clickAndExpectCount(locator: Locator, collection: Locator, expectedCount: number): Promise<void> {
    await locator.click({ force: true });
    await expect(collection).toHaveCount(expectedCount);
  }

  get rollButton(): Locator {
    return this.page.locator('#roll-btn');
  }

  get formulaInput(): Locator {
    return this.page.locator('#formula-input');
  }

  get formulaInputWrap(): Locator {
    return this.page.locator('#formula-input-wrap');
  }

  get modifierInput(): Locator {
    return this.page.locator('#modifier-input');
  }

  get formulaPreview(): Locator {
    return this.page.locator('#formula-preview');
  }

  get expertModeCheckbox(): Locator {
    return this.page.locator('#expert-check');
  }

  get expertPad(): Locator {
    return this.page.locator('#expert-pad');
  }

  get resultSection(): Locator {
    return this.page.locator('#result-section');
  }

  get resultTotal(): Locator {
    return this.page.locator('#result-total');
  }

  get resultTotalLabel(): Locator {
    return this.page.locator('#result-total-label');
  }

  get resultTotalNote(): Locator {
    return this.page.locator('#result-total-note');
  }

  get resultSourceNote(): Locator {
    return this.page.locator('#result-source-note');
  }

  get resultBreakdown(): Locator {
    return this.page.locator('#result-breakdown');
  }

  get resultMulti(): Locator {
    return this.page.locator('#result-multi');
  }

  get errorBanner(): Locator {
    return this.page.locator('#error-banner');
  }

  get installButton(): Locator {
    return this.page.locator('#install-btn');
  }

  get offlineBadge(): Locator {
    return this.page.locator('#offline-badge');
  }

  get langToggle(): Locator {
    return this.page.locator('#lang-toggle');
  }

  get langFlag(): Locator {
    return this.page.locator('#lang-flag');
  }

  get historyEntries(): Locator {
    return this.page.locator('.history-entry');
  }

  get historyEmpty(): Locator {
    return this.page.locator('#history-empty');
  }

  get favoritesEntries(): Locator {
    return this.page.locator('.favorite-entry');
  }

  get favoritesEmpty(): Locator {
    return this.page.locator('#favorites-empty');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.rollButton.waitFor();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.rollButton.waitFor();
  }

  async fillFormula(formula: string): Promise<void> {
    await this.formulaInput.fill(formula);
  }

  async roll(): Promise<void> {
    await this.runAndWaitForRoll(() => this.clickButtonViaDom(this.rollButton, 'Roll button is unavailable.'));
  }

  async rollFormula(formula: string): Promise<void> {
    await this.fillFormula(formula);
    await this.roll();
  }

  async pressEnterOnFormula(): Promise<void> {
    await this.runAndWaitForRoll(() => this.formulaInput.press('Enter'));
  }

  async clickDie(sides: number): Promise<void> {
    await this.page.locator(`[data-sides="${sides}"]`).click();
  }

  async buildFormulaFromDice(...sidesList: number[]): Promise<void> {
    for (const sides of sidesList) {
      await this.clickDie(sides);
    }
  }

  async setModifier(value: string): Promise<void> {
    await this.modifierInput.fill(value);
    await this.modifierInput.blur();
  }

  async incrementModifier(): Promise<void> {
    await this.page.locator('#modifier-inc').click();
  }

  async decrementModifier(): Promise<void> {
    await this.page.locator('#modifier-dec').click();
  }

  async clearFormula(): Promise<void> {
    await this.clickButtonViaDom(this.page.locator('#clear-btn'), 'Clear button is unavailable.');
    await expect(this.formulaInput).toHaveValue('');
    await expect(this.resultSection).toBeHidden();
    await expect(this.errorBanner).toBeHidden();
  }

  async clearHistory(): Promise<void> {
    await this.clickAndExpectCount(this.page.locator('#clear-history-btn'), this.historyEntries, 0);
  }

  async toggleLanguage(): Promise<void> {
    await this.langToggle.click();
  }

  async toggleExpertMode(): Promise<void> {
    await this.page.locator('label[for="expert-check"]').click();
  }

  async toggleMode(mode: RollMode): Promise<void> {
    await this.page.locator(`#${mode}-label`).click();
  }

  async clickExpertOperator(label: string): Promise<void> {
    await this.page.locator('.expert-operators .expert-btn').filter({ hasText: label }).click();
  }

  async clickExpertDie(label: string): Promise<void> {
    await this.page.locator('.expert-dice .expert-btn').filter({ hasText: label }).click();
  }

  async clickExpertDigit(digit: number | string): Promise<void> {
    await this.page.locator('.expert-numpad .expert-btn').filter({ hasText: String(digit) }).click();
  }

  modeCheckbox(mode: RollMode): Locator {
    return this.page.locator(`#${mode}-check`);
  }

  dieButton(sides: number): Locator {
    return this.page.locator(`[data-sides="${sides}"]`);
  }

  dieCounter(sides: number): Locator {
    return this.page.locator(`[data-sides="${sides}"] .die-counter`);
  }

  historyEntry(index = 0): Locator {
    return this.historyEntries.nth(index);
  }

  historyFormula(index = 0): Locator {
    return this.historyEntry(index).locator('.history-formula');
  }

  historyTotal(index = 0): Locator {
    return this.historyEntry(index).locator('.history-total');
  }

  historyFavoriteButton(index = 0): Locator {
    return this.historyEntry(index).locator('.favorite-btn');
  }

  favoriteEntry(index = 0): Locator {
    return this.favoritesEntries.nth(index);
  }

  favoriteFormula(index = 0): Locator {
    return this.favoriteEntry(index).locator('.favorite-formula');
  }

  favoriteLoadButton(index = 0): Locator {
    return this.favoriteEntry(index).locator('.favorite-load-btn');
  }

  favoriteRemoveButton(index = 0): Locator {
    return this.favoriteEntry(index).locator('.favorite-remove-btn');
  }

  favoriteDragHandle(index = 0): Locator {
    return this.favoriteEntry(index).locator('[data-action="drag"]');
  }

  multiResultTotal(index: number): Locator {
    return this.resultMulti.locator('.result-total').nth(index);
  }

  resultBlock(index: number): Locator {
    return this.resultMulti.locator('.result-sub-block').nth(index);
  }

  dieResults(selector = '.die-result'): Locator {
    return this.page.locator(selector);
  }

  async clickHistoryEntry(index = 0): Promise<void> {
    await this.runAndWaitForRoll(() => this.historyEntry(index).click());
  }

  async toggleHistoryFavorite(index = 0): Promise<void> {
    const previousCount = await this.favoritesEntries.count();
    const previousPressed = await this.historyFavoriteButton(index).getAttribute('aria-pressed');

    const expectedCount = previousPressed === 'true'
      ? Math.max(0, previousCount - 1)
      : previousCount + 1;

    await this.clickAndExpectCount(this.historyFavoriteButton(index), this.favoritesEntries, expectedCount);
  }

  async clickFavoriteFormula(index = 0): Promise<void> {
    await this.favoriteLoadButton(index).click({ force: true });
  }

  async removeFavorite(index = 0): Promise<void> {
    const previousCount = await this.favoritesEntries.count();
    await this.clickAndExpectCount(this.favoriteRemoveButton(index), this.favoritesEntries, Math.max(0, previousCount - 1));
  }

  async dragFavoriteTo(sourceIndex: number, targetIndex: number): Promise<void> {
    await this.page.evaluate(({ sourceIndex: source, targetIndex: target }) => {
      const sourceHandle = document.querySelectorAll('[data-action="drag"]')[source];
      const targetEntry = document.querySelectorAll('.favorite-entry')[target];

      if (!(sourceHandle instanceof HTMLElement) || !(targetEntry instanceof HTMLElement)) {
        throw new Error('Favorite drag source or target is unavailable.');
      }

      const targetRect = targetEntry.getBoundingClientRect();
      const clientX = targetRect.left + targetRect.width / 2;
      const clientY = targetRect.top + targetRect.height * 0.75;
      const dataTransfer = new DataTransfer();

      sourceHandle.dispatchEvent(new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }));

      targetEntry.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX,
        clientY,
      }));

      targetEntry.dispatchEvent(new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX,
        clientY,
      }));

      sourceHandle.dispatchEvent(new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }));
    }, { sourceIndex, targetIndex });
  }

  async setOffline(offline: boolean): Promise<void> {
    await this.page.context().setOffline(offline);
  }

  async triggerBeforeInstallPrompt(outcome: InstallOutcome): Promise<void> {
    await this.page.evaluate(selectedOutcome => {
      const event = new Event('beforeinstallprompt', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'prompt', {
        value: () => Promise.resolve(),
      });
      Object.defineProperty(event, 'userChoice', {
        value: Promise.resolve({ outcome: selectedOutcome, platform: 'web' }),
      });
      window.dispatchEvent(event);
    }, outcome);
  }

  async triggerAppInstalled(): Promise<void> {
    await this.page.evaluate(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
  }

  async primeInvalidFormulaState(): Promise<void> {
    await this.page.evaluate(() => {
      const formulaInput = document.getElementById('formula-input') as HTMLInputElement | null;
      const rollButton = document.getElementById('roll-btn') as HTMLButtonElement | null;
      if (!formulaInput || !rollButton) {
        return;
      }

      formulaInput.value = '???';
      rollButton.disabled = false;
    });
  }
}