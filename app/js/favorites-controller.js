import { dom } from './dom.js';
import { moveFavoriteFormula, removeFavoriteFormula, renderFavorites } from './favorites.js';
import { renderHistory } from './history.js';
import { setRollMode } from './roll-mode.js';
import { resetFormulaBuilderState, updateFormulaPreview } from './ui.js';

/** @typedef {{ formula: string, successMode: boolean, mode: 'native'|'pointer', pointerId?: number }} DraggedFavorite */

/** @type {DraggedFavorite|null} */
let draggedFavorite = null;

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

/**
 * @param {HTMLElement} entry
 * @param {number} clientY
 * @returns {number|null}
 */
function getFavoriteInsertIndex(entry, clientY) {
  const targetIndex = Number.parseInt(entry.dataset.index || '', 10);
  if (Number.isNaN(targetIndex)) return null;

  const rect = entry.getBoundingClientRect();
  const insertAfter = clientY > rect.top + rect.height / 2;
  entry.classList.toggle('is-drop-target-before', !insertAfter);
  entry.classList.toggle('is-drop-target-after', insertAfter);
  return targetIndex + (insertAfter ? 1 : 0);
}

/**
 * @param {number} clientX
 * @param {number} clientY
 * @returns {number|null}
 */
function getFavoriteInsertIndexFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  const favoriteEntry = target instanceof HTMLElement ? target.closest('.favorite-entry') : null;
  if (!(favoriteEntry instanceof HTMLElement)) return null;

  clearFavoriteDropIndicators();
  return getFavoriteInsertIndex(favoriteEntry, clientY);
}

/**
 * @param {number|null} insertIndex
 */
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

function loadFavoriteFormula(formula, successMode) {
  resetFormulaBuilderState();
  dom.formulaInput.value = formula;
  setRollMode({ advantageMode: 'none', successMode });
  updateFormulaPreview();
  focusFormulaContainer();
}

export function setupFavoritesInteractions() {
  if (!dom.favoritesList) return;

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

    loadFavoriteFormula(formula, successMode);
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