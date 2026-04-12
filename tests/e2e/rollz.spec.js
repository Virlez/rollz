// @ts-check
'use strict';

const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Route random.org requests so tests are deterministic and never hit the
 * network.  `values` is the flat pool of integers consumed sequentially
 * across requests, one batch per API call (sized by the `num` param).
 *
 * @param {import('@playwright/test').Page} page
 * @param {number[]} values
 */
async function mockRandomOrg(page, values) {
  let cursor = 0;
  await page.route(/random\.org\/integers/, route => {
    const url = new URL(route.request().url());
    const count = parseInt(url.searchParams.get('num') || '1', 10);
    const batch = values.slice(cursor, cursor + count);
    cursor += count;
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: batch.join('\n') + '\n',
    });
  });
}

/** Navigate to the app and wait until it is fully initialised. */
async function gotoApp(page) {
  await page.goto('/');
  await page.waitForSelector('#roll-btn');
}

// ---------------------------------------------------------------------------
// 1. Page load
// ---------------------------------------------------------------------------

test.describe('Page load', () => {
  test('has correct title', async ({ page }) => {
    await gotoApp(page);
    await expect(page).toHaveTitle(/Rollz/);
  });

  test('shows all seven dice buttons', async ({ page }) => {
    await gotoApp(page);
    const diceButtons = page.locator('.die-btn');
    await expect(diceButtons).toHaveCount(7);
  });

  test('roll button is initially disabled', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('#roll-btn')).toBeDisabled();
  });

  test('formula input is empty on load', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('#formula-input')).toHaveValue('');
  });

  test('result section is hidden on load', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('#result-section')).toBeHidden();
  });

  test('error banner is hidden on load', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('#error-banner')).toBeHidden();
  });

  test('history empty state is visible on load', async ({ page }) => {
    await gotoApp(page);
    // Clear any persisted history from previous test runs
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#roll-btn');
    await expect(page.locator('#history-empty')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Language toggle
// ---------------------------------------------------------------------------

test.describe('Language toggle', () => {
  test('default language is French', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await gotoApp(page);
    await expect(page.locator('[data-i18n="rollBtn"]')).toHaveText('Lancer !');
  });

  test('clicking lang toggle switches to English', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await gotoApp(page);
    await page.click('#lang-toggle');
    await expect(page.locator('[data-i18n="rollBtn"]')).toHaveText('Roll!');
  });

  test('clicking lang toggle twice returns to French', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await gotoApp(page);
    await page.click('#lang-toggle');
    await page.click('#lang-toggle');
    await expect(page.locator('[data-i18n="rollBtn"]')).toHaveText('Lancer !');
  });

  test('lang flag shows opposite language', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await gotoApp(page);
    // French UI → flag shows EN (GB flag)
    const flagSrc = await page.locator('#lang-flag').getAttribute('src');
    expect(flagSrc).toContain('gb');

    await page.click('#lang-toggle');
    // English UI → flag shows FR
    const flagSrcAfter = await page.locator('#lang-flag').getAttribute('src');
    expect(flagSrcAfter).toContain('fr');
  });

  test('language preference is persisted in localStorage', async ({ page }) => {
    // Fresh browser context already has empty localStorage; no need to explicitly clear.
    await gotoApp(page);
    await page.click('#lang-toggle'); // switch to EN → saved in localStorage
    await page.reload();
    await page.waitForSelector('#roll-btn');
    await expect(page.locator('[data-i18n="rollBtn"]')).toHaveText('Roll!');
  });
});

// ---------------------------------------------------------------------------
// 2b. PWA shell / offline cues
// ---------------------------------------------------------------------------

