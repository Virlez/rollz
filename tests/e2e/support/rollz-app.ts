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

  private async submitFavoritesModal(options: { category?: string; name?: string; label?: string; confirm?: boolean } = {}): Promise<void> {
    await expect(this.favoritesModal).toBeVisible();

    if (options.category !== undefined) {
      const availableOptions = await this.favoriteModalCategorySelect.locator('option').evaluateAll(optionEls => optionEls.map(option => ({
        value: option instanceof HTMLOptionElement ? option.value : '',
        label: option.textContent?.trim() || '',
      })));

      const existingCategory = availableOptions.find(option => option.label === options.category);
      if (existingCategory) {
        await this.favoriteModalCategorySelect.selectOption(existingCategory.value);
      } else if (availableOptions.length > 0) {
        await this.favoriteModalCategorySelect.selectOption(availableOptions[availableOptions.length - 1].value);
        await this.favoriteModalCategoryNameInput.fill(options.category);
      }
    }

    if (options.name !== undefined) {
      await this.favoriteModalNameInput.fill(options.name);
    }

    if (options.label !== undefined) {
      await this.favoriteModalLabelInput.fill(options.label);
    }

    if (options.confirm === false) {
      await this.favoriteModalCancelButton.click();
      await expect(this.favoritesModal).toBeHidden();
      return;
    }

    await this.favoriteModalSubmitButton.click();
    await expect(this.favoritesModal).toBeHidden();
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

  get favoriteCategories(): Locator {
    return this.page.locator('.favorite-category');
  }

  get favoritesEmpty(): Locator {
    return this.page.locator('#favorites-empty');
  }

  get addCategoryButton(): Locator {
    return this.page.locator('#add-category-btn');
  }

  get favoritesModal(): Locator {
    return this.page.locator('#favorites-modal');
  }

  get favoriteModalCategorySelect(): Locator {
    return this.page.locator('#favorites-modal-category-select');
  }

  get favoriteModalCategoryNameInput(): Locator {
    return this.page.locator('#favorites-modal-category-name-input');
  }

  get favoriteModalNameInput(): Locator {
    return this.page.locator('#favorites-modal-name-input');
  }

  get favoriteModalLabelInput(): Locator {
    return this.page.locator('#favorites-modal-label-input');
  }

  get favoriteModalCancelButton(): Locator {
    return this.page.locator('#favorites-modal-cancel');
  }

  get favoriteModalSubmitButton(): Locator {
    return this.page.locator('#favorites-modal-submit');
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

  favoriteCategory(index = 0): Locator {
    return this.favoriteCategories.nth(index);
  }

  favoriteCategoryByName(name: string): Locator {
    return this.favoriteCategories.filter({ has: this.page.locator('.favorite-category-name', { hasText: name }) }).first();
  }

  favoriteEntryInCategory(categoryName: string, index = 0): Locator {
    return this.favoriteCategoryByName(categoryName).locator('.favorite-entry').nth(index);
  }

  favoriteFormulaInCategory(categoryName: string, index = 0): Locator {
    return this.favoriteEntryInCategory(categoryName, index).locator('.favorite-formula');
  }

  favoriteLabelInCategory(categoryName: string, index = 0): Locator {
    return this.favoriteEntryInCategory(categoryName, index).locator('.favorite-label');
  }

  favoriteCategoryToggle(categoryName: string): Locator {
    return this.favoriteCategoryByName(categoryName).locator('[data-action="toggle-category"]');
  }

  favoriteCategoryRenameButton(categoryName: string): Locator {
    return this.favoriteCategoryByName(categoryName).locator('[data-action="rename-category"]');
  }

  favoriteCategoryDeleteButton(categoryName: string): Locator {
    return this.favoriteCategoryByName(categoryName).locator('[data-action="delete-category"]');
  }

  favoriteLabelButtonInCategory(categoryName: string, index = 0): Locator {
    return this.favoriteEntryInCategory(categoryName, index).locator('[data-action="edit-label"]');
  }

  favoriteRemoveButtonInCategory(categoryName: string, index = 0): Locator {
    return this.favoriteEntryInCategory(categoryName, index).locator('.favorite-remove-btn');
  }

  favoriteDragHandleInCategory(categoryName: string, index = 0): Locator {
    return this.favoriteEntryInCategory(categoryName, index).locator('[data-action="drag"]');
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
    await this.saveHistoryFavorite(index);
  }

  async saveHistoryFavorite(index = 0, options: { category?: string; label?: string; expectedCount?: number } = {}): Promise<void> {
    const previousCount = await this.favoritesEntries.count();
    const expectedCount = options.expectedCount ?? (previousCount + 1);

    const favoriteButton = this.historyFavoriteButton(index);
    await favoriteButton.scrollIntoViewIfNeeded();
    await this.clickButtonViaDom(favoriteButton, 'History favorite button is unavailable.');
    await this.submitFavoritesModal({
      category: options.category,
      label: options.label,
    });

    await expect(this.favoritesEntries).toHaveCount(expectedCount);
  }

  async clickFavoriteFormula(index = 0): Promise<void> {
    await this.favoriteLoadButton(index).click({ force: true });
  }

  async removeFavorite(index = 0): Promise<void> {
    const previousCount = await this.favoritesEntries.count();
    await this.clickAndExpectCount(this.favoriteRemoveButton(index), this.favoritesEntries, Math.max(0, previousCount - 1));
  }

  async removeFavoriteInCategory(categoryName: string, index = 0): Promise<void> {
    const previousCount = await this.favoritesEntries.count();
    await this.clickAndExpectCount(this.favoriteRemoveButtonInCategory(categoryName, index), this.favoritesEntries, Math.max(0, previousCount - 1));
  }

  async createFavoriteCategory(name: string): Promise<void> {
    await this.addCategoryButton.click();
    await this.submitFavoritesModal({ name });
  }

  async renameFavoriteCategory(currentName: string, nextName: string): Promise<void> {
    await this.favoriteCategoryRenameButton(currentName).click();
    await this.submitFavoritesModal({ name: nextName });
  }

  async deleteFavoriteCategory(categoryName: string, confirm = true): Promise<void> {
    await this.favoriteCategoryDeleteButton(categoryName).click();
    await this.submitFavoritesModal({ confirm });
  }

  async editFavoriteLabel(categoryName: string, index: number, label: string): Promise<void> {
    await this.favoriteLabelButtonInCategory(categoryName, index).click();
    await this.submitFavoritesModal({ label });
  }

  async toggleFavoriteCategory(categoryName: string): Promise<void> {
    await this.favoriteCategoryToggle(categoryName).click();
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

  async dragFavoriteToCategory(sourceCategoryName: string, sourceIndex: number, targetCategoryName: string): Promise<void> {
    await this.page.evaluate(({ sourceCategoryName: sourceName, sourceIndex: sourceIdx, targetCategoryName: targetName }) => {
      const categories = [...document.querySelectorAll('.favorite-category')];
      const sourceCategory = categories.find(category => category.querySelector('.favorite-category-name')?.textContent?.trim() === sourceName);
      const targetCategory = categories.find(category => category.querySelector('.favorite-category-name')?.textContent?.trim() === targetName);
      const sourceHandle = sourceCategory?.querySelectorAll('[data-action="drag"]')[sourceIdx];
      const targetContent = targetCategory?.querySelector('.favorite-category-content');

      if (!(sourceHandle instanceof HTMLElement) || !(targetContent instanceof HTMLElement)) {
        throw new Error('Favorite drag source or target category is unavailable.');
      }

      const targetRect = targetContent.getBoundingClientRect();
      const clientX = targetRect.left + targetRect.width / 2;
      const clientY = targetRect.top + Math.min(targetRect.height - 4, 24);
      const dataTransfer = new DataTransfer();

      sourceHandle.dispatchEvent(new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }));

      targetContent.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientX,
        clientY,
      }));

      targetContent.dispatchEvent(new DragEvent('drop', {
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
    }, { sourceCategoryName, sourceIndex, targetCategoryName });
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