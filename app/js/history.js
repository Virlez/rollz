import { HISTORY_KEY, MAX_HISTORY } from './constants.js';
import { dom } from './dom.js';
import { getLang, t } from './i18n.js';
import { normalizeHistoryEntry } from './parser.js';
import { state } from './state.js';

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
    const el = document.createElement('div');
    el.className = 'history-entry';
    el.role = 'listitem';
    el.title = 'Click to re-use this formula';
    el.dataset.index = String(index);

    const left = document.createElement('div');
    left.innerHTML = `
      <div class="history-formula">${escapeHtml(entry.formula)}</div>
      <div class="history-meta">${entry.breakdown}  ·  ${formatTime(entry.timestamp)}</div>
    `;

    const right = document.createElement('div');
    right.className = 'history-total';
    right.textContent = String(entry.total);

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
      if (result.successMode && result.ignoredDiceIndices && result.ignoredDiceIndices.includes(index)) {
        return `[${t('ignoredLabel')}]`;
      }

      const drawn = result.rolls[token.raw] || [];
      if (result.successMode && result.countedDiceIndex === index && result.successBonusRolls && result.successBonusRolls.length > 0) {
        return `[${drawn.join(', ')}] → [${result.successBonusRolls.join(', ')}]`;
      }

      return `[${drawn.join(', ')}]`;
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
