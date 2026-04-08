/**
 * Rollz — TTRPG Dice Roller
 * Uses random.org API for true random numbers, falls back to
 * crypto.getRandomValues when the API is unavailable.
 */

'use strict';

/* ── Constants ──────────────────────────────────────────────────── */
const HISTORY_KEY  = 'rollz_history';
const MAX_HISTORY  = 30;
const RANDOM_ORG   = 'https://www.random.org/integers/';
const DICE_SIDES   = [4, 6, 8, 10, 12, 20, 100];

/* ── State ──────────────────────────────────────────────────────── */
const state = {
  /** @type {Record<number, number>} Map of die faces → count selected */
  selectedDice: {},
  /** @type {'ok'|'fallback'|'unknown'} */
  apiStatus: 'unknown',
  /** @type {Array<{formula: string, total: number, breakdown: string, timestamp: number}>} */
  history: [],
};

/* ── DOM references ─────────────────────────────────────────────── */
const dom = {
  formulaInput:     /** @type {HTMLInputElement} */ (document.getElementById('formula-input')),
  formulaPreview:   document.getElementById('formula-preview'),
  clearBtn:         document.getElementById('clear-btn'),
  rollBtn:          document.getElementById('roll-btn'),
  resultSection:    document.getElementById('result-section'),
  resultCard:       document.getElementById('result-card'),
  resultFormula:    document.getElementById('result-formula'),
  resultBreakdown:  document.getElementById('result-breakdown'),
  resultTotal:      document.getElementById('result-total'),
  errorBanner:      document.getElementById('error-banner'),
  errorText:        document.getElementById('error-text'),
  historyList:      document.getElementById('history-list'),
  historyEmpty:     document.getElementById('history-empty'),
  clearHistoryBtn:  document.getElementById('clear-history-btn'),
  apiBadge:         document.getElementById('api-badge'),
  apiLabel:         document.getElementById('api-label'),
  spinnerOverlay:   document.getElementById('spinner-overlay'),
};

/* ═══════════════════════════════════════════════════════════════════
   FORMULA PARSER
   Supported syntax: NdM, NdM + K, NdM - K, NdM + NdM + K …
   Examples: "2d6 + 4", "1d20 - 2", "3d8 + 1d4 + 5"
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{ type: 'dice', count: number, sides: number, raw: string }
 *          |{ type: 'modifier', value: number, raw: string }} Token
 */

/**
 * Parse a dice formula string into an array of tokens.
 * Returns an empty array when the formula cannot be parsed.
 * @param {string} formula
 * @returns {Token[]}
 */
function parseFormula(formula) {
  const tokens = [];
  // Remove all whitespace for uniform processing
  const str = formula.replace(/\s+/g, '');
  if (!str) return tokens;

  // Tokenise: each segment starts with an optional +/- then either NdM or a plain integer
  const re = /([+-]?)(\d*)d(\d+)|([+-]?\d+)/gi;
  let match;

  while ((match = re.exec(str)) !== null) {
    if (match[3] !== undefined) {
      // Dice token: (sign)(count)d(sides)
      const sign  = match[1] === '-' ? -1 : 1;
      const count = match[2] ? parseInt(match[2], 10) : 1;
      const sides = parseInt(match[3], 10);

      if (sides < 1 || count < 1) return []; // malformed
      tokens.push({ type: 'dice', count: sign * count, sides, raw: match[0] });
    } else if (match[4] !== undefined) {
      // Numeric modifier (e.g. "+4", "-2", "3")
      const value = parseInt(match[4], 10);
      if (isNaN(value)) return []; // malformed
      tokens.push({ type: 'modifier', value, raw: match[0] });
    }
  }

  // Sanity: at least one dice token required
  if (!tokens.some(t => t.type === 'dice')) return [];
  return tokens;
}

/**
 * Return a human-readable description of parsed tokens for the preview.
 * @param {Token[]} tokens
 * @returns {string}
 */
function describeFormula(tokens) {
  return tokens.map(t => {
    if (t.type === 'dice') {
      const sign  = t.count < 0 ? '−' : (tokens.indexOf(t) === 0 ? '' : '+');
      const count = Math.abs(t.count);
      return `${sign} ${count}d${t.sides}`.trim();
    }
    const sign = t.value < 0 ? '−' : '+';
    return `${sign} ${Math.abs(t.value)}`;
  }).join('  ').replace(/^\+\s*/, '');
}

