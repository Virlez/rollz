import { HISTORY_KEY, MAX_HISTORY } from './constants.js';
import { dom } from './dom.js';
import { isFavoriteFormula } from './favorites.js';
import { getLang, t } from './i18n.js';
import { normalizeHistoryEntry } from './parser.js';
import { state } from './state.js';

/**
 * @param {any} result
 * @param {number} index
 * @returns {any}
 */
function getTokenResult(result, index) {
  return result && result.tokenResults && result.tokenResults[index] ? result.tokenResults[index] : null;
}

/**
 * @param {any} detail
 * @returns {string}
 */
function formatDieValues(detail) {
  const finalRolls = detail && Array.isArray(detail.finalRolls) ? detail.finalRolls : [];
  const originalRolls = detail && Array.isArray(detail.originalRolls) ? detail.originalRolls : [];
  const rerollMask = detail && Array.isArray(detail.rerollMask) ? detail.rerollMask : [];

  return finalRolls.map((value, index) => {
    if (rerollMask[index]) {
      return `${originalRolls[index]}→${value}`;
    }
    return String(value);
  }).join(', ');
}

export function loadHistory() {
  try {
    state.history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').map(normalizeHistoryEntry);
  } catch {
    state.history = [];
  }
  renderHistory();
}

export function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, MAX_HISTORY)));
  } catch {}
}

/**
 * @param {{ formula: string, total: string|number, breakdown: string, timestamp: number, mode?: { advantageMode: 'none'|'advantage'|'disadvantage', successMode: boolean } }} entry
 */
export function pushHistory(entry) {
  state.history.unshift(entry);
  if (state.history.length > MAX_HISTORY) state.history.length = MAX_HISTORY;
  saveHistory();
  renderHistory();
}

export function renderHistory() {
  const entries = dom.historyList.querySelectorAll('.history-entry');
  entries.forEach(el => el.remove());

  if (state.history.length === 0) {
    dom.historyEmpty.hidden = false;
    return;
  }

  dom.historyEmpty.hidden = true;

  state.history.forEach((entry, index) => {
    const isFavorite = isFavoriteFormula(entry.formula);
    const el = document.createElement('div');
    el.className = 'history-entry';
    el.role = 'listitem';
    el.title = t('historyReuseTitle');
    el.dataset.index = String(index);

    const left = document.createElement('div');
    left.innerHTML = `
      <div class="history-formula">${escapeHtml(entry.formula)}</div>
      <div class="history-meta">${entry.breakdown}  ·  ${formatTime(entry.timestamp)}</div>
    `;

    const right = document.createElement('div');
    right.className = 'history-actions';

    const total = document.createElement('div');
    total.className = 'history-total';
    total.textContent = String(entry.total);

    const favoriteBtn = document.createElement('button');
    favoriteBtn.type = 'button';
    favoriteBtn.className = 'favorite-btn';
    favoriteBtn.classList.toggle('is-favorited', isFavorite);
    favoriteBtn.dataset.action = 'toggle-favorite';
    favoriteBtn.dataset.formula = entry.formula;
    favoriteBtn.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
    favoriteBtn.setAttribute('aria-label', isFavorite ? t('favoriteRemove') : t('favoriteAdd'));
    favoriteBtn.title = isFavorite ? t('favoriteRemove') : t('favoriteAdd');
    favoriteBtn.textContent = isFavorite ? '★' : '☆';

    right.appendChild(total);
    right.appendChild(favoriteBtn);
    el.appendChild(left);
    el.appendChild(right);
    dom.historyList.appendChild(el);
  });
}

/**
 * @param {Array<any>} tokens
 * @param {any} result
 * @returns {string}
 */
export function buildHistoryBreakdownSummary(tokens, result) {
  const advTag = result.advantageMode === 'advantage'
    ? ` ${t('advantageTag')}`
    : result.advantageMode === 'disadvantage'
      ? ` ${t('disadvantageTag')}`
      : '';
  const successTag = result.successMode ? ` ${t('successTag')}` : '';
  const criticalTag = result.criticalFailure ? ` • ${t('criticalFailure')}` : '';

  return tokens.map((token, index) => {
    if (token.type === 'dice') {
      const detail = getTokenResult(result, index);
      if (result.successMode && detail && detail.ignored) {
        return `[${t('ignoredLabel')}]`;
      }

      const drawnSummary = formatDieValues(detail);
      if (result.successMode && detail && detail.bonusRolls && detail.bonusRolls.length > 0) {
        return `[${drawnSummary}] → [${detail.bonusRolls.join(', ')}]`;
      }

      if (token.successThreshold !== undefined && detail) {
        return `[${drawnSummary}] = ${Math.abs(detail.successCount || 0)} ${t('successesSuffix')}`;
      }

      return `[${drawnSummary}]`;
    }

    return String(token.value);
  }).join(' ') + advTag + successTag + criticalTag;
}

/**
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {number} ts
 * @returns {string}
 */
export function formatTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return t('justNow');
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}${t('mAgo')}`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}${t('hAgo')}`;
  return new Date(ts).toLocaleDateString(getLang() === 'fr' ? 'fr-FR' : 'en-GB');
}
