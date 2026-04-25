import { HISTORY_KEY, MAX_HISTORY } from './constants.js';
import { dom } from './dom.js';
import { isFavoriteFormula } from './favorites.js';
import { getLang, t } from './i18n.js';
import { normalizeHistoryEntry } from './parser.js';
import { state } from './state.js';

/** @typedef {import('./engine.js').RollResult} RollResult */
/** @typedef {import('./engine.js').TokenResult} TokenResult */
/** @typedef {import('./parser.js').Token} Token */
/** @typedef {import('./parser.js').HistoryEntry} HistoryEntry */

/**
 * @param {RollResult} result
 * @param {number} index
 * @returns {TokenResult|null}
 */
function getTokenResult(result, index) {
  return result && result.tokenResults && result.tokenResults[index] ? result.tokenResults[index] : null;
}

/**
 * @param {TokenResult|null} detail
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
 * @param {HistoryEntry} entry
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
    const successMode = entry.mode && entry.mode.successMode === true;
    const isFavorite = isFavoriteFormula(entry.formula, { successMode });
    const timeLabel = formatTime(entry.timestamp);
    const el = document.createElement('div');
    el.className = 'history-entry';
    el.role = 'listitem';
    el.title = t('historyReuseTitle');
    el.dataset.index = String(index);

    const left = document.createElement('div');
    left.className = 'history-content';

    const formula = document.createElement('div');
    formula.className = 'history-formula';
    formula.textContent = entry.formula;

    const meta = document.createElement('div');
    meta.className = 'history-meta';

    if (entry.breakdown) {
      const breakdown = document.createElement('span');
      breakdown.className = 'history-breakdown';
      breakdown.textContent = entry.breakdown;
      breakdown.title = entry.breakdown;

      const separator = document.createElement('span');
      separator.className = 'history-meta-separator';
      separator.textContent = '·';
      separator.setAttribute('aria-hidden', 'true');

      meta.appendChild(breakdown);
      meta.appendChild(separator);
    }

    const time = document.createElement('span');
    time.className = 'history-time';
    time.textContent = timeLabel;
    meta.appendChild(time);

    left.appendChild(formula);
    left.appendChild(meta);

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
    favoriteBtn.dataset.successMode = successMode ? 'true' : 'false';
    favoriteBtn.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
    favoriteBtn.setAttribute('aria-label', isFavorite ? t('favoriteAddAnother') : t('favoriteAdd'));
    favoriteBtn.title = isFavorite ? t('favoriteAddAnother') : t('favoriteAdd');
    favoriteBtn.textContent = isFavorite ? '★' : '☆';

    right.appendChild(total);
    right.appendChild(favoriteBtn);
    el.appendChild(left);
    el.appendChild(right);
    dom.historyList.appendChild(el);
  });
}

/**
 * @param {Token[]} tokens
 * @param {RollResult} result
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