/* ═══════════════════════════════════════════════════════════════════
   RANDOM NUMBER GENERATION
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Fetch `count` integers in [min, max] from random.org.
 * @param {number} count
 * @param {number} min
 * @param {number} max
 * @returns {Promise<number[]>}
 */
async function fetchFromRandomOrg(count, min, max) {
  const url = new URL(RANDOM_ORG);
  url.searchParams.set('num',    String(count));
  url.searchParams.set('min',    String(min));
  url.searchParams.set('max',    String(max));
  url.searchParams.set('col',    '1');
  url.searchParams.set('base',   '10');
  url.searchParams.set('format', 'plain');
  url.searchParams.set('rnd',    'new');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`random.org responded with ${res.status}`);

  const text = await res.text();
  const nums = text.trim().split('\n').map(Number);
  if (nums.length !== count || nums.some(isNaN)) {
    throw new Error('Unexpected response from random.org');
  }
  return nums;
}

/**
 * Secure local fallback using Web Crypto API.
 * @param {number} count
 * @param {number} min
 * @param {number} max
 * @returns {number[]}
 */
function localRandom(count, min, max) {
  const range  = max - min + 1;
  const buffer = new Uint32Array(count);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, n => (n % range) + min);
}

/**
 * Obtain `count` random integers in [1, sides], preferring random.org.
 * Sets state.apiStatus to reflect the source used.
 * @param {number} count
 * @param {number} sides
 * @returns {Promise<{ numbers: number[], usedApi: boolean }>}
 */
