import { DICE_SIDES } from './constants.js';
import { renderDicePalette } from './dice-palette.js';
import { dom } from './dom.js';
import { addFavoriteFormula, loadFavorites, moveFavoriteFormula, removeFavoriteFormula, renderFavorites } from './favorites.js';
import { loadHistory, renderHistory, saveHistory } from './history.js';
import { applyTranslations, getLang, loadExpertMode, loadLanguage, setLang, t } from './i18n.js';
import { setRollMode, setRollModeFromToggle } from './roll-mode.js';
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

/** @type {{ formula: string, successMode: boolean, mode: 'native'|'pointer', pointerId?: number }|null} */
let draggedFavorite = null;
let completedRollSequence = 0;

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

function focusFormulaContainer() {
  if (!dom.formulaInputWrap) return;

  dom.formulaInputWrap.focus({ preventScroll: true });
  dom.formulaInputWrap.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

function focusFavoriteAction(formula, successMode, action) {
  if (!dom.favoritesList || !window.CSS || typeof window.CSS.escape !== 'function') return;

  const selector = `.favorite-entry[data-formula="${window.CSS.escape(formula)}"][data-success-mode="${successMode ? 'true' : 'false'}"] button[data-action="${action}"]`;
  const button = dom.favoritesList.querySelector(selector);
  if (button instanceof HTMLButtonElement) {
    button.focus({ preventScroll: true });
  }
}

function clearFavoriteDropIndicators() {
  if (!dom.favoritesList) return;

  dom.favoritesList.querySelectorAll('.favorite-entry.is-dragging, .favorite-entry.is-drop-target-before, .favorite-entry.is-drop-target-after')
    .forEach(entry => {
      entry.classList.remove('is-dragging', 'is-drop-target-before', 'is-drop-target-after');
    });
}

function getFavoriteInsertIndex(entry, clientY) {
  const targetIndex = Number.parseInt(entry.dataset.index || '', 10);
  if (Number.isNaN(targetIndex)) return null;

  const rect = entry.getBoundingClientRect();
  const insertAfter = clientY > rect.top + rect.height / 2;
  entry.classList.toggle('is-drop-target-before', !insertAfter);
  entry.classList.toggle('is-drop-target-after', insertAfter);
  return targetIndex + (insertAfter ? 1 : 0);
}

function getFavoriteInsertIndexFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  const favoriteEntry = target instanceof HTMLElement ? target.closest('.favorite-entry') : null;
  if (!(favoriteEntry instanceof HTMLElement)) return null;

  clearFavoriteDropIndicators();
  return getFavoriteInsertIndex(favoriteEntry, clientY);
}

