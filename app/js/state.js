/**
 * @typedef {Event & {
 *   prompt: () => Promise<void>,
 *   userChoice: Promise<{ outcome: 'accepted'|'dismissed', platform?: string }>
 * }} BeforeInstallPromptEvent
 */

/** @type {{
 *   selectedDice: Record<number, number>,
 *   diceOrder: number[],
 *   modifier: number,
 *   expertMode: boolean,
 *   advantageMode: 'none'|'advantage'|'disadvantage',
 *   successMode: boolean,
 *   lastResult: import('./parser.js').RenderedRoll[] | import('./parser.js').RenderedRoll[][] | null,
 *   isOffline: boolean,
 *   deferredInstallPrompt: BeforeInstallPromptEvent|null,
 *   isInstalled: boolean,
 *   history: Array<{formula: string, total: string|number, breakdown: string, timestamp: number, mode?: { advantageMode: 'none'|'advantage'|'disadvantage', successMode: boolean }}>,
 *   favorites: Array<{ id: string, name: string, collapsed: boolean, favorites: Array<{ id: string, formula: string, label: string, timestamp: number, successMode: boolean }> }>,
 * }} */
export const state = {
  selectedDice: {},
  diceOrder: [],
  modifier: 0,
  expertMode: false,
  advantageMode: 'none',
  successMode: false,
  lastResult: null,
  isOffline: navigator.onLine === false,
  deferredInstallPrompt: null,
  isInstalled: false,
  history: [],
  favorites: [],
};
