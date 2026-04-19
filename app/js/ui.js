import { APP_VERSION, EXPERT_MODE_KEY } from './constants.js';
import { dom, isStandaloneMode } from './dom.js';
import { t } from './i18n.js';
import { analyzeFormulas, describeFormulaInput, parseFormulaInput } from './parser.js';
import { state } from './state.js';

/**
 * @param {Array<any>} formulas
 * @param {{ advantageMode?: 'none'|'advantage'|'disadvantage', successMode?: boolean }} [mode]
 * @returns {string[]}
 */
export function getFormulaCompatibilityIssues(formulas, mode = {}) {
  const analysis = analyzeFormulas(formulas);
  const advantageMode = mode.advantageMode ?? state.advantageMode;
  const successMode = mode.successMode ?? state.successMode;
  const issues = [];

  if (analysis.firstHasInlineAdvanced && (advantageMode !== 'none' || successMode)) {
    issues.push(t('inlineAdvancedToggleConflict'));
  }

  return issues;
}

export function clampModifier(value) {
  return Math.max(-99, Math.min(99, value));
}

export function updateModifierUI() {
  if (!dom.modifierInput) return;

  dom.modifierInput.value = String(state.modifier);
  dom.modifierInput.setAttribute('aria-label', t('modifierValue'));

  if (dom.modifierIncBtn) dom.modifierIncBtn.setAttribute('aria-label', t('modifierIncrease'));
  if (dom.modifierDecBtn) dom.modifierDecBtn.setAttribute('aria-label', t('modifierDecrease'));
}

export function resetFormulaBuilderState() {
  state.selectedDice = {};
  state.diceOrder = [];
  state.modifier = 0;
  updateDiceButtons();
  updateModifierUI();
}

export function setModifier(value) {
  state.modifier = clampModifier(Number.isFinite(value) ? value : 0);
  updateModifierUI();
  rebuildFormulaFromDice();
}

export function toggleExpertMode(enabled) {
  state.expertMode = Boolean(enabled);

  try {
    localStorage.setItem(EXPERT_MODE_KEY, state.expertMode ? 'true' : 'false');
  } catch {}

  document.body.classList.toggle('is-expert', state.expertMode);

  if (dom.expertCheck) {
    dom.expertCheck.checked = state.expertMode;
    dom.expertCheck.setAttribute('aria-label', t('expertModeLabel'));
  }

  if (dom.expertPad) {
    dom.expertPad.hidden = !state.expertMode;
  }

  resetFormulaBuilderState();
  updateFormulaPreview();
}

export function insertAtCursor(text) {
  const input = dom.formulaInput;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  const nextValue = input.value.slice(0, start) + text + input.value.slice(end);

  input.value = nextValue;
  input.focus({ preventScroll: true });
  const nextCursor = start + text.length;
  input.setSelectionRange(nextCursor, nextCursor);
  updateFormulaPreview();
}

export function deleteAtCursor() {
  const input = dom.formulaInput;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;

  if (start !== end) {
    input.value = input.value.slice(0, start) + input.value.slice(end);
    input.focus({ preventScroll: true });
    input.setSelectionRange(start, start);
    updateFormulaPreview();
    return;
  }

  if (start === 0) return;

  input.value = input.value.slice(0, start - 1) + input.value.slice(start);
  input.focus({ preventScroll: true });
  input.setSelectionRange(start - 1, start - 1);
  updateFormulaPreview();
}

export function addDieToFormula(sides) {
  if (state.expertMode) {
    insertAtCursor(`d${sides}`);
    return;
  }

  state.selectedDice[sides] = (state.selectedDice[sides] || 0) + 1;
  if (!state.diceOrder.includes(sides)) {
    state.diceOrder.push(sides);
  }
  rebuildFormulaFromDice();
  updateDiceButtons();
}

export function rebuildFormulaFromDice() {
  const diceParts = state.diceOrder
    .filter(sides => (state.selectedDice[sides] || 0) > 0)
    .map(sides => `${state.selectedDice[sides]}d${sides}`);

  let formula = diceParts.join(' + ');

  if (state.modifier !== 0) {
    const modifierValue = String(Math.abs(state.modifier));
    if (formula) {
      formula += state.modifier > 0 ? ` + ${modifierValue}` : ` - ${modifierValue}`;
    } else {
      formula = state.modifier > 0 ? modifierValue : `-${modifierValue}`;
    }
  }

  dom.formulaInput.value = formula;
  updateFormulaPreview();
}

