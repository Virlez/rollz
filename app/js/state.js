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
 *   advantageMode: 'none'|'advantage'|'disadvantage',
 *   successMode: boolean,
 *   lastResult: Array<{ formula: string, result: any }> | null,
 *   isOffline: boolean,
 *   currentRollSource: 'randomorg'|'crypto',
 *   deferredInstallPrompt: BeforeInstallPromptEvent|null,
 *   isInstalled: boolean,
 *   history: Array<{formula: string, total: string|number, breakdown: string, timestamp: number, mode?: { advantageMode: 'none'|'advantage'|'disadvantage', successMode: boolean }}>,
 *   favorites: Array<{ formula: string, timestamp: number, successMode: boolean }>,
 * }} */
export const state = {
  selectedDice: {},
  diceOrder: [],
  modifier: 0,
  advantageMode: 'none',
  successMode: false,
  lastResult: null,
  isOffline: navigator.onLine === false,
  currentRollSource: 'randomorg',
  deferredInstallPrompt: null,
  isInstalled: false,
  history: [],
  favorites: [],
};
