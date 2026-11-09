import { beforeEach, expect, test } from 'vitest';
import { mountApp } from './support/app.js';

let app: Awaited<ReturnType<typeof mountApp>>;
beforeEach(async () => { app = await mountApp(); });

const formula = () => app.element<HTMLInputElement>('#formula-input').value;
const rollButton = () => app.element<HTMLButtonElement>('#roll-btn');
const die = (sides: number) => app.element<HTMLButtonElement>(`.die-btn[data-sides="${sides}"]`);

test.each([
  { dice: [6, 6], expected: '2d6' },
  { dice: [20, 4], expected: '1d20 + 1d4' },
  { dice: [8], expected: '1d8' },
  { dice: [12], expected: '1d12' },
])('dice events update formula, counters, selection and preview: $dice', ({ dice, expected }) => {
  dice.forEach(sides => die(sides).click());
  expect(formula()).toBe(expected);
  for (const sides of new Set(dice)) {
    expect(die(sides).classList.contains('is-selected')).toBe(true);
    expect(die(sides).querySelector('.die-counter')?.textContent).toBe(String(dice.filter(value => value === sides).length));
  }
  expect(rollButton().disabled).toBe(false);
  expect(app.element('#formula-preview').classList.contains('is-valid')).toBe(true);
  expect(app.fetch).not.toHaveBeenCalled();
});

test('modifier button events rebuild the formula in both directions', () => {
  die(6).click();
  app.element('#modifier-inc').click();
  expect(formula()).toBe('1d6 + 1');
  app.element('#modifier-dec').click();
  app.element('#modifier-dec').click();
  expect(formula()).toBe('1d6 - 1');
  expect(app.element<HTMLInputElement>('#modifier-input').value).toBe('-1');
});

test('modifier input event updates the formula', () => {
  die(20).click();
  app.input('#modifier-input', '-3');
  expect(formula()).toBe('1d20 - 3');
});

test('manual formula input resets the modifier and selected dice', () => {
  die(8).click();
  app.element('#modifier-inc').click();
  expect(app.element<HTMLInputElement>('#modifier-input').value).toBe('1');
  app.input('#formula-input', '2d6 + 4');
  expect(formula()).toBe('2d6 + 4');
  expect(app.element<HTMLInputElement>('#modifier-input').value).toBe('0');
  expect(die(8).querySelector('.die-counter')?.textContent).toBe('0');
  expect(die(8).classList.contains('is-selected')).toBe(false);
});

test.each(['1d20', '3d8 + 1d4 + 5', '1d20 + 4;1d8 + 2', '1d20 - 2', '  1d6  '])('valid input updates preview and roll availability: %s', input => {
  app.input('#formula-input', input);
  expect(rollButton().disabled).toBe(false);
  expect(app.element('#formula-preview').classList.contains('is-valid')).toBe(true);
  expect(app.text('#formula-preview')).toContain('✓');
  expect(app.fetch).not.toHaveBeenCalled();
});

test.each(['5', 'abc', '1d20x3'])('invalid input disables rolling: %s', input => {
  app.input('#formula-input', input);
  expect(rollButton().disabled).toBe(true);
  expect(app.element('#formula-preview').classList.contains('is-invalid')).toBe(true);
  expect(app.text('#formula-preview')).not.toContain('✓');
  expect(app.text('#formula-preview')).toContain('Formula not recognised');
  expect(app.fetch).not.toHaveBeenCalled();
});

test('empty input resets the preview', () => {
  app.input('#formula-input', '2d6');
  app.input('#formula-input', '');
  expect(app.element('#formula-preview').className).toBe('formula-preview');
  expect(rollButton().disabled).toBe(true);
});

test('clear event resets the formula, all counters, modifier and error', async () => {
  die(6).click(); die(6).click(); die(8).click();
  app.element('#modifier-inc').click();
  const { rollFormulaInput } = await import('../../app/js/roll-service.js');
  expect(await rollFormulaInput('invalid')).toBe(false);
  expect(app.element('#error-banner').hidden).toBe(false);
  app.element('#clear-btn').click();
  expect(formula()).toBe('');
  expect(rollButton().disabled).toBe(true);
  expect(app.element<HTMLInputElement>('#modifier-input').value).toBe('0');
  for (const sides of [6, 8]) {
    expect(die(sides).querySelector('.die-counter')?.textContent).toBe('0');
    expect(die(sides).classList.contains('is-selected')).toBe(false);
  }
  expect(app.element('#error-banner').hidden).toBe(true);
  expect(app.element('#formula-preview').className).toBe('formula-preview');
});

test.each([
  ['advantage', 'disadvantage'], ['disadvantage', 'advantage'],
  ['advantage', 'success'], ['success', 'advantage'],
  ['disadvantage', 'success'], ['success', 'disadvantage'],
] as const)('mode events switch exclusively from %s to %s', (first, second) => {
  app.toggle(first); app.toggle(second);
  expect(app.element<HTMLInputElement>(`#${first}-check`).checked).toBe(false);
  expect(app.element<HTMLInputElement>(`#${second}-check`).checked).toBe(true);
});

test.each([
  ['success', '3d6', 'only the first dice group'],
  ['advantage', '2d6', 'first die only'],
  ['advantage', '1d20;1d8', 'first formula only'],
] as const)('mode %s refreshes its warning for %s', (mode, formula, warning) => {
  app.input('#formula-input', formula);
  app.toggle(mode);
  expect(app.text('#formula-preview')).toContain('⚠');
  expect(app.text('#formula-preview')).toContain(warning);
  expect(rollButton().disabled).toBe(false);
});

test('unchecking advantage refreshes the preview and removes its warning', () => {
  app.input('#formula-input', '2d6');
  app.toggle('advantage');
  expect(app.text('#formula-preview')).toContain('⚠');
  app.toggle('advantage');
  expect(app.text('#formula-preview')).not.toContain('⚠');
  expect(app.element<HTMLInputElement>('#advantage-check').checked).toBe(false);
});
