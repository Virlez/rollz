import { test, expect } from 'vitest';
import { parseAndValidateRollRequest as parse, resolveLimits, RollValidationError, validateRollRequest } from '../../packages/core/src/limits.js';

test('resolves defaults and respects explicit overrides including zero', () => {
  expect(resolveLimits()).toEqual({ maxRepeatCount: 20, maxFormulasPerRequest: 10, maxDicePerFormula: 100, maxInputLength: 500 });
  expect(resolveLimits({ maxRepeatCount: 0, maxFormulasPerRequest: 2, maxDicePerFormula: 3, maxInputLength: 4 })).toEqual({
    maxRepeatCount: 0, maxFormulasPerRequest: 2, maxDicePerFormula: 3, maxInputLength: 4,
  });
});

test.each([
  ['20x1d6', '21x1d6', {}, 'Repeat count exceeds the limit of 20.'],
  ['2x1d6', '3x1d6', { maxRepeatCount: 2 }, 'Repeat count exceeds the limit of 2.'],
  ['1d6;1d4', '1d6;1d4;1d8', { maxFormulasPerRequest: 2 }, 'Formula count exceeds the limit of 2.'],
  ['50d6-50d4', '50d6-51d4', {}, 'Dice count exceeds the limit of 100 for formula 50d6-51d4.'],
  ['1d6;2d4-1d8', '1d6;3d4-1d8', { maxDicePerFormula: 3 }, 'Dice count exceeds the limit of 3 for formula 3d4-1d8.'],
  ['1d6', '1d20', { maxInputLength: 3 }, 'Formula length exceeds the limit of 3 characters.'],
])('accepts the boundary %s and rejects %s', (valid, invalid, limits, message) => {
  expect(parse(valid, limits)).toBeDefined();
  expect(() => parse(invalid, limits)).toThrow(new RollValidationError(message));
});

test.each([['   ', 'Formula is required.'], ['invalid', 'Formula is not recognized.']])('reports validation errors for %j', (input, message) => {
  expect(() => parse(input)).toThrow(new RollValidationError(message));
});

test('trims input before applying length limit and returns validated request', () => {
  const request = parse(' 1d6 ', { maxInputLength: 3 });
  expect(validateRollRequest(request)).toBe(request);
  expect(request.formulas[0].formula).toBe('1d6');
});
