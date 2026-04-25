import { dom } from './dom.js';
import {
  moveFavoriteById,
  promptCreateFavoriteCategory,
  promptDeleteFavoriteCategory,
  promptEditFavoriteLabel,
  promptRenameFavoriteCategory,
  removeFavoriteById,
  renderFavorites,
  toggleFavoriteCategoryCollapsed,
} from './favorites.js';
import { renderHistory } from './history.js';
import { setRollMode } from './roll-mode.js';
import { resetFormulaBuilderState, updateFormulaPreview } from './ui.js';

/** @typedef {{ favoriteId: string, mode: 'native'|'pointer', pointerId?: number }} DraggedFavorite */

/** @typedef {{ categoryId: string, insertIndex: number } | null} FavoriteDropLocation */

/** @type {DraggedFavorite|null} */
let draggedFavorite = null;

function focusFormulaContainer() {
  if (!dom.formulaInputWrap) return;

  dom.formulaInputWrap.focus({ preventScroll: true });
  dom.formulaInputWrap.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

function focusFavoriteAction(favoriteId, action) {
  if (!dom.favoritesList || !window.CSS || typeof window.CSS.escape !== 'function') return;

  const selector = `.favorite-entry[data-favorite-id="${window.CSS.escape(favoriteId)}"] button[data-action="${action}"]`;
  const button = dom.favoritesList.querySelector(selector);
  if (button instanceof HTMLButtonElement) {
    button.focus({ preventScroll: true });
  }
}

function clearFavoriteDropIndicators() {
  if (!dom.favoritesList) return;

  dom.favoritesList.querySelectorAll('.favorite-entry.is-dragging, .favorite-entry.is-drop-target-before, .favorite-entry.is-drop-target-after, .favorite-category-content.is-drop-target')
    .forEach(entry => {
      entry.classList.remove('is-dragging', 'is-drop-target-before', 'is-drop-target-after');
      entry.classList.remove('is-drop-target');
    });
}

/**
 * @param {HTMLElement} entry
 * @param {number} clientY
 * @returns {FavoriteDropLocation}
 */
function getFavoriteDropLocationFromEntry(entry, clientY) {
  const targetIndex = Number.parseInt(entry.dataset.categoryIndex || '', 10);
  if (Number.isNaN(targetIndex)) return null;

  const categoryId = entry.dataset.categoryId || '';
  if (!categoryId) return null;

  const rect = entry.getBoundingClientRect();
  const insertAfter = clientY > rect.top + rect.height / 2;
  entry.classList.toggle('is-drop-target-before', !insertAfter);
  entry.classList.toggle('is-drop-target-after', insertAfter);
  return {
    categoryId,
    insertIndex: targetIndex + (insertAfter ? 1 : 0),
  };
}

/**
 * @param {HTMLElement|null} categoryContent
 * @returns {FavoriteDropLocation}
 */
function getFavoriteDropLocationFromContent(categoryContent) {
  if (!(categoryContent instanceof HTMLElement)) return null;

  const categoryId = categoryContent.dataset.categoryId || '';
  if (!categoryId) return null;

  categoryContent.classList.add('is-drop-target');
  const entries = categoryContent.querySelectorAll('.favorite-entry');
  return {
    categoryId,
    insertIndex: entries.length,
  };
}

/**
 * @param {number} clientX
 * @param {number} clientY
 * @returns {FavoriteDropLocation}
 */
function getFavoriteDropLocationFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  const favoriteEntry = target instanceof HTMLElement ? target.closest('.favorite-entry') : null;
  const categoryContent = target instanceof HTMLElement ? target.closest('.favorite-category-content') : null;

  clearFavoriteDropIndicators();
  if (favoriteEntry instanceof HTMLElement) {
    return getFavoriteDropLocationFromEntry(favoriteEntry, clientY);
  }

  return getFavoriteDropLocationFromContent(categoryContent instanceof HTMLElement ? categoryContent : null);
}

/**
 * @param {FavoriteDropLocation} location
 */
