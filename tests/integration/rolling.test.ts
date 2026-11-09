import { beforeEach, expect, test, vi } from 'vitest';
import { mountApp } from './support/app.js';

let app: Awaited<ReturnType<typeof mountApp>>;
beforeEach(async () => { app = await mountApp(); });

const totals = () => app.texts('#result-multi .result-total');
const ready = () => {
  expect(app.element<HTMLButtonElement>('#roll-btn').disabled).toBe(false);
  expect(app.element('#spinner-overlay').hidden).toBe(true);
  expect(app.element('#spinner-overlay').getAttribute('aria-hidden')).toBe('true');
};

test('roll events connect HTTP, engine, rendered results and persistent history in newest-first order', async () => {
  app.draws([{ sides: 6, values: [3] }, { sides: 6, values: [6] }]);
  app.input('#formula-input', '1d6 + 2');
  await app.roll();
  expect(app.text('#result-total')).toBe('5');
  expect(app.element('#result-section').hidden).toBe(false);
  expect(app.history()).toMatchObject([{ formula: '1d6 + 2', total: '5', mode: { advantageMode: 'none', successMode: false } }]);
  await app.roll();
  expect(app.text('#result-total')).toBe('8');
  expect(app.texts('.history-total')).toEqual(['8', '5']);
  expect(app.history().map(entry => entry.total)).toEqual(['8', '5']);
  expect(app.fetch).toHaveBeenCalledTimes(2);
  ready();
});

test.each([
  {
    formula: '3x 1d20 + 6',
    batches: [{ sides: 20, values: [10] }, { sides: 20, values: [4] }, { sides: 20, values: [18] }],
    expected: ['16', '10', '24'], historyTotal: '16 • 10 • 24', groups: 1,
  },
  {
    formula: '3x1d20+9;2d6+3',
    batches: [
      { sides: 20, values: [10] }, { sides: 6, values: [1, 2] },
      { sides: 20, values: [12] }, { sides: 6, values: [3, 4] },
      { sides: 20, values: [20] }, { sides: 6, values: [5, 6] },
    ], expected: ['19', '6', '21', '10', '29', '14'], historyTotal: '19 | 6 • 21 | 10 • 29 | 14', groups: 2,
  },
  {
    formula: '3x 1d20 + 6;1d10',
    batches: [
      { sides: 20, values: [10] }, { sides: 10, values: [4] },
      { sides: 20, values: [12] }, { sides: 10, values: [5] },
      { sides: 20, values: [20] }, { sides: 10, values: [1] },
    ], expected: ['16', '4', '18', '5', '26', '1'], historyTotal: '16 | 4 • 18 | 5 • 26 | 1', groups: 2,
  },
])('repeat orchestration renders and persists every group: $formula', async ({ formula, batches, expected, historyTotal, groups }) => {
  app.draws(batches);
  app.input('#formula-input', formula);
  await app.roll();
  expect(totals()).toEqual(expected);
  const repeats = app.window.document.querySelectorAll('.result-repeat-block');
  expect(repeats).toHaveLength(3);
  repeats.forEach(repeat => expect(repeat.querySelectorAll('.result-sub-block')).toHaveLength(groups));
  expect(app.history()).toMatchObject([{ formula, total: historyTotal }]);
  expect(app.history()).toHaveLength(1);
  expect(app.text('.history-formula')).toBe(formula);
  expect(app.fetch).toHaveBeenCalledTimes(batches.length);
  ready();
});

test('advantage is applied only to the first formula in every repetition', async () => {
  app.draws([
    { sides: 20, values: [4, 17] }, { sides: 8, values: [6] },
    { sides: 20, values: [12, 15] }, { sides: 8, values: [2] },
    { sides: 20, values: [11, 3] }, { sides: 8, values: [8] },
  ]);
  app.input('#formula-input', '3x 1d20;1d8');
  app.toggle('advantage');
  await app.roll();
  expect(totals()).toEqual(['17', '6', '15', '2', '11', '8']);
  expect(app.texts('#result-multi .is-kept')).toEqual(['17', '15', '11']);
  expect(app.texts('#result-multi .is-discarded')).toEqual(['4', '12', '3']);
  expect(app.history()[0]).toMatchObject({ total: '17 | 6 • 15 | 2 • 11 | 8', mode: { advantageMode: 'advantage', successMode: false } });
  expect(app.fetch).toHaveBeenCalledTimes(6);
});

