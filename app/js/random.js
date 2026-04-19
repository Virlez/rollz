import { RANDOM_ORG } from './constants.js';

/**
 * @param {number} count
 * @param {number} min
 * @param {number} max
 * @returns {Promise<number[]>}
 */
export async function fetchFromRandomOrg(count, min, max) {
  const url = new URL(RANDOM_ORG);
  url.searchParams.set('num', String(count));
  url.searchParams.set('min', String(min));
  url.searchParams.set('max', String(max));
  url.searchParams.set('col', '1');
  url.searchParams.set('base', '10');
  url.searchParams.set('format', 'plain');
  url.searchParams.set('rnd', 'new');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`random.org responded with ${res.status}`);

  const text = await res.text();
  const nums = text.trim().split('\n').map(Number);
  if (nums.length !== count || nums.some(Number.isNaN)) {
    throw new Error('Unexpected response from random.org');
  }
  return nums;
}

/**
 * @param {number} count
 * @param {number} sides
 * @returns {number[]}
 */
export function getCryptoRandomNumbers(count, sides) {
  if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') {
    throw new Error('Web Crypto is unavailable');
  }

  const values = [];
  const maxUint32 = 0x100000000;
  const limit = Math.floor(maxUint32 / sides) * sides;

  while (values.length < count) {
    const batch = new Uint32Array(Math.max(8, count - values.length));
    window.crypto.getRandomValues(batch);

    for (const randomValue of batch) {
      if (randomValue >= limit) continue;
      values.push((randomValue % sides) + 1);
      if (values.length === count) break;
    }
  }

  return values;
}

/**
 * @returns {{
 *   getRandomNumbers: (count: number, sides: number) => Promise<number[]>,
 *   getSource: () => 'randomorg'|'crypto',
 * }}
 */
export function createRandomNumberSource() {
  /** @type {'randomorg'|'crypto'} */
  let source = 'randomorg';

  return {
    async getRandomNumbers(count, sides) {
      try {
        return await fetchFromRandomOrg(count, 1, sides);
      } catch {
        source = 'crypto';
        return getCryptoRandomNumbers(count, sides);
      }
    },
    getSource() {
      return source;
    },
  };
}

/**
 * @param {number} count
 * @param {number} sides
 * @returns {Promise<number[]>}
 */
export async function getRandomNumbers(count, sides) {
  return createRandomNumberSource().getRandomNumbers(count, sides);
}