function finalizeFavoriteDrop(insertIndex) {
  if (!draggedFavorite || insertIndex === null) {
    clearFavoriteDropIndicators();
    draggedFavorite = null;
    return;
  }

  if (moveFavoriteFormula(draggedFavorite.formula, insertIndex, { successMode: draggedFavorite.successMode })) {
    const { formula, successMode } = draggedFavorite;
    renderFavorites();
    focusFavoriteAction(formula, successMode, 'drag');
  }

  clearFavoriteDropIndicators();
  draggedFavorite = null;
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
      const target = event.target instanceof HTMLElement ? event.target.closest('.expert-btn') : null;
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
    const target = event.target instanceof HTMLElement ? event.target : null;
    const favoriteBtn = target ? target.closest('.favorite-btn') : null;
    if (favoriteBtn instanceof HTMLButtonElement) {
      event.stopPropagation();
      const formula = favoriteBtn.dataset.formula || '';
      const successMode = favoriteBtn.dataset.successMode === 'true';
      if (!formula) return;

      if (favoriteBtn.getAttribute('aria-pressed') === 'true') {
        removeFavoriteFormula(formula, { successMode });
      } else {
        addFavoriteFormula(formula, { successMode });
      }

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

  if (dom.favoritesList) {
    dom.favoritesList.addEventListener('click', event => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const favoriteEntry = target ? target.closest('.favorite-entry') : null;
      if (!(favoriteEntry instanceof HTMLElement)) return;

      const formula = favoriteEntry.dataset.formula || '';
      const successMode = favoriteEntry.dataset.successMode === 'true';
      if (!formula) return;

      const action = target && target.closest('button') ? target.closest('button').dataset.action : 'load';
      if (action === 'remove') {
        removeFavoriteFormula(formula, { successMode });
        renderFavorites();
        renderHistory();
        return;
      }

      if (action === 'drag') {
        return;
      }

      resetFormulaBuilderState();
      dom.formulaInput.value = formula;
      setRollMode({ advantageMode: 'none', successMode });
      updateFormulaPreview();
      focusFormulaContainer();
    });

    dom.favoritesList.addEventListener('dragstart', event => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const dragHandle = target ? target.closest('[data-action="drag"]') : null;
      const favoriteEntry = dragHandle ? dragHandle.closest('.favorite-entry') : null;
      if (!(dragHandle instanceof HTMLButtonElement) || !(favoriteEntry instanceof HTMLElement)) return;

      draggedFavorite = {
        formula: favoriteEntry.dataset.formula || '',
        successMode: favoriteEntry.dataset.successMode === 'true',
        mode: 'native',
      };

      if (!draggedFavorite.formula) {
        draggedFavorite = null;
        return;
      }

      favoriteEntry.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedFavorite.formula);
      }
    });

    dom.favoritesList.addEventListener('dragover', event => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const favoriteEntry = target ? target.closest('.favorite-entry') : null;
      if (!draggedFavorite || !(favoriteEntry instanceof HTMLElement)) return;

      event.preventDefault();
      clearFavoriteDropIndicators();
      getFavoriteInsertIndex(favoriteEntry, event.clientY);
    });

    dom.favoritesList.addEventListener('drop', event => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const favoriteEntry = target ? target.closest('.favorite-entry') : null;
      if (!draggedFavorite || !(favoriteEntry instanceof HTMLElement)) return;

      event.preventDefault();
      finalizeFavoriteDrop(getFavoriteInsertIndex(favoriteEntry, event.clientY));
    });

    dom.favoritesList.addEventListener('dragend', () => {
      clearFavoriteDropIndicators();
      draggedFavorite = null;
    });

    dom.favoritesList.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse') return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      const dragHandle = target ? target.closest('[data-action="drag"]') : null;
      const favoriteEntry = dragHandle ? dragHandle.closest('.favorite-entry') : null;
      if (!(dragHandle instanceof HTMLButtonElement) || !(favoriteEntry instanceof HTMLElement)) return;

      const formula = favoriteEntry.dataset.formula || '';
      if (!formula) return;

      event.preventDefault();
      draggedFavorite = {
        formula,
        successMode: favoriteEntry.dataset.successMode === 'true',
        mode: 'pointer',
        pointerId: event.pointerId,
      };
      favoriteEntry.classList.add('is-dragging');
      dragHandle.setPointerCapture(event.pointerId);
    });

    dom.favoritesList.addEventListener('pointermove', event => {
      if (!draggedFavorite || draggedFavorite.mode !== 'pointer' || draggedFavorite.pointerId !== event.pointerId) return;

      event.preventDefault();
      getFavoriteInsertIndexFromPoint(event.clientX, event.clientY);
    });

    dom.favoritesList.addEventListener('pointerup', event => {
      if (!draggedFavorite || draggedFavorite.mode !== 'pointer' || draggedFavorite.pointerId !== event.pointerId) return;

      event.preventDefault();
      finalizeFavoriteDrop(getFavoriteInsertIndexFromPoint(event.clientX, event.clientY));
    });

    dom.favoritesList.addEventListener('pointercancel', event => {
      if (!draggedFavorite || draggedFavorite.mode !== 'pointer' || draggedFavorite.pointerId !== event.pointerId) return;

      clearFavoriteDropIndicators();
      draggedFavorite = null;
    });
  }

  updateFormulaPreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
