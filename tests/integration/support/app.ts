import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { afterEach, expect, vi } from 'vitest';

const html = readFileSync(new URL('../../../app/index.html', import.meta.url), 'utf8');
let page: JSDOM | undefined;
let verifyDraws: (() => void) | undefined;

afterEach(() => {
  try {
    verifyDraws?.();
  } finally {
    verifyDraws = undefined;
    page?.window.close();
    page = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});

export async function mountApp() {
  // A new window and a fresh module graph isolate DOM references, listeners,
  // storage and application singletons between tests. No internal module mocks.
  vi.resetModules();
  page = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true });
  const { window } = page;
  for (const name of ['window', 'document', 'navigator', 'localStorage', 'Element', 'Node',
    'HTMLElement', 'HTMLButtonElement', 'HTMLInputElement'] as const) {
    vi.stubGlobal(name, name === 'window' ? window : window[name]);
  }
  // jsdom has no layout engine: CSS/media queries and scrolling stay in E2E.
  Object.defineProperty(window, 'matchMedia', { value: (media: string) => ({ matches: false, media }) });
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.localStorage.setItem('rollz_lang', 'en');
  const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error('Unexpected HTTP request'));
  vi.stubGlobal('fetch', fetch);
  if (window.document.readyState === 'loading') {
    await new Promise<void>(resolve => window.document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }));
  }
  await import('../../../app/js/app.js');

  const element = <T extends HTMLElement = HTMLElement>(selector: string): T => {
    const node = window.document.querySelector<T>(selector);
    expect(node, `missing element ${selector}`).not.toBeNull();
    return node!;
  };
  const input = (selector: string, value: string) => {
    const node = element<HTMLInputElement>(selector);
    node.value = value;
    node.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const toggle = (mode: 'advantage' | 'disadvantage' | 'success') => {
    element<HTMLInputElement>(`#${mode}-check`).click();
  };
  const roll = async () => {
    const sequence = Number(window.document.body.dataset.rollSequence);
    element<HTMLButtonElement>('#roll-btn').click();
    await vi.waitFor(() => expect(window.document.body.dataset.rollSequence).toBe(String(sequence + 1)));
  };
  const draws = (batches: { sides: number; values: number[] }[]) => {
    let cursor = 0;
    fetch.mockImplementation(async () => {
      const batch = batches[cursor++];
      if (!batch) throw new Error('Unexpected extra HTTP draw');
      return new Response(batch.values.join('\n') + '\n');
    });
    // Check requests outside fetch: application fallback must not swallow
    // assertion failures and turn an incorrect HTTP request into a passing test.
    verifyDraws = () => {
      expect(fetch).toHaveBeenCalledTimes(batches.length);
      fetch.mock.calls.forEach(([input], index) => {
        const url = new URL(String(input));
        expect(url.origin + url.pathname).toBe('https://www.random.org/integers/');
        expect(url.searchParams.get('num')).toBe(String(batches[index].values.length));
        expect(url.searchParams.get('min')).toBe('1');
        expect(url.searchParams.get('max')).toBe(String(batches[index].sides));
      });
    };
  };
  return {
    window, element, input, toggle, roll, draws, fetch,
    text: (selector: string) => element(selector).textContent,
    texts: (selector: string) => Array.from(window.document.querySelectorAll(selector), node => node.textContent),
    history: () => JSON.parse(window.localStorage.getItem('rollz_history') || '[]') as Array<{
      formula: string; total: string; breakdown: string;
      mode: { advantageMode: string; successMode: boolean };
    }>,
  };
}
