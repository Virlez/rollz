import { webcrypto } from 'node:crypto';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as core from '../../packages/core/src/random.js';
import * as web from '../../app/js/random.js';

for (const [name, random] of Object.entries({ core, web })) {
  describe(`${name} random source`, () => {
    beforeEach(() => { vi.stubGlobal('window', { crypto: webcrypto }); });

    test('requests the expected RANDOM.ORG parameters and parses newline-separated integers', async () => {
      const fetch = vi.fn().mockResolvedValue(new Response(' 1\n6\n', { status: 200 }));
      vi.stubGlobal('fetch', fetch);
      expect(await random.fetchFromRandomOrg(2, 1, 6)).toEqual([1, 6]);
      expect(fetch).toHaveBeenCalledTimes(1);
      const [input, options] = fetch.mock.calls[0];
      const url = new URL(input);
      expect(url.origin + url.pathname).toBe('https://www.random.org/integers/');
      expect(Object.fromEntries(url.searchParams)).toEqual({ num: '2', min: '1', max: '6', col: '1', base: '10', format: 'plain', rnd: 'new' });
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    test.each([
      [503, 'unavailable', 'random.org responded with 503'],
      [200, '1\n', 'Unexpected response from random.org'],
      [200, '1\n2\n3', 'Unexpected response from random.org'],
      [200, '1\nnope', 'Unexpected response from random.org'],
    ])('rejects malformed or failed responses (%i, %j)', async (status, body, message) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })));
      await expect(random.fetchFromRandomOrg(2, 1, 6)).rejects.toThrow(message);
    });

    test('crypto rejects biased tail values, accepts the last valid one and returns exactly count dice', () => {
      const getRandomValues = vi.spyOn(webcrypto, 'getRandomValues').mockImplementation((array: any) => {
        array.fill(0);
        array.set([4294967295, 4294967292, 4294967291, 0, 5]);
        return array;
      });
      expect(random.getCryptoRandomNumbers(3, 6)).toEqual([6, 1, 6]);
      expect(getRandomValues).toHaveBeenCalledTimes(1);
      expect(random.getCryptoRandomNumbers(0, 6)).toEqual([]);
      expect(getRandomValues).toHaveBeenCalledTimes(1);
    });

    test('crypto refills after a rejected batch', () => {
      let calls = 0;
      vi.spyOn(webcrypto, 'getRandomValues').mockImplementation((array: any) => {
        array.fill(calls++ === 0 ? 4294967295 : 1);
        return array;
      });
      expect(random.getCryptoRandomNumbers(9, 6)).toEqual(Array(9).fill(2));
      expect(calls).toBeGreaterThanOrEqual(2);
    });

    test('reports randomorg until fallback, retains crypto provenance, and isolates sources', async () => {
      vi.spyOn(webcrypto, 'getRandomValues').mockImplementation((array: any) => { array.fill(0); return array; });
      const fetch = vi.fn()
        .mockResolvedValueOnce(new Response('4\n'))
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce(new Response('5\n'));
      vi.stubGlobal('fetch', fetch);
      const source = random.createRandomNumberSource();
      const other = random.createRandomNumberSource();
      expect(source.getSource()).toBe('randomorg');
      expect(await source.getRandomNumbers(1, 6)).toEqual([4]);
      expect(source.getSource()).toBe('randomorg');
      expect(await source.getRandomNumbers(2, 6)).toEqual([1, 1]);
      expect(source.getSource()).toBe('crypto');
      expect(await source.getRandomNumbers(1, 6)).toEqual([5]);
      expect(source.getSource()).toBe('crypto');
      expect(other.getSource()).toBe('randomorg');
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
}

test('web crypto reports unavailable API instead of inventing a random result', () => {
  vi.stubGlobal('window', {});
  expect(() => web.getCryptoRandomNumbers(1, 6)).toThrow('Web Crypto is unavailable');
  vi.stubGlobal('window', { crypto: {} });
  expect(() => web.getCryptoRandomNumbers(1, 6)).toThrow('Web Crypto is unavailable');
});

test('web convenience helper returns a random draw', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('3\n')));
  expect(await web.getRandomNumbers(1, 6)).toEqual([3]);
});
