import { webcrypto } from 'node:crypto';
import { RANDOM_ORG } from './constants.js';
import type { RandomNumberSource } from './types.js';

export async function fetchFromRandomOrg(count: number, min: number, max: number): Promise<number[]> {
  const url = new URL(RANDOM_ORG);
  url.searchParams.set('num', String(count));
  url.searchParams.set('min', String(min));
  url.searchParams.set('max', String(max));
  url.searchParams.set('col', '1');
  url.searchParams.set('base', '10');
  url.searchParams.set('format', 'plain');
  url.searchParams.set('rnd', 'new');

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    throw new Error(`random.org responded with ${response.status}`);
  }

  const text = await response.text();
  const numbers = text.trim().split('\n').map(Number);
  if (numbers.length !== count || numbers.some(Number.isNaN)) {
    throw new Error('Unexpected response from random.org');
  }

  return numbers;
}

export function getCryptoRandomNumbers(count: number, sides: number): number[] {
  const values: number[] = [];
  const maxUint32 = 0x100000000;
  const limit = Math.floor(maxUint32 / sides) * sides;

  while (values.length < count) {
    const batch = new Uint32Array(Math.max(8, count - values.length));
    webcrypto.getRandomValues(batch);

    for (const randomValue of batch) {
      if (randomValue >= limit) continue;
      values.push((randomValue % sides) + 1);
      if (values.length === count) break;
    }
  }

  return values;
}

export function createRandomNumberSource(): RandomNumberSource {
  let source: 'randomorg' | 'crypto' = 'randomorg';

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