test('advantage on semicolon-separated formulas does not affect the second result', async () => {
  app.draws([{ sides: 20, values: [4, 17] }, { sides: 8, values: [6] }]);
  app.input('#formula-input', '1d20;1d8');
  app.toggle('advantage');
  await app.roll();
  expect(totals()).toEqual(['17', '6']);
  expect(app.texts('#result-multi .is-kept')).toEqual(['17']);
  expect(app.texts('#result-multi .is-discarded')).toEqual(['4']);
  expect(app.fetch).toHaveBeenCalledTimes(2);
});

test.each(['4d6>=5', '3x 4d6>=5'])('advanced syntax with advantage is blocked by the preview and service: %s', async formula => {
  app.input('#formula-input', formula);
  app.toggle('advantage');
  expect(app.element<HTMLButtonElement>('#roll-btn').disabled).toBe(true);
  expect(app.element('#formula-preview').classList.contains('is-invalid')).toBe(true);
  expect(app.text('#formula-preview')).toContain('Advanced dice syntax');
  const { rollFormulaInput } = await import('../../app/js/roll-service.js');
  expect(await rollFormulaInput(formula)).toBe(false);
  expect(app.element('#error-banner').hidden).toBe(false);
  expect(app.fetch).not.toHaveBeenCalled();
  expect(app.history()).toEqual([]);
});

test('success mode renders additional dice groups as ignored without drawing them', async () => {
  app.draws([{ sides: 6, values: [4, 2] }, { sides: 6, values: [1, 3] }]);
  app.input('#formula-input', '2d6 + 1d8');
  app.toggle('success');
  await app.roll();
  expect(app.text('#result-total')).toBe('2');
  expect(app.window.document.querySelectorAll('.breakdown-group.is-ignored')).toHaveLength(1);
  expect(app.history()[0].breakdown).toContain('[ignored]');
  expect(app.history()[0].mode).toEqual({ advantageMode: 'none', successMode: true });
  expect(app.fetch).toHaveBeenCalledTimes(2);
});

test.each(['network', 'HTTP 503'])('source failure (%s) shows an error and restores controls without recording history', async failure => {
  Object.defineProperty(app.window.crypto, 'getRandomValues', { configurable: true, value: undefined });
  if (failure === 'network') app.fetch.mockRejectedValue(new Error('offline'));
  else app.fetch.mockResolvedValue(new Response('Unavailable', { status: 503 }));
  app.input('#formula-input', '1d6');
  await app.roll();
  expect(app.element('#error-banner').hidden).toBe(false);
  expect(app.text('#error-text')).toContain('Roll failed:');
  expect(app.element('#result-section').hidden).toBe(true);
  expect(app.history()).toEqual([]);
  expect(app.fetch).toHaveBeenCalledTimes(1);
  ready();
});

test('retry after failure clears the error, renders the result and records only the successful roll', async () => {
  Object.defineProperty(app.window.crypto, 'getRandomValues', { configurable: true, value: undefined });
  app.fetch.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new Response('4\n'));
  app.input('#formula-input', '1d6');
  await app.roll();
  expect(app.element('#error-banner').hidden).toBe(false);
  ready();
  await app.roll();
  expect(app.element('#error-banner').hidden).toBe(true);
  expect(app.text('#result-total')).toBe('4');
  expect(app.history()).toMatchObject([{ total: '4' }]);
  expect(app.history()).toHaveLength(1);
  expect(app.fetch).toHaveBeenCalledTimes(2);
  ready();
});

test('pending HTTP request disables rolling and exposes the spinner until completion', async () => {
  let release!: (response: Response) => void;
  app.fetch.mockReturnValue(new Promise<Response>(resolve => { release = resolve; }));
  app.input('#formula-input', '1d6');
  app.element<HTMLButtonElement>('#roll-btn').click();
  expect(app.element<HTMLButtonElement>('#roll-btn').disabled).toBe(true);
  expect(app.element('#spinner-overlay').hidden).toBe(false);
  expect(app.element('#spinner-overlay').hasAttribute('aria-hidden')).toBe(false);
  release(new Response('3\n'));
  await vi.waitFor(() => expect(app.window.document.body.dataset.rollSequence).toBe('1'));
  expect(app.text('#result-total')).toBe('3');
  expect(app.history()).toHaveLength(1);
  ready();
});
