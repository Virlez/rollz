import { describe, test, expect, vi } from 'vitest';
import { evaluateTokens as core } from '../../packages/core/src/engine.js';
import { evaluateTokens as web } from '../../app/js/engine.js';
import { parseFormula } from '../../packages/core/src/parser.js';

// Fail immediately if the engine asks for too many/few dice or the wrong sides.
function rng(batches: { count: number; sides: number; values: number[] }[]) {
  let cursor = 0;
  const draw = vi.fn(async (count: number, sides: number) => {
    const batch = batches[cursor++];
    expect(batch, 'unexpected additional draw').toBeDefined();
    expect({ count, sides }).toEqual({ count: batch.count, sides: batch.sides });
    return [...batch.values];
  });
  return draw;
}
const detail = (finalRolls: number[], subtotal: number) => ({
  finalRolls, subtotal, originalRolls: [], rerollMask: [], successMatches: [], successCount: 0, bonusRolls: [], ignored: false,
});
for (const [name, evaluate] of Object.entries({ core, web })) {
  describe(`${name} engine`, () => {
    // These calculation variants previously started a browser each time.
    test.each<{
      formula: string;
      batches: { count: number; sides: number; values: number[] }[];
      options?: { advantageMode?: 'advantage'; successMode?: boolean };
      total: number;
      finalRolls: number[];
    }>([
      { formula: '1d6 + 4', batches: [{ count: 1, sides: 6, values: [3] }], total: 7, finalRolls: [3] },
      { formula: '1d20 - 5', batches: [{ count: 1, sides: 20, values: [15] }], total: 10, finalRolls: [15] },
      { formula: '2d6 + 1d4', batches: [
        { count: 1, sides: 4, values: [2] }, { count: 2, sides: 6, values: [3, 4] },
      ], total: 9, finalRolls: [3, 4] },
      { formula: '1d4 - 3', batches: [{ count: 1, sides: 4, values: [4] }], total: 1, finalRolls: [4] },
      { formula: '3d6 + 2d4 + 1d8 + 10', batches: [
        { count: 2, sides: 4, values: [2, 2] }, { count: 3, sides: 6, values: [3, 3, 3] },
        { count: 1, sides: 8, values: [5] },
      ], total: 28, finalRolls: [3, 3, 3] },
      { formula: '2d6', options: { advantageMode: 'advantage' },
        batches: [{ count: 3, sides: 6, values: [2, 5, 4] }], total: 9, finalRolls: [5, 4] },
      { formula: '2d6 + 3', options: { successMode: true },
        batches: [{ count: 2, sides: 6, values: [4, 3] }], total: 4, finalRolls: [4, 3] },
      { formula: '2d6', options: { successMode: true }, batches: [
        { count: 2, sides: 6, values: [2, 4] }, { count: 2, sides: 6, values: [6, 2] },
      ], total: 4, finalRolls: [2, 4] },
    ])('calculates $formula with $options', async ({ formula, batches, options, total, finalRolls }) => {
      const drawNumbers = rng(batches);
      const result = await evaluate(parseFormula(formula), { ...options, drawNumbers });
      expect(result.total).toBe(total);
      expect(result.tokenResults[0]?.finalRolls).toEqual(finalRolls);
      expect(result.totalKind).toBe(options?.successMode ? 'successes' : 'total');
      expect(drawNumbers).toHaveBeenCalledTimes(batches.length);
    });

    test('pools equal-sided dice without reusing values, adds modifiers and subtracts negative groups', async () => {
      const tokens = parseFormula('2+2d6-1d6+1d4-3');
      const drawNumbers = rng([{ count: 1, sides: 4, values: [2] }, { count: 3, sides: 6, values: [1, 6, 4] }]);
      expect(await evaluate(tokens, { drawNumbers })).toEqual({
        total: 4, tokens, tokenResults: [null, detail([1, 6], 7), detail([4], -4), detail([2], 2), null],
        advantageMode: 'none', successMode: false, totalKind: 'total',
      });
      expect(drawNumbers).toHaveBeenCalledTimes(2);
    });

    test.each([
      ['advantage', 5, 2, 8], ['disadvantage', 2, 5, 5],
    ] as const)('%s changes only the first die, with modifiers before the first group', async (advantageMode, keptFirst, discardedFirst, total) => {
      const tokens = parseFormula('1+2d6-1d6');
      const drawNumbers = rng([{ count: 4, sides: 6, values: [2, 5, 3, 1] }]);
      expect(await evaluate(tokens, { advantageMode, drawNumbers })).toEqual({
        total, tokens, tokenResults: [null, { ...detail([keptFirst, 3], keptFirst + 3), advantagePair: [2, 5], keptFirst, discardedFirst, restDrawn: [3] }, detail([1], -1)],
        advantageMode, successMode: false, totalKind: 'total',
      });
      expect(drawNumbers).toHaveBeenCalledTimes(1);
    });

    test('advantage on negative dice keeps high values then subtracts their subtotal', async () => {
      const result = await evaluate(parseFormula('-1d6'), { advantageMode: 'advantage', drawNumbers: rng([{ count: 2, sides: 6, values: [2, 6] }]) });
      expect(result.total).toBe(-6);
      expect(result.tokenResults[0]?.subtotal).toBe(-6);
    });

    test('rerolls eligible dice once, including equality, before counting successes', async () => {
      const tokens = parseFormula('4d6R2>=4+2');
      const drawNumbers = rng([{ count: 4, sides: 6, values: [1, 2, 4, 6] }, { count: 2, sides: 6, values: [2, 5] }]);
      expect(await evaluate(tokens, { advantageMode: 'advantage', drawNumbers })).toEqual({
        total: 5, tokens, tokenResults: [{
          finalRolls: [2, 5, 4, 6], originalRolls: [1, 2, 4, 6], rerollMask: [true, true, false, false],
          successMatches: [false, true, true, true], successCount: 3, bonusRolls: [], ignored: false, subtotal: 3,
        }, null], advantageMode: 'none', successMode: false, totalKind: 'successes',
      });
      expect(drawNumbers).toHaveBeenCalledTimes(2);
    });

    test('mixes negative threshold and ordinary dice with a numeric total', async () => {
      const tokens = parseFormula('-2d6>=4+1d4+1');
      expect(await evaluate(tokens, { drawNumbers: rng([{ count: 2, sides: 6, values: [4, 3] }, { count: 1, sides: 4, values: [3] }]) })).toEqual({
        total: 3, tokens, tokenResults: [
          { ...detail([4, 3], -1), rerollMask: [false, false], successMatches: [true, false], successCount: 1 },
          { ...detail([3], 3), rerollMask: [false] }, null,
        ], advantageMode: 'none', successMode: false, totalKind: 'total',
      });
    });

    test('sums reroll-only groups and does not draw again when none qualifies', async () => {
      const drawNumbers = rng([{ count: 2, sides: 6, values: [3, 6] }]);
      const result = await evaluate(parseFormula('-2d6R2'), { drawNumbers });
      expect(result.total).toBe(-9);
      expect(result.totalKind).toBe('total');
      expect(result.tokenResults).toEqual([{ ...detail([3, 6], -9), originalRolls: [3, 6], rerollMask: [false, false] }]);
      expect(drawNumbers).toHaveBeenCalledTimes(1);
    });

    test.each([
      [[2, 3], [], 1, false, 4],
      [[1, 3], [], 0, true, 0],
      [[2, 4], [1, 6], 2, false, 6],
    ] as const)('success mode handles initial %j and bonus %j', async (values, bonus, successCount, criticalFailure, total) => {
      const tokens = parseFormula('2+2d6+1d4+1');
      const batches: { count: number; sides: number; values: number[] }[] = [{ count: 2, sides: 6, values: [...values] }];
      if (bonus.length) batches.push({ count: 2, sides: 6, values: [...bonus] });
      const drawNumbers = rng(batches);
      expect(await evaluate(tokens, { successMode: true, advantageMode: 'advantage', drawNumbers })).toEqual({
        total, tokens, tokenResults: [null, {
          ...detail([...values], criticalFailure ? 0 : successCount + (bonus.length ? 1 : 0)),
          successMatches: values.map(value => value % 2 === 0), successCount, bonusRolls: [...bonus],
        }, { ...detail([], 0), ignored: true }, null],
        advantageMode: 'none', successMode: true, totalKind: 'successes', criticalFailure, successBonusCount: bonus.length ? 1 : 0,
      });
      expect(drawNumbers).toHaveBeenCalledTimes(bonus.length ? 2 : 1);
    });

    test('success mode counts an unequal number of even and odd bonus dice with the first token at index zero', async () => {
      const tokens = parseFormula('3d6');
      const drawNumbers = rng([{ count: 3, sides: 6, values: [2, 4, 6] }, { count: 3, sides: 6, values: [1, 3, 2] }]);
      expect(await evaluate(tokens, { successMode: true, drawNumbers })).toEqual({
        total: 4, tokens, tokenResults: [{ ...detail([2, 4, 6], 4), successMatches: [true, true, true], successCount: 3, bonusRolls: [1, 3, 2] }],
        advantageMode: 'none', successMode: true, totalKind: 'successes', criticalFailure: false, successBonusCount: 1,
      });
      expect(drawNumbers).toHaveBeenCalledTimes(2);
    });

    test('success mode tolerates no dice and never draws', async () => {
      const drawNumbers = vi.fn();
      expect(await evaluate([{ type: 'modifier', value: 3, raw: '3' }], { successMode: true, drawNumbers })).toEqual({
        total: 0, tokens: [{ type: 'modifier', value: 3, raw: '3' }], tokenResults: [null], advantageMode: 'none', successMode: true, totalKind: 'successes',
      });
      expect(drawNumbers).not.toHaveBeenCalled();
    });

    test('invalid modes default to ordinary totals', async () => {
      const result = await evaluate(parseFormula('1d6'), { advantageMode: 'invalid' as never, drawNumbers: rng([{ count: 1, sides: 6, values: [3] }]) });
      expect(result.advantageMode).toBe('none');
      expect(result.total).toBe(3);
    });

    test('rejects missing RNG and propagates RNG failures', async () => {
      await expect(evaluate(parseFormula('1d6'), {} as never)).rejects.toThrow(new TypeError('evaluateTokens requires a drawNumbers option'));
      const error = new Error('source unavailable');
      await expect(evaluate(parseFormula('1d6'), { drawNumbers: async () => { throw error; } })).rejects.toBe(error);
    });
  });
}
