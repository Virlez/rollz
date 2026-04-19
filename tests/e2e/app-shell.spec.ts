import { RollzApp } from './support/rollz-app';
import { expect, test } from './support/test';
import { clearLocalStorageOnInit } from './support/test-helpers';

test.describe('Page load', () => {
  test('has correct title', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await expect(page).toHaveTitle(/Rollz/);
  });

  test('shows all seven dice buttons', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await expect(page.locator('.die-btn')).toHaveCount(7);
  });

  test('roll button is initially disabled', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await expect(app.rollButton).toBeDisabled();
  });

  test('formula input is empty on load', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await expect(app.formulaInput).toHaveValue('');
  });

  test('result section is hidden on load', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await expect(app.resultSection).toBeHidden();
  });

  test('error banner is hidden on load', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await expect(app.errorBanner).toBeHidden();
  });

  test('history empty state is visible on load', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await page.evaluate(() => localStorage.clear());
    await app.reload();

    await expect(app.historyEmpty).toBeVisible();
  });
});

test.describe('Language toggle', () => {
  test('default language is French', async ({ page }) => {
    await clearLocalStorageOnInit(page);

    const app = new RollzApp(page);
    await app.goto();

    await expect(page.locator('[data-i18n="rollBtn"]')).toHaveText('Lancer !');
  });

  test('clicking lang toggle switches to English', async ({ page }) => {
    await clearLocalStorageOnInit(page);

    const app = new RollzApp(page);
    await app.goto();
    await app.toggleLanguage();

    await expect(page.locator('[data-i18n="rollBtn"]')).toHaveText('Roll!');
  });

  test('clicking lang toggle twice returns to French', async ({ page }) => {
    await clearLocalStorageOnInit(page);

    const app = new RollzApp(page);
    await app.goto();
    await app.toggleLanguage();
    await app.toggleLanguage();

    await expect(page.locator('[data-i18n="rollBtn"]')).toHaveText('Lancer !');
  });

  test('lang flag shows opposite language', async ({ page }) => {
    await clearLocalStorageOnInit(page);

    const app = new RollzApp(page);
    await app.goto();
    await expect(app.langFlag).toHaveAttribute('src', /gb/);

    await app.toggleLanguage();

    await expect(app.langFlag).toHaveAttribute('src', /fr/);
  });

  test('language preference is persisted in localStorage', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.toggleLanguage();
    await app.reload();

    await expect(page.locator('[data-i18n="rollBtn"]')).toHaveText('Roll!');
  });
});

test.describe('PWA shell', () => {
  test('exposes a web manifest link', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest\.webmanifest\?v=/);
  });

  test('shows the install button after beforeinstallprompt fires', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.triggerBeforeInstallPrompt('dismissed');

    await expect(app.installButton).toBeVisible();
  });

  test('hides the install button after appinstalled fires', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.triggerBeforeInstallPrompt('accepted');
    await expect(app.installButton).toBeVisible();

    await app.triggerAppInstalled();

    await expect(app.installButton).toBeHidden();
  });

  test('shows the offline badge when the browser goes offline', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await app.setOffline(true);

    await expect(app.offlineBadge).toBeVisible();

    await app.setOffline(false);
  });

  test('falls back to Web Crypto when random.org is unreachable', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();
    await page.route(/random\.org\/integers/, route => route.abort());
    await app.rollFormula('1d6');

    await expect(app.errorBanner).toBeHidden();
    await expect(app.resultSection).toBeVisible();
    await expect(app.resultSourceNote).toContainText('Crypto');
  });

  test('expert mode preference is persisted in localStorage', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await app.toggleExpertMode();
    await expect(app.expertModeCheckbox).toBeChecked();
    await expect(app.expertPad).toBeVisible();

    await app.reload();

    await expect(app.expertModeCheckbox).toBeChecked();
    await expect(app.expertPad).toBeVisible();
  });
});