export function updateDiceButtons() {
  document.querySelectorAll('.die-btn').forEach(btn => {
    const sides = Number(btn.dataset.sides);
    const count = state.selectedDice[sides] || 0;
    const counter = btn.querySelector('.die-counter');
    if (counter) counter.textContent = String(count);
    btn.classList.toggle('is-selected', count > 0);
  });
}

export function updateFormulaPreview() {
  const raw = dom.formulaInput.value.trim();
  const formulas = parseFormulaInput(raw);

  if (!raw) {
    dom.formulaPreview.textContent = t('formulaPreviewEmpty');
    dom.formulaPreview.className = 'formula-preview';
    dom.rollBtn.disabled = true;
    return;
  }

  if (formulas.length === 0) {
    dom.formulaPreview.textContent = t('formulaInvalid');
    dom.formulaPreview.className = 'formula-preview is-invalid';
    dom.rollBtn.disabled = true;
    return;
  }

  const analysis = analyzeFormulas(formulas);
  const compatibilityIssues = getFormulaCompatibilityIssues(formulas);

  if (compatibilityIssues.length > 0) {
    dom.formulaPreview.textContent = '⚠  ' + describeFormulaInput(formulas) + '  ' + compatibilityIssues.join('  ');
    dom.formulaPreview.className = 'formula-preview is-invalid';
    dom.rollBtn.disabled = true;
    return;
  }

  const totalDiceCount = analysis.totalDiceCount;
  const hasModifiers = analysis.hasModifiers;
  const advWarning = (state.advantageMode !== 'none' && totalDiceCount > 1)
    ? '  ⚠ ' + t('advantageFirstOnly')
    : '';
  const successWarnings = [];

  if (state.successMode) {
    successWarnings.push(`⚠ ${t('successFirstGroupOnly')}`);
  }
  if (state.successMode && hasModifiers) {
    successWarnings.push(`➕ ${t('successBonusAdded')}`);
  }
  if (formulas.length > 1 && (state.advantageMode !== 'none' || state.successMode)) {
    successWarnings.push(`⚠ ${t('multiRollModeFirstOnly')}`);
  }

  const successWarning = successWarnings.length > 0 ? `  ${successWarnings.join('  ')}` : '';

  dom.formulaPreview.textContent = '✓  ' + describeFormulaInput(formulas) + advWarning + successWarning;
  dom.formulaPreview.className = 'formula-preview is-valid';
  dom.rollBtn.disabled = false;
}

/**
 * @param {string|null} message
 */
export function showError(message) {
  if (!message) {
    dom.errorBanner.hidden = true;
    dom.errorText.textContent = '';
    return;
  }

  dom.errorText.textContent = message;
  dom.errorBanner.hidden = false;
}

export function updateOfflineUI() {
  state.isOffline = navigator.onLine === false;
  if (dom.offlineBadge) {
    dom.offlineBadge.hidden = !state.isOffline;
  }
}

export function updateInstallUI() {
  state.isInstalled = isStandaloneMode();
  if (!dom.installBtn) return;

  dom.installBtn.hidden = state.isInstalled || !state.deferredInstallPrompt;
}

export async function triggerInstallPrompt() {
  if (!state.deferredInstallPrompt) return;

  const installPrompt = state.deferredInstallPrompt;
  state.deferredInstallPrompt = null;
  updateInstallUI();

  try {
    await installPrompt.prompt();
    await installPrompt.userChoice;
  } catch {}

  updateInstallUI();
}

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    updateInstallUI();
  });

  window.addEventListener('appinstalled', () => {
    state.deferredInstallPrompt = null;
    state.isInstalled = true;
    updateInstallUI();
  });

  if (dom.installBtn) {
    dom.installBtn.addEventListener('click', triggerInstallPrompt);
  }

  updateInstallUI();
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (navigator.webdriver) return;

  window.addEventListener('load', () => {
    let hasRefreshedForNewWorker = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasRefreshedForNewWorker) return;
      hasRefreshedForNewWorker = true;
      window.location.reload();
    });

    navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`, { updateViaCache: 'none' })
      .then(registration => {
        registration.update().catch(() => {});

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {});
  }, { once: true });
}