test.describe('PWA shell', () => {
  test('exposes a web manifest link', async ({ page }) => {
    await gotoApp(page);
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', 'manifest.webmanifest');
  });

  test('shows the install button after beforeinstallprompt fires', async ({ page }) => {
    await gotoApp(page);

    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'prompt', {
        value: () => Promise.resolve(),
      });
      Object.defineProperty(event, 'userChoice', {
        value: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
      });
      window.dispatchEvent(event);
    });

    await expect(page.locator('#install-btn')).toBeVisible();
  });

  test('hides the install button after appinstalled fires', async ({ page }) => {
    await gotoApp(page);

    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'prompt', {
        value: () => Promise.resolve(),
      });
      Object.defineProperty(event, 'userChoice', {
        value: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      });
      window.dispatchEvent(event);
    });

    await expect(page.locator('#install-btn')).toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    await expect(page.locator('#install-btn')).toBeHidden();
  });

  test('shows the offline badge when the browser goes offline', async ({ page }) => {
    await gotoApp(page);
    await page.context().setOffline(true);
    await expect(page.locator('#offline-badge')).toBeVisible();
    await page.context().setOffline(false);
  });

  test('falls back to Web Crypto when random.org is unreachable', async ({ page }) => {
    await gotoApp(page);
    await page.route(/random\.org\/integers/, route => route.abort());
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');

    await expect(page.locator('#error-banner')).toBeHidden();
    await expect(page.locator('#result-section')).toBeVisible();
    await expect(page.locator('#result-source-note')).toContainText('Crypto');
  });
});

// ---------------------------------------------------------------------------
// 3. Dice buttons
// ---------------------------------------------------------------------------

test.describe('Dice buttons', () => {
  test('clicking a die adds it to the formula', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="6"]');
    await expect(page.locator('#formula-input')).toHaveValue('1d6');
  });

  test('clicking the same die twice increments the counter', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="6"]');
    await page.click('[data-sides="6"]');
    await expect(page.locator('#formula-input')).toHaveValue('2d6');
    const counter = page.locator('[data-sides="6"] .die-counter');
    await expect(counter).toHaveText('2');
  });

  test('clicking different dice builds a combined formula', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="20"]');
    await page.click('[data-sides="4"]');
    await expect(page.locator('#formula-input')).toHaveValue('1d20 + 1d4');
  });

  test('die button gets is-selected class when clicked', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="8"]');
    await expect(page.locator('[data-sides="8"]')).toHaveClass(/is-selected/);
  });

  test('clicking a die enables the roll button', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="12"]');
    await expect(page.locator('#roll-btn')).toBeEnabled();
  });

  test('modifier buttons update the built formula', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="6"]');
    await page.click('#modifier-inc');
    await expect(page.locator('#formula-input')).toHaveValue('1d6 + 1');

    await page.click('#modifier-dec');
    await page.click('#modifier-dec');
    await expect(page.locator('#formula-input')).toHaveValue('1d6 - 1');
  });

  test('typing in the modifier input updates the formula', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="20"]');
    await page.fill('#modifier-input', '-3');
    await page.locator('#modifier-input').blur();
    await expect(page.locator('#formula-input')).toHaveValue('1d20 - 3');
  });

  test('manual formula typing resets the modifier widget', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="8"]');
    await page.click('#modifier-inc');
    await expect(page.locator('#modifier-input')).toHaveValue('1');

    await page.fill('#formula-input', '2d6 + 4');
    await expect(page.locator('#modifier-input')).toHaveValue('0');
  });
});

// ---------------------------------------------------------------------------
// 4. Formula input & preview
// ---------------------------------------------------------------------------

