import { DICE_SIDES } from './constants.js';
import { renderDicePalette } from './dice-palette.js';
import { dom } from './dom.js';
import { setupFavoritesInteractions } from './favorites-controller.js';
import { setupFavoritesModal } from './favorites-modal.js';
import { loadFavorites, promptForFavoriteSave, renderFavorites } from './favorites.js';
import { loadHistory, renderHistory, saveHistory } from './history.js';
import { applyTranslations, getLang, loadExpertMode, loadLanguage, setLang, t } from './i18n.js';
import { setRollModeFromToggle } from './roll-mode.js';
import { rollFormulaInput } from './roll-service.js';
import { renderResult } from './render.js';
import { state } from './state.js';
import {
  addDieToFormula,
  deleteAtCursor,
  insertAtCursor,
  registerServiceWorker,
  resetFormulaBuilderState,
  setModifier,
  setupInstallPrompt,
  showError,
  syncFormulaSelection,
  toggleExpertMode,
  updateFormulaPreview,
  updateModifierUI,
  updateOfflineUI,
} from './ui.js';

let completedRollSequence = 0;

function getEventTargetElement(event) {
  if (event.target instanceof Element) {
    return event.target;
  }

  if (event.target instanceof Node) {
    return event.target.parentElement;
  }

  return null;
}

function markRollCompleted() {
  completedRollSequence += 1;
  document.body.dataset.rollSequence = String(completedRollSequence);
}

function toggleLanguage() {
  setLang(getLang() === 'en' ? 'fr' : 'en');
  applyTranslations();
  updateModifierUI();
  if (dom.expertCheck) dom.expertCheck.setAttribute('aria-label', t('expertModeLabel'));
  updateFormulaPreview();

  if (state.lastResult && !dom.resultSection.hidden) {
    renderResult(state.lastResult);
  }

  renderHistory();
  renderFavorites();
}

async function doRoll(options = {}) {
  const completed = await rollFormulaInput(dom.formulaInput.value, options);
  if (completed) {
    markRollCompleted();
  }
}

function init() {
  document.body.dataset.rollSequence = String(completedRollSequence);
  renderDicePalette();
  loadLanguage();
  state.expertMode = loadExpertMode();
  applyTranslations();
  updateModifierUI();
  toggleExpertMode(state.expertMode);
  updateOfflineUI();
  setupInstallPrompt();
  setupFavoritesModal();
  registerServiceWorker();
  loadHistory();
  loadFavorites();

  window.addEventListener('online', updateOfflineUI);
  window.addEventListener('offline', updateOfflineUI);

  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) langToggle.addEventListener('click', toggleLanguage);

  if (dom.expertCheck) {
    dom.expertCheck.addEventListener('change', () => {
      toggleExpertMode(dom.expertCheck.checked);
    });
  }

  if (dom.advantageCheck) {
    dom.advantageCheck.addEventListener('change', () => {
      setRollModeFromToggle('advantage', dom.advantageCheck.checked);
      updateFormulaPreview();
    });
  }

  if (dom.disadvantageCheck) {
    dom.disadvantageCheck.addEventListener('change', () => {
      setRollModeFromToggle('disadvantage', dom.disadvantageCheck.checked);
      updateFormulaPreview();
    });
  }

  if (dom.successCheck) {
    dom.successCheck.addEventListener('change', () => {
      setRollModeFromToggle('success', dom.successCheck.checked);
      updateFormulaPreview();
    });
  }

  document.querySelectorAll('.die-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sides = Number(btn.dataset.sides);
      if (!DICE_SIDES.includes(sides)) return;
      addDieToFormula(sides);
    });
  });

  if (dom.modifierIncBtn) {
    dom.modifierIncBtn.addEventListener('click', () => {
      setModifier(state.modifier + 1);
    });
  }

  if (dom.modifierDecBtn) {
    dom.modifierDecBtn.addEventListener('click', () => {
      setModifier(state.modifier - 1);
    });
  }

  if (dom.modifierInput) {
    dom.modifierInput.addEventListener('input', () => {
      const rawValue = dom.modifierInput.value.trim();
      if (rawValue === '' || rawValue === '-') return;

      const nextValue = parseInt(rawValue, 10);
      if (!Number.isNaN(nextValue)) setModifier(nextValue);
    });

    dom.modifierInput.addEventListener('blur', () => {
      const rawValue = dom.modifierInput.value.trim();
      const nextValue = parseInt(rawValue, 10);
      setModifier(Number.isNaN(nextValue) ? 0 : nextValue);
    });
  }

  dom.formulaInput.addEventListener('input', () => {
    syncFormulaSelection();
    resetFormulaBuilderState();
    updateFormulaPreview();
  });

  ['click', 'keyup', 'select', 'focus', 'blur'].forEach(eventName => {
    dom.formulaInput.addEventListener(eventName, syncFormulaSelection);
  });

  dom.formulaInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !dom.rollBtn.disabled) doRoll();
  });

  dom.clearBtn.addEventListener('click', () => {
    dom.formulaInput.value = '';
    resetFormulaBuilderState();
    updateFormulaPreview();
    dom.resultSection.hidden = true;
    showError(null);
    dom.formulaInput.blur();
    dom.clearBtn.blur();
  });

  dom.rollBtn.addEventListener('click', doRoll);

  if (dom.expertPad) {
    dom.expertPad.addEventListener('click', event => {
      const target = getEventTargetElement(event)?.closest('.expert-btn');
      if (!(target instanceof HTMLButtonElement)) return;

      const expertDie = Number(target.dataset.insertDie);
      if (DICE_SIDES.includes(expertDie)) {
        addDieToFormula(expertDie);
        return;
      }

      if (target.dataset.action === 'backspace') {
        deleteAtCursor();
        return;
      }

      const insertValue = target.dataset.insert;
      if (insertValue) {
        insertAtCursor(insertValue);
      }
    });
  }

  dom.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    saveHistory();
    renderHistory();
  });

  dom.historyList.addEventListener('click', async event => {
    const target = getEventTargetElement(event);
    const favoriteBtn = target ? target.closest('.favorite-btn') : null;
    if (favoriteBtn instanceof HTMLButtonElement) {
      event.stopPropagation();
      const formula = favoriteBtn.dataset.formula || '';
      const successMode = favoriteBtn.dataset.successMode === 'true';
      if (!formula) return;

      const savedFavorite = await promptForFavoriteSave(formula, { successMode });
      if (!savedFavorite) return;

      renderFavorites();
      renderHistory();
      return;
    }

    const entryEl = target ? target.closest('.history-entry') : null;
    if (!(entryEl instanceof HTMLElement)) return;

    const index = parseInt(entryEl.dataset.index || '', 10);
    if (Number.isNaN(index) || !state.history[index]) return;

    const entry = state.history[index];
    resetFormulaBuilderState();
    dom.formulaInput.value = entry.formula;
    updateFormulaPreview();
    await doRoll({ mode: entry.mode });
  });

  setupFavoritesInteractions();

  updateFormulaPreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
