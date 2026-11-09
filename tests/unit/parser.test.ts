import { describe, test, expect } from 'vitest';
import * as core from '../../packages/core/src/parser.js';
import * as web from '../../app/js/parser.js';

// Independent expectations exercise both shipped implementations, not just parity.
for (const [name, parser] of Object.entries({ core, web })) {
  describe(`${name} parser`, () => {
    test('parses the full request, signed dice, modifiers and both suffix orders', () => {
      expect(parser.parseRollRequest(' 2X d20 + 6 ; -2D6>=4r1-3 ')).toEqual({
        repeatCount: 2,
        formulas: [
          { formula: 'd20 + 6', tokens: [
            { type: 'dice', count: 1, sides: 20, raw: 'd20' },
            { type: 'modifier', value: 6, raw: '+6' },
          ] },
          { formula: '-2D6>=4r1-3', tokens: [
            { type: 'dice', count: -2, sides: 6, raw: '-2D6>=4r1', successThreshold: 4, rerollAtOrBelow: 1 },
            { type: 'modifier', value: -3, raw: '-3' },
          ] },
        ],
      });
      expect(parser.parseFormula('1d6R6>=1')).toEqual([
        { type: 'dice', count: 1, sides: 6, raw: '1d6R6>=1', rerollAtOrBelow: 6, successThreshold: 1 },
      ]);
      expect(parser.parseFormula('1d1')).toEqual([{ type: 'dice', count: 1, sides: 1, raw: '1d1' }]);
      expect(parser.parseRollRequest('1d6')?.repeatCount).toBe(1);
      expect(parser.parseRollRequest('2x1d6')?.repeatCount).toBe(2);
    });

    test.each(['', ' ', '4', '0d6', '1d0', 'foo1d6', '1d6foo', '1d6*2', '1d6R0', '1d6R7',
      '1d6>=0', '1d6R1R2', '1d6>=2>=3', ';1d6', '1d6;', '1d6;;1d4', '0x1d6', '2x'])('rejects invalid input %j', input => {
      expect(parser.parseRollRequest(input)).toBeNull();
    });

    test('preserves multi-digit counts, suffixes and modifiers', () => {
      expect(parser.parseRollRequest('12x 2d20R10>=12+30')).toEqual({
        repeatCount: 12,
        formulas: [{ formula: '2d20R10>=12+30', tokens: [
          { type: 'dice', count: 2, sides: 20, raw: '2d20R10>=12', rerollAtOrBelow: 10, successThreshold: 12 },
          { type: 'modifier', value: 30, raw: '+30' },
        ] }],
      });
    });

    test.each(['1d6;nope', '1d6+2x1d4', '2x1d6\n+2'])('rejects partially valid requests %j', input => {
      expect(parser.parseRollRequest(input)).toBeNull();
    });

    test('defensively rejects non-string runtime input', () => {
      expect(parser.parseRollRequest(null as never)).toBeNull();
      expect(parser.parseRollRequest(6 as never)).toBeNull();
    });

    test('regex cursors do not leak across calls, including after an invalid suffix', () => {
      expect(parser.parseFormula('1d6R1R2')).toEqual([]);
      for (let i = 0; i < 2; i++) {
        expect(parser.parseFormula('1d6R2')[0]).toEqual({ type: 'dice', count: 1, sides: 6, raw: '1d6R2', rerollAtOrBelow: 2 });
      }
    });

    test.each([
      ['+1d6+2-3-2d4', '1d6  + 2  − 3  − 2d4'],
      ['2+1d6', '2  + 1d6'],
      ['+2+1d6', '+ 2  + 1d6'],
      ['-2+1d6', '− 2  + 1d6'],
      ['2x1d6;1d4', '2x 1d6  ;  1d4'],
      ['1x1d6', '1d6'],
    ])('describes %s', (input, expected) => {
      expect(parser.describeRollRequest(parser.parseRollRequest(input)!)).toBe(expected);
    });

    test('analyzes first formula separately from advanced flags across the request', () => {
      const formulas = parser.parseFormulaInput('2d6-1d4+3;1d8R2>=5');
      expect(parser.analyzeFormulas(formulas)).toEqual({
        firstTokens: formulas[0].tokens,
        diceTokens: formulas[0].tokens.slice(0, 2), totalDiceCount: 3,
        hasModifiers: true, hasInlineAdvanced: true, hasInlineThreshold: true, hasInlineReroll: true,
        firstHasInlineAdvanced: false, firstHasInlineThreshold: false,
      });
      expect(parser.analyzeFormulas([])).toEqual({
        firstTokens: [], diceTokens: [], totalDiceCount: 0, hasModifiers: false,
        hasInlineAdvanced: false, hasInlineThreshold: false, hasInlineReroll: false,
        firstHasInlineAdvanced: false, firstHasInlineThreshold: false,
      });
      expect(parser.analyzeFormulas(parser.parseFormulaInput('1d6>=4')).firstHasInlineThreshold).toBe(true);
      expect(parser.analyzeFormulas(parser.parseFormulaInput('1d6R1')).firstHasInlineAdvanced).toBe(true);
    });

    test.each([
      ['1d6', false, false, false],
      ['1d6>=4', true, true, false],
      ['1d6R1', true, false, true],
      ['1d6R1>=4', true, true, true],
    ])('analyzes independent advanced flags for %s', (input, advanced, threshold, reroll) => {
      const formulas = parser.parseFormulaInput(input);
      expect(parser.analyzeFormulas(formulas)).toEqual({
        firstTokens: formulas[0].tokens, diceTokens: formulas[0].tokens, totalDiceCount: 1,
        hasModifiers: false, hasInlineAdvanced: advanced, hasInlineThreshold: threshold,
        hasInlineReroll: reroll, firstHasInlineAdvanced: advanced, firstHasInlineThreshold: threshold,
      });
    });

    test('normalizes valid, absent and invalid modes', () => {
      expect(parser.normalizeRollMode(undefined)).toEqual({ advantageMode: 'none', successMode: false });
      for (const advantageMode of ['advantage', 'disadvantage'] as const) {
        expect(parser.normalizeRollMode({ advantageMode })).toEqual({ advantageMode, successMode: false });
      }
      expect(parser.normalizeRollMode({ advantageMode: 'invalid' as never })).toEqual({ advantageMode: 'none', successMode: false });
      expect(parser.normalizeRollMode({ successMode: true })).toEqual({ advantageMode: 'none', successMode: true });
    });
  });
}

describe('web history normalization', () => {
  test('preserves valid persisted values including zero and formatted totals', () => {
    expect(web.normalizeHistoryEntry({ formula: '1d6', total: 0, breakdown: '1', timestamp: 0 })).toEqual({
      formula: '1d6', total: 0, breakdown: '1', timestamp: 0, mode: { advantageMode: 'none', successMode: false },
    });
    expect(web.normalizeHistoryEntry({ total: '2 | 4' }).total).toBe('2 | 4');
  });
  test('uses safe defaults for malformed persisted fields', () => {
    const before = Date.now();
    const entry = web.normalizeHistoryEntry({ formula: 4, total: {}, breakdown: false, timestamp: 'bad' } as never);
    expect(entry).toMatchObject({ formula: '', total: '', breakdown: '', mode: { advantageMode: 'none', successMode: false } });
    expect(entry.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp).toBeLessThanOrEqual(Date.now());
  });
  test('success mode overrides advantage in the web interface', () => {
    expect(web.normalizeRollMode({ advantageMode: 'advantage', successMode: true })).toEqual({ advantageMode: 'none', successMode: true });
  });
});
