import { APP_VERSION } from './constants.js';
import { dom, isStandaloneMode } from './dom.js';
import { t } from './i18n.js';
import { describeFormulaInput, parseFormulaInput } from './parser.js';
import { state } from './state.js';

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

export function addDieToFormula(sides) {
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

  const firstTokens = formulas[0].tokens;
  const diceTokens = firstTokens.filter(token => token.type === 'dice');
  const totalDiceCount = diceTokens.reduce((sum, token) => sum + Math.abs(token.count), 0);
  const hasModifiers = firstTokens.some(token => token.type === 'modifier');
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
