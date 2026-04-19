import { dom } from './dom.js';
import { normalizeRollMode } from './parser.js';
import { state } from './state.js';

function syncRollModeControls(mode) {
  if (dom.advantageCheck) dom.advantageCheck.checked = mode.advantageMode === 'advantage';
  if (dom.disadvantageCheck) dom.disadvantageCheck.checked = mode.advantageMode === 'disadvantage';
  if (dom.successCheck) dom.successCheck.checked = mode.successMode;
}

export function getCurrentRollMode() {
  return {
    advantageMode: state.advantageMode,
    successMode: state.successMode,
  };
}

export function setRollMode(nextMode) {
  const mode = normalizeRollMode(nextMode);

  state.advantageMode = mode.advantageMode;
  state.successMode = mode.successMode;
  syncRollModeControls(mode);

  return mode;
}

export function setRollModeFromToggle(toggleName, enabled) {
  if (!enabled) {
    return setRollMode({ advantageMode: 'none', successMode: false });
  }

  if (toggleName === 'advantage') {
    return setRollMode({ advantageMode: 'advantage', successMode: false });
  }

  if (toggleName === 'disadvantage') {
    return setRollMode({ advantageMode: 'disadvantage', successMode: false });
  }

  return setRollMode({ advantageMode: 'none', successMode: true });
}