test.describe('Formula input and preview', () => {
  test('typing a valid formula enables roll button and shows valid preview', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '2d6 + 4');
    await expect(page.locator('#roll-btn')).toBeEnabled();
    await expect(page.locator('#formula-preview')).toHaveClass(/is-valid/);
  });

  test('preview shows check mark for valid formula', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '1d20');
    const preview = page.locator('#formula-preview');
    await expect(preview).toContainText('✓');
  });

  test('typing an invalid formula disables roll button and marks preview invalid', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', 'abc');
    await expect(page.locator('#roll-btn')).toBeDisabled();
    await expect(page.locator('#formula-preview')).toHaveClass(/is-invalid/);
  });

  test('clearing the input resets preview to empty state', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.fill('#formula-input', '');
    await expect(page.locator('#formula-preview')).not.toHaveClass(/is-valid/);
    await expect(page.locator('#formula-preview')).not.toHaveClass(/is-invalid/);
  });

  test('modifier-only formula is invalid (no dice)', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '5');
    await expect(page.locator('#roll-btn')).toBeDisabled();
    await expect(page.locator('#formula-preview')).toHaveClass(/is-invalid/);
  });

  test('complex formula with multiple groups is valid', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '3d8 + 1d4 + 5');
    await expect(page.locator('#roll-btn')).toBeEnabled();
    await expect(page.locator('#formula-preview')).toHaveClass(/is-valid/);
  });

  test('semicolon-separated formulas are valid when each segment is valid', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '1d20 + 4;1d8 + 2');
    await expect(page.locator('#roll-btn')).toBeEnabled();
    await expect(page.locator('#formula-preview')).toHaveClass(/is-valid/);
  });

  test('formula with subtraction is valid', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '1d20 - 2');
    await expect(page.locator('#roll-btn')).toBeEnabled();
  });

  test('manual typing clears dice button selection', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="6"]');
    await expect(page.locator('[data-sides="6"] .die-counter')).toHaveText('1');
    // Manually edit the formula
    await page.fill('#formula-input', '1d8');
    await expect(page.locator('[data-sides="6"] .die-counter')).toHaveText('0');
    await expect(page.locator('[data-sides="6"]')).not.toHaveClass(/is-selected/);
  });
});

// ---------------------------------------------------------------------------
// 5. Clear button
// ---------------------------------------------------------------------------

test.describe('Clear button', () => {
  test('clears the formula input', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '2d6 + 4');
    await page.click('#clear-btn');
    await expect(page.locator('#formula-input')).toHaveValue('');
  });

  test('disables the roll button after clearing', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.click('#clear-btn');
    await expect(page.locator('#roll-btn')).toBeDisabled();
  });

  test('resets dice counter badges', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="6"]');
    await page.click('[data-sides="6"]');
    await page.click('#clear-btn');
    await expect(page.locator('[data-sides="6"] .die-counter')).toHaveText('0');
    await expect(page.locator('[data-sides="6"]')).not.toHaveClass(/is-selected/);
  });

  test('hides result section after clearing', async ({ page }) => {
    await mockRandomOrg(page, [4]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('#result-section')).toBeVisible();
    await page.click('#clear-btn');
    await expect(page.locator('#result-section')).toBeHidden();
  });

  test('hides error banner after clearing', async ({ page }) => {
    await gotoApp(page);
    // Trigger an error by trying to roll an invalid formula directly
    await page.evaluate(() => {
      document.getElementById('formula-input').value = '???';
      document.getElementById('roll-btn').disabled = false;
    });
    await page.click('#roll-btn');
    await expect(page.locator('#error-banner')).toBeVisible();
    await page.click('#clear-btn');
    await expect(page.locator('#error-banner')).toBeHidden();
  });
});

// ---------------------------------------------------------------------------
// 6. Advantage / Disadvantage / Success Mode toggles
// ---------------------------------------------------------------------------

test.describe('Mode toggles', () => {
  test('advantage and disadvantage are mutually exclusive', async ({ page }) => {
    await gotoApp(page);
    await page.click('#advantage-label');
    await expect(page.locator('#advantage-check')).toBeChecked();

    await page.click('#disadvantage-label');
    await expect(page.locator('#disadvantage-check')).toBeChecked();
    await expect(page.locator('#advantage-check')).not.toBeChecked();
  });

  test('advantage and success mode are mutually exclusive', async ({ page }) => {
    await gotoApp(page);
    await page.click('#advantage-label');
    await page.click('#success-label');
    await expect(page.locator('#success-check')).toBeChecked();
    await expect(page.locator('#advantage-check')).not.toBeChecked();
  });

  test('disadvantage and success mode are mutually exclusive', async ({ page }) => {
    await gotoApp(page);
    await page.click('#disadvantage-label');
    await page.click('#success-label');
    await expect(page.locator('#success-check')).toBeChecked();
    await expect(page.locator('#disadvantage-check')).not.toBeChecked();
  });

  test('success mode shows warning in formula preview', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '3d6');
    await page.click('#success-label');
    const preview = page.locator('#formula-preview');
    await expect(preview).toContainText('⚠');
  });

  test('advantage mode shows warning when multiple dice are used', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.click('#advantage-label');
    await expect(page.locator('#formula-preview')).toContainText('⚠');
  });

  test('multi-roll preview warns that special modes apply only to the first formula', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '1d20;1d8');
    await page.click('#advantage-label');
    await expect(page.locator('#formula-preview')).toContainText('premiere formule');
  });

  test('unchecking advantage resets mode and removes warning', async ({ page }) => {
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.click('#advantage-label');
    await page.click('#advantage-label'); // toggle off
    await expect(page.locator('#formula-preview')).not.toContainText('⚠');
  });
});