function finalizeFavoriteDrop(location) {
  if (!draggedFavorite || !location) {
    clearFavoriteDropIndicators();
    draggedFavorite = null;
    return;
  }

  if (moveFavoriteById(draggedFavorite.favoriteId, location.categoryId, location.insertIndex)) {
    const { favoriteId } = draggedFavorite;
    renderFavorites();
    focusFavoriteAction(favoriteId, 'drag');
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

  dom.addCategoryBtn?.addEventListener('click', async () => {
    await promptCreateFavoriteCategory();
  });

  dom.favoritesList.addEventListener('click', async event => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const actionButton = target ? target.closest('button[data-action]') : null;
    const category = target ? target.closest('.favorite-category') : null;
    const favoriteEntry = target ? target.closest('.favorite-entry') : null;

    if (actionButton instanceof HTMLButtonElement && category instanceof HTMLElement && !favoriteEntry) {
      const categoryId = category.dataset.categoryId || '';
      if (!categoryId) return;

      switch (actionButton.dataset.action) {
        case 'toggle-category':
          if (toggleFavoriteCategoryCollapsed(categoryId)) {
            renderFavorites();
          }
          return;
        case 'rename-category':
          await promptRenameFavoriteCategory(categoryId);
          return;
        case 'delete-category':
          if (await promptDeleteFavoriteCategory(categoryId)) {
            renderHistory();
          }
          return;
        default:
          return;
      }
    }

    if (!(favoriteEntry instanceof HTMLElement)) return;

    const favoriteId = favoriteEntry.dataset.favoriteId || '';
    const formula = favoriteEntry.dataset.formula || '';
    const successMode = favoriteEntry.dataset.successMode === 'true';
    if (!favoriteId || !formula) return;

    const action = actionButton instanceof HTMLButtonElement ? actionButton.dataset.action : 'load';
    if (action === 'remove') {
      removeFavoriteById(favoriteId);
      renderFavorites();
      renderHistory();
      return;
    }

    if (action === 'edit-label') {
      await promptEditFavoriteLabel(favoriteId);
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

    const favoriteId = favoriteEntry.dataset.favoriteId || '';
    if (!favoriteId) return;

    draggedFavorite = {
      favoriteId,
      mode: 'native',
    };

    favoriteEntry.classList.add('is-dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedFavorite.favoriteId);
    }
  });

  dom.favoritesList.addEventListener('dragover', event => {
    if (!draggedFavorite) return;

    event.preventDefault();
    getFavoriteDropLocationFromPoint(event.clientX, event.clientY);
  });

  dom.favoritesList.addEventListener('drop', event => {
    if (!draggedFavorite) return;

    event.preventDefault();
    finalizeFavoriteDrop(getFavoriteDropLocationFromPoint(event.clientX, event.clientY));
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

    const favoriteId = favoriteEntry.dataset.favoriteId || '';
    if (!favoriteId) return;

    event.preventDefault();
    draggedFavorite = {
      favoriteId,
      mode: 'pointer',
      pointerId: event.pointerId,
    };
    favoriteEntry.classList.add('is-dragging');
    dragHandle.setPointerCapture(event.pointerId);
  });

  dom.favoritesList.addEventListener('pointermove', event => {
    if (!draggedFavorite || draggedFavorite.mode !== 'pointer' || draggedFavorite.pointerId !== event.pointerId) return;

    event.preventDefault();
    getFavoriteDropLocationFromPoint(event.clientX, event.clientY);
  });

  dom.favoritesList.addEventListener('pointerup', event => {
    if (!draggedFavorite || draggedFavorite.mode !== 'pointer' || draggedFavorite.pointerId !== event.pointerId) return;

    event.preventDefault();
    finalizeFavoriteDrop(getFavoriteDropLocationFromPoint(event.clientX, event.clientY));
  });

  dom.favoritesList.addEventListener('pointercancel', event => {
    if (!draggedFavorite || draggedFavorite.mode !== 'pointer' || draggedFavorite.pointerId !== event.pointerId) return;

    clearFavoriteDropIndicators();
    draggedFavorite = null;
  });
}