async function getRandomNumbers(count, sides) {
  try {
    const numbers = await fetchFromRandomOrg(count, 1, sides);
    return { numbers, usedApi: true };
  } catch {
    return { numbers: localRandom(count, 1, sides), usedApi: false };
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ROLL ENGINE
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{
 *   total: number,
 *   tokens: Token[],
 *   rolls: Record<number, number[]>,
 *   usedApi: boolean,
 * }} RollResult
 */

/**
 * Evaluate a parsed formula, fetching random numbers.
 * @param {Token[]} tokens
 * @returns {Promise<RollResult>}
 */
async function evaluateTokens(tokens) {
  // Group dice by face count to minimise API requests
  const diceNeeded = {};
  for (const t of tokens) {
    if (t.type !== 'dice') continue;
    const abs = Math.abs(t.count);
    diceNeeded[t.sides] = (diceNeeded[t.sides] || 0) + abs;
  }

  // Fetch all required random numbers in parallel
  const fetchPromises = Object.entries(diceNeeded).map(([sides, count]) =>
    getRandomNumbers(count, Number(sides)).then(res => ({
      sides: Number(sides),
      numbers: res.numbers,
      usedApi: res.usedApi,
    }))
  );

  const fetched = await Promise.all(fetchPromises);

  // Build a cursor-map per face count
  const pools = {};
  let usedApi = true;
  for (const { sides, numbers, usedApi: api } of fetched) {
    pools[sides] = { numbers, cursor: 0 };
    if (!api) usedApi = false;
  }

  // Evaluate
  let total = 0;
  const rolls = {};

  for (const t of tokens) {
    if (t.type === 'dice') {
      const abs  = Math.abs(t.count);
      const pool = pools[t.sides];
      const drawn = pool.numbers.slice(pool.cursor, pool.cursor + abs);
      pool.cursor += abs;

      rolls[`${t.raw}`] = drawn;
      const sum = drawn.reduce((a, b) => a + b, 0);
      total += t.count < 0 ? -sum : sum;
    } else {
      total += t.value;
    }
  }

  return { total, tokens, rolls, usedApi };
}

/* ═══════════════════════════════════════════════════════════════════
   UI — RESULT RENDERING
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Build the breakdown DOM for a roll result.
 * @param {RollResult} result
 */
function renderResult(result) {
  const { total, tokens, rolls } = result;

  // Reconstruct formula string
  dom.resultFormula.textContent = describeFormula(tokens);

  // Breakdown
  dom.resultBreakdown.innerHTML = '';

  let rollIndex = 0;
  for (const t of tokens) {
    const group = document.createElement('div');
    group.className = 'breakdown-group';

    if (t.type === 'dice') {
      const label  = document.createElement('div');
      label.className = 'breakdown-label';
      label.textContent = t.raw.startsWith('-') ? `(${t.raw.replace(/^-/, '−')})` : t.raw;
      group.appendChild(label);

      const diceRow = document.createElement('div');
      diceRow.className = 'breakdown-dice';
      const drawn = rolls[t.raw] || [];
      drawn.forEach((n, idx) => {
        const chip = document.createElement('div');
        chip.className = 'die-result';
        if (n === t.sides)  chip.classList.add('is-max');
        if (n === 1)        chip.classList.add('is-min');
        chip.textContent = String(n);
        chip.style.animationDelay = `${(rollIndex + idx) * 60}ms`;
        diceRow.appendChild(chip);
      });
      group.appendChild(diceRow);

      if (drawn.length > 1) {
        const sub = document.createElement('div');
        sub.className = 'breakdown-subtotal';
        const sum = drawn.reduce((a, b) => a + b, 0);
        sub.textContent = `= ${t.count < 0 ? '-' : ''}${sum}`;
        group.appendChild(sub);
      }
      rollIndex += drawn.length;
    } else {
      const chip = document.createElement('div');
      chip.className = 'modifier-chip';
      chip.textContent = t.value >= 0 ? `+${t.value}` : String(t.value);
      chip.style.animationDelay = `${rollIndex * 60}ms`;
      group.appendChild(chip);
    }

    dom.resultBreakdown.appendChild(group);
  }

  // Total
  dom.resultTotal.textContent = String(total);

  // Show section
  dom.resultSection.hidden = false;
  dom.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ═══════════════════════════════════════════════════════════════════
   UI — API STATUS BADGE
   ═══════════════════════════════════════════════════════════════════ */

/** @param {'ok'|'fallback'|'unknown'} status */
function setApiStatus(status) {
  if (state.apiStatus === status) return;
  state.apiStatus = status;
  dom.apiBadge.className = `api-badge status-${status}`;
  dom.apiLabel.textContent =
    status === 'ok'       ? 'random.org'       :
    status === 'fallback' ? 'local fallback'   :
                            'random.org';
}

/* ═══════════════════════════════════════════════════════════════════
   UI — FORMULA PREVIEW
   ═══════════════════════════════════════════════════════════════════ */

function updateFormulaPreview() {
  const raw    = dom.formulaInput.value.trim();
  const tokens = parseFormula(raw);

  if (!raw) {
    dom.formulaPreview.textContent = 'Enter a formula or click dice above';
    dom.formulaPreview.className   = 'formula-preview';
    dom.rollBtn.disabled           = true;
    return;
  }

  if (tokens.length === 0) {
    dom.formulaPreview.textContent = 'Formula not recognised — try e.g. 2d6 + 4';
    dom.formulaPreview.className   = 'formula-preview is-invalid';
    dom.rollBtn.disabled           = true;
    return;
  }

  dom.formulaPreview.textContent = '✓  ' + describeFormula(tokens);
  dom.formulaPreview.className   = 'formula-preview is-valid';
  dom.rollBtn.disabled           = false;
}

/* ═══════════════════════════════════════════════════════════════════
   UI — DICE BUTTONS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Add one die of `sides` faces to the formula, updating the dice counter badge.
 * @param {number} sides
 */
function addDieToFormula(sides) {
  state.selectedDice[sides] = (state.selectedDice[sides] || 0) + 1;
  rebuildFormulaFromDice();
  updateDiceButtons();
}

/**
 * Rebuild the formula string from the selected dice state.
 * Dice-click mode builds only from state.selectedDice; manual
 * typing clears selectedDice so the two modes never mix.
 */
function rebuildFormulaFromDice() {
  const diceParts = DICE_SIDES
    .filter(s => (state.selectedDice[s] || 0) > 0)
    .map(s => `${state.selectedDice[s]}d${s}`);

  dom.formulaInput.value = diceParts.join(' + ');
  updateFormulaPreview();
}

/** Sync counter badges and selected state on die buttons. */
function updateDiceButtons() {
  document.querySelectorAll('.die-btn').forEach(btn => {
    const sides   = Number(btn.dataset.sides);
    const count   = state.selectedDice[sides] || 0;
    const counter = btn.querySelector('.die-counter');
    if (counter) counter.textContent = String(count);
    btn.classList.toggle('is-selected', count > 0);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   UI — ERROR
   ═══════════════════════════════════════════════════════════════════ */

/** @param {string|null} message — pass null to hide the banner */
function showError(message) {
  if (!message) {
    dom.errorBanner.hidden = true;
    dom.errorText.textContent = '';
    return;
  }
  dom.errorText.textContent = message;
  dom.errorBanner.hidden = false;
}

/* ═══════════════════════════════════════════════════════════════════
   UI — HISTORY
   ═══════════════════════════════════════════════════════════════════ */

function loadHistory() {
  try {
    state.history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    state.history = [];
  }
  renderHistory();
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, MAX_HISTORY)));
  } catch { /* storage unavailable */ }
}

/**
 * @param {{formula:string, total:number, breakdown:string, timestamp:number}} entry
 */
function pushHistory(entry) {
  state.history.unshift(entry);
  if (state.history.length > MAX_HISTORY) state.history.length = MAX_HISTORY;
  saveHistory();
  renderHistory();
}

function renderHistory() {
  // Clear existing entries (keep the empty-state element)
  const entries = dom.historyList.querySelectorAll('.history-entry');
  entries.forEach(el => el.remove());

  if (state.history.length === 0) {
    dom.historyEmpty.hidden = false;
    return;
  }

  dom.historyEmpty.hidden = true;

  for (const entry of state.history) {
    const el = document.createElement('div');
    el.className  = 'history-entry';
    el.role       = 'listitem';
    el.title      = 'Click to re-use this formula';

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

    // Re-use formula on click
    el.addEventListener('click', () => {
      dom.formulaInput.value = entry.formula;
      updateFormulaPreview();
      dom.formulaInput.focus();
    });

    dom.historyList.appendChild(el);
  }
}

/** Basic HTML escaping to prevent XSS when injecting user input into innerHTML. */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Format a timestamp as a relative time string. */
function formatTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000)  return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN ROLL ACTION
   ═══════════════════════════════════════════════════════════════════ */

