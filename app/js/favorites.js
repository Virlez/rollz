import { FAVORITES_KEY, MAX_FAVORITES } from './constants.js';
import { dom } from './dom.js';
import { t } from './i18n.js';
import { state } from './state.js';

/**
 * @param {unknown} entry
 * @returns {{ formula: string, timestamp: number, successMode: boolean }|null}
 */
function normalizeFavoriteEntry(entry) {
  if (typeof entry === 'string') {
    return entry.trim() ? { formula: entry.trim(), timestamp: Date.now(), successMode: false } : null;
  }

  if (!entry || typeof entry !== 'object') return null;

  const formula = typeof entry.formula === 'string' ? entry.formula.trim() : '';
  if (!formula) return null;

  return {
    formula,
    timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now(),
    successMode: entry.successMode === true,
  };
}

/**
 * @param {string} formula
 * @param {{ successMode?: boolean }} [options]
 * @returns {boolean}
 */
function favoriteMatches(entry, formula, options = {}) {
  return entry.formula === formula.trim() && entry.successMode === (options.successMode === true);
}

export function loadFavorites() {
  try {
    const rawEntries = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    state.favorites = Array.isArray(rawEntries)
      ? rawEntries.map(normalizeFavoriteEntry).filter(Boolean).slice(0, MAX_FAVORITES)
      : [];
  } catch {
    state.favorites = [];
  }

  renderFavorites();
}

export function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites.slice(0, MAX_FAVORITES)));
  } catch {}
}

/**
 * @param {string} formula
 * @param {{ successMode?: boolean }} [options]
 * @returns {boolean}
 */
export function isFavoriteFormula(formula, options = {}) {
  return state.favorites.some(entry => favoriteMatches(entry, formula, options));
}

/**
 * @param {string} formula
 * @param {{ successMode?: boolean }} [options]
 * @returns {boolean}
 */
export function addFavoriteFormula(formula, options = {}) {
  const normalized = formula.trim();
  if (!normalized || isFavoriteFormula(normalized, options)) return false;

  state.favorites.unshift({
    formula: normalized,
    timestamp: Date.now(),
    successMode: options.successMode === true,
  });
  if (state.favorites.length > MAX_FAVORITES) state.favorites.length = MAX_FAVORITES;
  saveFavorites();
  return true;
}

/**
 * @param {string} formula
 * @param {{ successMode?: boolean }} [options]
 * @returns {boolean}
 */
export function removeFavoriteFormula(formula, options = {}) {
  const index = state.favorites.findIndex(entry => favoriteMatches(entry, formula, options));
  if (index < 0) return false;

  state.favorites.splice(index, 1);
  saveFavorites();
  return true;
}

/**
 * @param {string} formula
 * @param {number} insertIndex
 * @param {{ successMode?: boolean }} [options]
 * @returns {boolean}
 */
export function moveFavoriteFormula(formula, insertIndex, options = {}) {
  const sourceIndex = state.favorites.findIndex(entry => favoriteMatches(entry, formula, options));
  if (sourceIndex < 0) return false;

  const boundedIndex = Math.max(0, Math.min(insertIndex, state.favorites.length));
  let nextIndex = boundedIndex;
  if (sourceIndex < nextIndex) nextIndex -= 1;
  if (nextIndex === sourceIndex) return false;

  const [entry] = state.favorites.splice(sourceIndex, 1);
  state.favorites.splice(nextIndex, 0, entry);
  saveFavorites();
  return true;
}

/**
 * @param {string} formula
 * @param {{ successMode?: boolean }} [options]
 * @returns {boolean}
 */
export function toggleFavoriteFormula(formula, options = {}) {
  return isFavoriteFormula(formula, options) ? !removeFavoriteFormula(formula, options) : addFavoriteFormula(formula, options);
}

export function renderFavorites() {
  if (!dom.favoritesList || !dom.favoritesEmpty) return;

  const entries = dom.favoritesList.querySelectorAll('.favorite-entry');
  entries.forEach(entry => entry.remove());

  if (state.favorites.length === 0) {
    dom.favoritesEmpty.hidden = false;
    return;
  }

  dom.favoritesEmpty.hidden = true;

  state.favorites.forEach((entry, index) => {
    const el = document.createElement('div');
    el.className = 'favorite-entry';
    el.role = 'listitem';
    el.dataset.formula = entry.formula;
    el.dataset.successMode = entry.successMode ? 'true' : 'false';
    el.dataset.index = String(index);

    const loadButton = document.createElement('button');
    loadButton.type = 'button';
    loadButton.className = 'favorite-load-btn';
    loadButton.dataset.action = 'load';
    loadButton.setAttribute('aria-label', t('favoriteLoad'));
    loadButton.title = t('favoriteLoad');

    const formula = document.createElement('span');
    formula.className = 'favorite-formula';
    formula.textContent = entry.formula;
    loadButton.appendChild(formula);

    if (entry.successMode) {
      const modeBadge = document.createElement('span');
      modeBadge.className = 'favorite-mode-badge';
      modeBadge.textContent = t('successLabel');
      loadButton.appendChild(modeBadge);
    }

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'favorite-remove-btn';
    removeButton.dataset.action = 'remove';
    removeButton.setAttribute('aria-label', t('favoriteDelete'));
    removeButton.title = t('favoriteDelete');
    removeButton.textContent = 'x';

    const actions = document.createElement('div');
    actions.className = 'favorite-actions';

    const dragHandle = document.createElement('button');
    dragHandle.type = 'button';
    dragHandle.className = 'favorite-drag-handle';
    dragHandle.draggable = true;
    dragHandle.dataset.action = 'drag';
    dragHandle.setAttribute('aria-label', t('favoriteReorder'));
    dragHandle.title = t('favoriteReorder');
    dragHandle.textContent = '::';

    el.appendChild(loadButton);
    actions.appendChild(dragHandle);
    actions.appendChild(removeButton);
    el.appendChild(actions);
    dom.favoritesList.appendChild(el);
  });
}