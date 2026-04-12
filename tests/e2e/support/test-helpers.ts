import type { Page } from '@playwright/test';

export async function mockRandomOrg(page: Page, values: number[]): Promise<void> {
  let cursor = 0;

  await page.route(/random\.org\/integers/, async route => {
    const url = new URL(route.request().url());
    const count = parseInt(url.searchParams.get('num') || '1', 10);
    const batch = values.slice(cursor, cursor + count);
    cursor += count;

    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: `${batch.join('\n')}\n`,
    });
  });
}

export async function disableCryptoFallback(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const cryptoObject = window.crypto as unknown as {
      getRandomValues?: Crypto['getRandomValues'];
    };

    try {
      Object.defineProperty(cryptoObject, 'getRandomValues', {
        configurable: true,
        value: undefined,
      });
    } catch {
      cryptoObject.getRandomValues = undefined;
    }
  });
}

export async function clearLocalStorageOnInit(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
  });
}

export async function setStoredLanguageOnInit(page: Page, language: 'en' | 'fr'): Promise<void> {
  await page.addInitScript(value => {
    localStorage.setItem('rollz_lang', value);
  }, language);
}