async function doRoll() {
  const raw    = dom.formulaInput.value.trim();
  const tokens = parseFormula(raw);

  if (tokens.length === 0) {
    showError('Invalid formula. Try something like: 2d6 + 4');
    return;
  }

  showError(null);
  dom.rollBtn.disabled    = true;
  dom.rollBtn.classList.add('is-rolling');
  dom.spinnerOverlay.hidden = false;
  dom.spinnerOverlay.removeAttribute('aria-hidden');

  try {
    const result = await evaluateTokens(tokens);

    setApiStatus(result.usedApi ? 'ok' : 'fallback');
    renderResult(result);

    // Build compact breakdown summary for history
    const breakdownSummary = tokens.map(t => {
      if (t.type === 'dice') {
        const drawn = result.rolls[t.raw] || [];
        return `[${drawn.join(', ')}]`;
      }
      return String(t.value);
    }).join(' ');

    pushHistory({
      formula:   raw,
      total:     result.total,
      breakdown: breakdownSummary,
      timestamp: Date.now(),
    });
  } catch (err) {
    showError(`Roll failed: ${err.message}`);
  } finally {
    dom.rollBtn.disabled = false;
    dom.rollBtn.classList.remove('is-rolling');
    dom.spinnerOverlay.hidden = true;
    dom.spinnerOverlay.setAttribute('aria-hidden', 'true');
  }
}

/* ═══════════════════════════════════════════════════════════════════
   INITIALISATION
   ═══════════════════════════════════════════════════════════════════ */

function init() {
  // Load persisted history
  loadHistory();

  // Dice button clicks
  document.querySelectorAll('.die-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sides = Number(btn.dataset.sides);
      if (!DICE_SIDES.includes(sides)) return;
      addDieToFormula(sides);
    });
  });

  // Formula input changes
  dom.formulaInput.addEventListener('input', () => {
    // Reset selected-dice state when user types manually
    state.selectedDice = {};
    updateDiceButtons();
    updateFormulaPreview();
  });

  // Enter to roll
  dom.formulaInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !dom.rollBtn.disabled) doRoll();
  });

  // Clear formula button
  dom.clearBtn.addEventListener('click', () => {
    dom.formulaInput.value = '';
    state.selectedDice = {};
    updateDiceButtons();
    updateFormulaPreview();
    dom.resultSection.hidden = true;
    showError(null);
    dom.formulaInput.focus();
  });

  // Roll button
  dom.rollBtn.addEventListener('click', doRoll);

  // Clear history
  dom.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    saveHistory();
    renderHistory();
  });

  // Initial preview state
  updateFormulaPreview();
}

// Kick everything off once the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
