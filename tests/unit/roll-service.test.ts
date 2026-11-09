import { test, expect, vi } from 'vitest';
import { executeRoll } from '../../packages/core/src/roll-service.js';
import { RollValidationError } from '../../packages/core/src/limits.js';

test('executes every formula in every repetition, preserves order and provenance', async () => {
  const fetch = vi.fn();
  for (const value of [1, 2, 3, 4]) fetch.mockResolvedValueOnce(new Response(`${value}\n`));
  vi.stubGlobal('fetch', fetch);
  const batch = await executeRoll('2x 1d6+1;1d8-1');
  expect(batch.input).toBe('2x 1d6+1;1d8-1');
  expect(batch.request.repeatCount).toBe(2);
  expect(batch.request.formulas.map(entry => entry.formula)).toEqual(['1d6+1', '1d8-1']);
  expect(batch.mode).toEqual({ advantageMode: 'none', successMode: false });
  expect(batch.executions.map(entry => ({ formula: entry.formula, total: entry.result.total, source: entry.result.randomSource }))).toEqual([
    { formula: '1d6+1', total: 2, source: 'randomorg' },
    { formula: '1d8-1', total: 1, source: 'randomorg' },
    { formula: '1d6+1', total: 4, source: 'randomorg' },
    { formula: '1d8-1', total: 3, source: 'randomorg' },
  ]);
  expect(fetch).toHaveBeenCalledTimes(4);
});

test('passes normalized mode to the evaluator', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('2\n5\n')));
  const batch = await executeRoll('1d6', { advantageMode: 'advantage' });
  expect(batch.mode).toEqual({ advantageMode: 'advantage', successMode: false });
  expect(batch.executions[0].result.total).toBe(5);
  expect(batch.executions[0].result.advantageMode).toBe('advantage');
});

test('passes success mode to the evaluator', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('2\n3\n')));
  const batch = await executeRoll('2d6', { successMode: true });
  expect(batch.mode).toEqual({ advantageMode: 'none', successMode: true });
  expect(batch.executions[0].result.total).toBe(1);
  expect(batch.executions[0].result.totalKind).toBe('successes');
});

test('validates limits before any external request', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await expect(executeRoll('3x1d6', {}, { maxRepeatCount: 2 })).rejects.toThrow(new RollValidationError('Repeat count exceeds the limit of 2.'));
  await expect(executeRoll('no dice')).rejects.toBeInstanceOf(RollValidationError);
  expect(fetch).not.toHaveBeenCalled();
});
