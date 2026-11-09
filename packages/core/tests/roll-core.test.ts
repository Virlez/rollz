import { test } from 'vitest';
import assert from 'node:assert/strict';
import { evaluateTokens, parseAndValidateRollRequest, RollValidationError } from '../src/index.js';

function createQueueRng(values: number[]) {
  let cursor = 0;
  return async (count: number) => {
    const next = values.slice(cursor, cursor + count);
    cursor += count;
    return next;
  };
}

test('parses repeats and formulas', () => {
  const request = parseAndValidateRollRequest('3x 1d20 + 6;1d10');
  assert.equal(request.repeatCount, 3);
  assert.deepEqual(request.formulas, [
    { formula: '1d20 + 6', tokens: [
      { type: 'dice', count: 1, sides: 20, raw: '1d20' },
      { type: 'modifier', value: 6, raw: '+6' },
    ] },
    { formula: '1d10', tokens: [{ type: 'dice', count: 1, sides: 10, raw: '1d10' }] },
  ]);
});

test('evaluates advantage on first dice group', async () => {
  const request = parseAndValidateRollRequest('1d20+2');
  const result = await evaluateTokens(request.formulas[0].tokens, {
    advantageMode: 'advantage',
    drawNumbers: createQueueRng([4, 17]),
  });

  assert.equal(result.total, 19);
  assert.deepEqual(result.tokenResults[0]?.advantagePair, [4, 17]);
});

test('evaluates inline reroll plus threshold', async () => {
  const request = parseAndValidateRollRequest('4d6R1>=4');
  const result = await evaluateTokens(request.formulas[0].tokens, {
    drawNumbers: createQueueRng([1, 4, 6, 2, 5]),
  });

  assert.equal(result.total, 3);
  assert.equal(result.totalKind, 'successes');
  assert.deepEqual(result.tokenResults[0]?.finalRolls, [5, 4, 6, 2]);
});

test('blocks excessive repeat counts', () => {
  assert.throws(() => parseAndValidateRollRequest('99x 1d20'), new RollValidationError('Repeat count exceeds the limit of 20.'));
  assert.equal(parseAndValidateRollRequest('20x 1d20').repeatCount, 20);
});