// ---------------------------------------------------------------------------
// 7. Rolling — normal mode
// ---------------------------------------------------------------------------

test.describe('Roll action — normal mode', () => {
  test('shows result section after a successful roll', async ({ page }) => {
    await mockRandomOrg(page, [3]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('#result-section')).toBeVisible();
  });

  test('displays the correct total', async ({ page }) => {
    await mockRandomOrg(page, [5]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('5');
  });

  test('adds modifier to dice result', async ({ page }) => {
    // 1d6 = 3, +4 → total 7
    await mockRandomOrg(page, [3]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6 + 4');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('7');
  });

  test('subtracts modifier from dice result', async ({ page }) => {
    // 1d20 = 15, -5 → total 10
    await mockRandomOrg(page, [15]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d20 - 5');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('10');
  });

  test('sums multiple dice groups', async ({ page }) => {
    // 2d6 = [3, 4] = 7, 1d4 = [2] = 2, total = 9
    await mockRandomOrg(page, [3, 4, 2]);
    await gotoApp(page);
    await page.fill('#formula-input', '2d6 + 1d4');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('9');
  });

  test('result shows die values in breakdown chips', async ({ page }) => {
    await mockRandomOrg(page, [6]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('.die-result').first()).toHaveText('6');
  });

  test('max roll chip has is-max class', async ({ page }) => {
    await mockRandomOrg(page, [6]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('.die-result.is-max')).toHaveCount(1);
  });

  test('min roll chip has is-min class', async ({ page }) => {
    await mockRandomOrg(page, [1]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('.die-result.is-min')).toHaveCount(1);
  });

  test('Enter key triggers roll', async ({ page }) => {
    await mockRandomOrg(page, [4]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.press('#formula-input', 'Enter');
    await expect(page.locator('#result-section')).toBeVisible();
  });

  test('negative modifier formula works', async ({ page }) => {
    // 1d4 = 4, -3 → total 1
    await mockRandomOrg(page, [4]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d4 - 3');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('1');
  });

  test('semicolon-separated formulas render one result block per formula', async ({ page }) => {
    await mockRandomOrg(page, [10, 3]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d20 + 4;1d8 + 2');
    await page.click('#roll-btn');

    await expect(page.locator('#result-multi')).toBeVisible();
    await expect(page.locator('#result-multi .result-sub-block')).toHaveCount(2);
    await expect(page.locator('#result-multi .result-total').nth(0)).toHaveText('14');
    await expect(page.locator('#result-multi .result-total').nth(1)).toHaveText('5');
  });
});

// ---------------------------------------------------------------------------
// 8. Rolling — advantage / disadvantage
// ---------------------------------------------------------------------------

test.describe('Roll action — advantage/disadvantage', () => {
  test('advantage keeps the higher of two rolls for the first die', async ({ page }) => {
    // First die of 1d20 gets rolled twice: [8, 15] → keeps 15
    await mockRandomOrg(page, [8, 15]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d20');
    await page.click('#advantage-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('15');
  });

  test('disadvantage keeps the lower of two rolls for the first die', async ({ page }) => {
    // First die rolled twice: [12, 5] → keeps 5
    await mockRandomOrg(page, [12, 5]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d20');
    await page.click('#disadvantage-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('5');
  });

  test('advantage result shows kept and discarded chips', async ({ page }) => {
    await mockRandomOrg(page, [3, 17]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d20');
    await page.click('#advantage-label');
    await page.click('#roll-btn');
    await expect(page.locator('.is-kept')).toHaveCount(1);
    await expect(page.locator('.is-discarded')).toHaveCount(1);
  });

  test('advantage applies only to first die of multi-die roll', async ({ page }) => {
    // 2d6 with advantage: first die gets pair [2,5], second die gets [4].
    // Kept first = 5, second = 4 → total 9
    await mockRandomOrg(page, [2, 5, 4]);
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.click('#advantage-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('9');
  });

  test('equal advantage rolls do not show discarded chip', async ({ page }) => {
    await mockRandomOrg(page, [7, 7]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d20');
    await page.click('#advantage-label');
    await page.click('#roll-btn');
    await expect(page.locator('.is-discarded')).toHaveCount(0);
  });

  test('advantage applies only to the first formula in a semicolon-separated roll', async ({ page }) => {
    await mockRandomOrg(page, [4, 17, 6]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d20;1d8');
    await page.click('#advantage-label');
    await page.click('#roll-btn');

    await expect(page.locator('#result-multi .result-total').nth(0)).toHaveText('17');
    await expect(page.locator('#result-multi .result-total').nth(1)).toHaveText('6');
    await expect(page.locator('#result-multi .is-kept')).toHaveCount(1);
    await expect(page.locator('#result-multi .is-discarded')).toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// 9. Rolling — success mode
// ---------------------------------------------------------------------------

test.describe('Roll action — success mode', () => {
  test('counts even results as successes', async ({ page }) => {
    // 3d6 = [2, 4, 3] → 2 successes
    await mockRandomOrg(page, [2, 4, 3]);
    await gotoApp(page);
    await page.fill('#formula-input', '3d6');
    await page.click('#success-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('2');
  });

  test('adds modifier to success count', async ({ page }) => {
    // 2d6 = [4, 3] → 1 success (4 even, 3 odd; not all-even so no bonus) + 3 modifier = 4
    await mockRandomOrg(page, [4, 3]);
    await gotoApp(page);
    await page.fill('#formula-input', '2d6 + 3');
    await page.click('#success-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('4');
  });

  test('critical failure (all odd) gives total 0', async ({ page }) => {
    // 2d6 = [1, 3] → all odd → critical failure → 0
    await mockRandomOrg(page, [1, 3]);
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.click('#success-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('0');
  });

  test('critical failure shows fumble note', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('rollz_lang', 'en'));
    await mockRandomOrg(page, [1, 3]);
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.click('#success-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total-note')).toContainText('Fumble');
  });

  test('bonus reroll triggers when all dice are even', async ({ page }) => {
    // 2d6: all even [2, 4] → bonus reroll [1, 5] → 2 + 0 = 2 successes total
    await mockRandomOrg(page, [2, 4, 1, 5]);
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.click('#success-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('2');
  });

  test('bonus reroll adds its even results', async ({ page }) => {
    // 2d6: [2, 4] → 2 successes; bonus [6, 2] → 2 more → total 4
    await mockRandomOrg(page, [2, 4, 6, 2]);
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.click('#success-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('4');
  });

  test('even dice are styled is-success, odd dice is-failure', async ({ page }) => {
    // 3d6: [2, 3, 4]
    await mockRandomOrg(page, [2, 3, 4]);
    await gotoApp(page);
    await page.fill('#formula-input', '3d6');
    await page.click('#success-label');
    await page.click('#roll-btn');
    await expect(page.locator('.die-result.is-success')).toHaveCount(2);
    await expect(page.locator('.die-result.is-failure')).toHaveCount(1);
  });

  test('result total label reads "Successes" in English', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('rollz_lang', 'en'));
    await mockRandomOrg(page, [2]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#success-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total-label')).toHaveText('Successes');
  });
});

// ---------------------------------------------------------------------------
// 10. Roll history
// ---------------------------------------------------------------------------

test.describe('Roll history', () => {
  // Each Playwright test gets a fresh browser context with empty localStorage,
  // so no explicit cleanup is needed before each test.

  test('history shows entry after a roll', async ({ page }) => {
    await mockRandomOrg(page, [4]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('.history-entry')).toHaveCount(1);
  });

  test('history entry shows formula and total', async ({ page }) => {
    await mockRandomOrg(page, [4]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    const entry = page.locator('.history-entry').first();
    await expect(entry.locator('.history-formula')).toHaveText('1d6');
    await expect(entry.locator('.history-total')).toHaveText('4');
  });

  test('multi-roll history entry keeps the full formula and both totals', async ({ page }) => {
    await mockRandomOrg(page, [10, 3]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d20 + 4;1d8 + 2');
    await page.click('#roll-btn');

    const entry = page.locator('.history-entry').first();
    await expect(entry.locator('.history-formula')).toHaveText('1d20 + 4;1d8 + 2');
     await expect(entry.locator('.history-total')).toHaveText('14 | 5');
  });

  test('multiple rolls add multiple history entries', async ({ page }) => {
    await mockRandomOrg(page, [3, 5, 2]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await page.click('#roll-btn');
    await page.click('#roll-btn');
    await expect(page.locator('.history-entry')).toHaveCount(3);
  });

  test('most recent roll appears first in history', async ({ page }) => {
    await mockRandomOrg(page, [3, 6]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await page.click('#roll-btn');
    // Wait for both rolls to be recorded before asserting order
    await expect(page.locator('.history-entry')).toHaveCount(2);
    const firstTotal = await page.locator('.history-entry .history-total').first().textContent();
    expect(firstTotal).toBe('6');
  });

  test('clicking a history entry rerolls the same formula automatically', async ({ page }) => {
    await mockRandomOrg(page, [4, 6]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');

    await expect(page.locator('#result-total')).toHaveText('4');
    await page.click('#clear-btn');
    await page.locator('.history-entry').first().click();

    await expect(page.locator('#formula-input')).toHaveValue('1d6');
    await expect(page.locator('#result-total')).toHaveText('6');
    await expect(page.locator('.history-entry')).toHaveCount(2);
  });

  test('clicking history entry records a new roll with the same formula', async ({ page }) => {
    await mockRandomOrg(page, [4, 2]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await page.click('#clear-btn');
    await page.locator('.history-entry').first().click();

    const latestEntry = page.locator('.history-entry').first();
    await expect(latestEntry.locator('.history-formula')).toHaveText('1d6');
    await expect(latestEntry.locator('.history-total')).toHaveText('2');
  });

  test('history reroll preserves saved advantage instead of current toggles', async ({ page }) => {
    await mockRandomOrg(page, [3, 18, 4]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d20');
    await page.click('#advantage-label');
    await page.click('#roll-btn');

    await expect(page.locator('#result-total')).toHaveText('18');

    await page.click('#advantage-label');
    await page.click('#clear-btn');
    await page.locator('.history-entry').first().click();

    await expect(page.locator('#result-total')).toHaveText('4');
    await expect(page.locator('.is-kept')).toHaveCount(1);
  });

  test('history reroll preserves saved normal mode instead of current toggles', async ({ page }) => {
    await mockRandomOrg(page, [5, 2, 6]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');

    await expect(page.locator('#result-total')).toHaveText('5');

    await page.click('#advantage-label');
    await page.click('#clear-btn');
    await page.locator('.history-entry').first().click();

    await expect(page.locator('#result-total')).toHaveText('2');
    await expect(page.locator('.is-kept')).toHaveCount(0);
    await expect(page.locator('.is-discarded')).toHaveCount(0);
  });

  test('history reroll preserves saved success mode instead of current toggles', async ({ page }) => {
    await mockRandomOrg(page, [2, 3, 6]);
    await gotoApp(page);
    await page.fill('#formula-input', '2d6');
    await page.click('#success-label');
    await page.click('#roll-btn');

    await expect(page.locator('#result-total')).toHaveText('1');
    await expect(page.locator('#result-total-label')).toHaveText('Réussites');

    await page.click('#advantage-label');
    await page.click('#clear-btn');
    await page.locator('.history-entry').first().click();

    await expect(page.locator('#result-total')).toHaveText('1');
    await expect(page.locator('#result-total-label')).toHaveText('Réussites');
    await expect(page.locator('.die-result.is-success')).toHaveCount(1);
  });

  test('clear all button removes all history entries', async ({ page }) => {
    await mockRandomOrg(page, [4, 5]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await page.click('#roll-btn');
    await page.click('#clear-history-btn');
    await expect(page.locator('.history-entry')).toHaveCount(0);
    await expect(page.locator('#history-empty')).toBeVisible();
  });

  test('history is persisted across page reloads', async ({ page }) => {
    await mockRandomOrg(page, [3]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await page.reload();
    await page.waitForSelector('#roll-btn');
    await expect(page.locator('.history-entry')).toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// 11. Error handling
// ---------------------------------------------------------------------------

test.describe('Error handling', () => {
  test('network error shows error banner', async ({ page }) => {
    await page.route(/random\.org\/integers/, route => route.abort());
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('#error-banner')).toBeVisible();
  });

  test('error banner is hidden after a successful retry', async ({ page }) => {
    let callCount = 0;
    await page.route(/random\.org\/integers/, route => {
      callCount++;
      if (callCount === 1) {
        route.abort();
      } else {
        route.fulfill({ status: 200, contentType: 'text/plain', body: '4\n' });
      }
    });
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    // First roll fails
    await page.click('#roll-btn');
    await expect(page.locator('#error-banner')).toBeVisible();
    // Second roll succeeds
    await page.click('#roll-btn');
    await expect(page.locator('#error-banner')).toBeHidden();
  });

  test('non-ok HTTP response from random.org shows error banner', async ({ page }) => {
    await page.route(/random\.org\/integers/, route =>
      route.fulfill({ status: 503, body: 'Service Unavailable' })
    );
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('#error-banner')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 12. Edge cases
// ---------------------------------------------------------------------------

test.describe('Edge cases', () => {
  test('d100 (percentile) die works', async ({ page }) => {
    await mockRandomOrg(page, [77]);
    await gotoApp(page);
    await page.click('[data-sides="100"]');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('77');
  });

  test('large formula (many dice groups) resolves correctly', async ({ page }) => {
    // 3d6 + 2d4 + 1d8 + 10
    // [3,3,3] + [2,2] + [5] + 10 = 9 + 4 + 5 + 10 = 28
    await mockRandomOrg(page, [3, 3, 3, 2, 2, 5]);
    await gotoApp(page);
    await page.fill('#formula-input', '3d6 + 2d4 + 1d8 + 10');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('28');
  });

  test('formula with leading spaces is parsed correctly', async ({ page }) => {
    await mockRandomOrg(page, [3]);
    await gotoApp(page);
    await page.fill('#formula-input', '  1d6  ');
    await expect(page.locator('#roll-btn')).toBeEnabled();
  });

  test('roll result card can be re-rolled without clearing', async ({ page }) => {
    await mockRandomOrg(page, [2, 5]);
    await gotoApp(page);
    await page.fill('#formula-input', '1d6');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('2');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('5');
  });

  test('formula built from dice then manually cleared resets counters', async ({ page }) => {
    await gotoApp(page);
    await page.click('[data-sides="6"]');
    await page.click('[data-sides="6"]');
    await page.click('[data-sides="8"]');
    await page.click('#clear-btn');
    for (const sides of [6, 8]) {
      await expect(page.locator(`[data-sides="${sides}"] .die-counter`)).toHaveText('0');
    }
  });

  test('success mode ignores additional dice groups beyond the first', async ({ page }) => {
    // Formula: 2d6 + 1d8 in success mode — only 2d6 is counted
    // 2d6 = [4, 2] → 2 successes (all even → bonus reroll [1, 3] → 0 more); 1d8 is ignored
    await mockRandomOrg(page, [4, 2, 1, 3]);
    await gotoApp(page);
    await page.fill('#formula-input', '2d6 + 1d8');
    await page.click('#success-label');
    await page.click('#roll-btn');
    await expect(page.locator('#result-total')).toHaveText('2');
    // The ignored group should be styled
    await expect(page.locator('.breakdown-group.is-ignored')).toHaveCount(1);
  });
});
