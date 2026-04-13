import { FAVORITES_KEY, MAX_FAVORITES } from './constants.js';
import { dom } from './dom.js';
import { t } from './i18n.js';
import { state } from './state.js';

/**
 * @param {unknown} entry
 * @returns {{ formula: string, timestamp: number }|null}
 */
function normalizeFavoriteEntry(entry) {
  if (typeof entry === 'string') {
    return entry.trim() ? { formula: entry.trim(), timestamp: Date.now() } : null;
  }

  if (!entry || typeof entry !== 'object') return null;

  const formula = typeof entry.formula === 'string' ? entry.formula.trim() : '';
  if (!formula) return null;

  return {
    formula,
    timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now(),
  };
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
 * @returns {boolean}
 */
export function isFavoriteFormula(formula) {
  return state.favorites.some(entry => entry.formula === formula);
}

/**
 * @param {string} formula
 * @returns {boolean}
 */
export function addFavoriteFormula(formula) {
  const normalized = formula.trim();
  if (!normalized || isFavoriteFormula(normalized)) return false;

  state.favorites.unshift({ formula: normalized, timestamp: Date.now() });
  if (state.favorites.length > MAX_FAVORITES) state.favorites.length = MAX_FAVORITES;
  saveFavorites();
  return true;
}

/**
 * @param {string} formula
 * @returns {boolean}
 */
export function removeFavoriteFormula(formula) {
  const index = state.favorites.findIndex(entry => entry.formula === formula.trim());
  if (index < 0) return false;

  state.favorites.splice(index, 1);
  saveFavorites();
  return true;
}

/**
 * @param {string} formula
 * @returns {boolean}
 */
export function toggleFavoriteFormula(formula) {
  return isFavoriteFormula(formula) ? !removeFavoriteFormula(formula) : addFavoriteFormula(formula);
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

  state.favorites.forEach(entry => {
    const el = document.createElement('div');
    el.className = 'favorite-entry';
    el.role = 'listitem';
    el.dataset.formula = entry.formula;

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

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'favorite-remove-btn';
    removeButton.dataset.action = 'remove';
    removeButton.setAttribute('aria-label', t('favoriteDelete'));
    removeButton.title = t('favoriteDelete');
    removeButton.textContent = 'x';

    el.appendChild(loadButton);
    el.appendChild(removeButton);
    dom.favoritesList.appendChild(el);
  });
}