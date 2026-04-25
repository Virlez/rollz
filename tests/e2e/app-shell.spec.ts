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

  test('header actions and mode toggles stay within the viewport on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });

    const app = new RollzApp(page);
    await app.goto();

    const headerBox = await page.locator('.header-inner').boundingBox();
    const actionsBox = await page.locator('.header-actions').boundingBox();
    const modeToggleBox = await page.locator('.mode-toggle-row').boundingBox();

    expect(headerBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();
    expect(modeToggleBox).not.toBeNull();

    expect(actionsBox!.x + actionsBox!.width).toBeLessThanOrEqual(headerBox!.x + headerBox!.width + 1);
    expect(modeToggleBox!.x + modeToggleBox!.width).toBeLessThanOrEqual(360);
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

  test('versions critical shell assets for cache busting', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /favicon\.svg\?v=/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', /apple-touch-icon\.png\?v=/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.svg\?v=/);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /og-image\.svg\?v=/);
  });

  test('versions manifest icons for cache busting', async ({ page }) => {
    const app = new RollzApp(page);
    await app.goto();

    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifest = await page.evaluate(async href => {
      if (!href) throw new Error('Missing manifest href');

      const response = await fetch(new URL(href, window.location.href).toString(), { cache: 'no-store' });
      return response.json();
    }, manifestHref);

    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: expect.stringMatching(/icon-192\.png\?v=/) }),
        expect.objectContaining({ src: expect.stringMatching(/icon-512\.png\?v=/) }),
        expect.objectContaining({ src: expect.stringMatching(/icon-512-maskable\.png\?v=/) }),
      ])
    );
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
    await expect(page.locator('body')).toHaveClass(/is-vtt-compact/);

    await app.reload();

    await expect(app.expertModeCheckbox).toBeChecked();
    await expect(app.expertPad).toBeVisible();
    await expect(app.expertPad).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/is-vtt-compact/);
  });
});