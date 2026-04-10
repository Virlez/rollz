/**
 * Rollz — TTRPG Dice Roller
 * Uses random.org API for true random numbers.
 */

'use strict';

/* ── Constants ──────────────────────────────────────────────────── */
const HISTORY_KEY  = 'rollz_history';
const LANG_KEY     = 'rollz_lang';
const MAX_HISTORY  = 30;
const RANDOM_ORG   = 'https://www.random.org/integers/';
const DICE_SIDES   = [4, 6, 8, 10, 12, 20, 100];

/* ── i18n Dictionaries ──────────────────────────────────────────── */
const i18n = {
  en: {
    tagline:            'TTRPG Dice Roller',
    diceTitle:          'Choose Your Dice',
    diceHint:           'Click a die to add it to your formula',
    formulaTitle:       'Roll Formula',
    formulaPlaceholder: 'e.g. 2d6 + 4  ·  1d20 - 2  ·  3d8 + 1d4 + 5',
    formulaPreviewEmpty:'Enter a formula or click dice above',
    formulaInvalid:     'Formula not recognised — try e.g. 2d6 + 4',
    rollBtn:            'Roll!',
    totalLabel:         'Total',
    historyTitle:       'Roll History',
    clearAll:           'Clear all',
    historyEmpty:       'No rolls yet — start rolling!',
    rolling:            'Rolling…',
    footerMain:         'True random numbers by <a href="https://www.random.org" target="_blank" rel="noopener noreferrer">random.org</a> &bull; <a href="https://github.com/Virlez/rollz" target="_blank" rel="noopener noreferrer">GitHub</a>',
    errorInvalid:       'Invalid formula. Try something like: 2d6 + 4',
    errorRoll:          'Roll failed: ',
    justNow:            'just now',
    mAgo:               'm ago',
    hAgo:               'h ago',
    advantageLabel:     'Advantage',
    disadvantageLabel:  'Disadvantage',
    advantageTag:       '(Advantage)',
    disadvantageTag:    '(Disadvantage)',
    keptLabel:          'kept',
    discardedLabel:     'discarded',
    advantageFirstOnly: 'Advantage/Disadvantage applies to the first die only',
  },
  fr: {
    tagline:            'Lanceur de Dés JDR',
    diceTitle:          'Choisissez Vos Dés',
    diceHint:           'Cliquez sur un dé pour l\'ajouter à votre formule',
    formulaTitle:       'Formule de Lancer',
    formulaPlaceholder: 'ex. 2d6 + 4  ·  1d20 - 2  ·  3d8 + 1d4 + 5',
    formulaPreviewEmpty:'Entrez une formule ou cliquez sur les dés',
    formulaInvalid:     'Formule non reconnue — essayez ex. 2d6 + 4',
    rollBtn:            'Lancer !',
    totalLabel:         'Total',
    historyTitle:       'Historique des Lancers',
    clearAll:           'Tout effacer',
    historyEmpty:       'Aucun lancer — commencez à jouer !',
    rolling:            'Lancer en cours…',
    footerMain:         'Nombres aléatoires vrais par <a href="https://www.random.org" target="_blank" rel="noopener noreferrer">random.org</a> &bull; <a href="https://github.com/Virlez/rollz" target="_blank" rel="noopener noreferrer">GitHub</a>',
    errorInvalid:       'Formule invalide. Essayez par exemple : 2d6 + 4',
    errorRoll:          'Le lancer a échoué : ',
    justNow:            'à l\'instant',
    mAgo:               ' min',
    hAgo:               ' h',
    advantageLabel:     'Avantage',
    disadvantageLabel:  'Désavantage',
    advantageTag:       '(Avantage)',
    disadvantageTag:    '(Désavantage)',
    keptLabel:          'gardé',
    discardedLabel:     'écarté',
    advantageFirstOnly: 'L\'avantage/désavantage ne s\'applique qu\'au premier dé',
  },
};

/** @type {'en'|'fr'} */
let currentLang = 'fr';

/* ── State ──────────────────────────────────────────────────────── */
const state = {
  /** @type {Record<number, number>} Map of die faces → count selected */
  selectedDice: {},
  /** @type {number[]} Ordered list of die sides as clicked */
  diceOrder: [],
  /** @type {'none'|'advantage'|'disadvantage'} */
  advantageMode: 'none',
  /** @type {Array<{formula: string, total: number, breakdown: string, timestamp: number}>} */
  history: [],
};

/* ── i18n Functions ──────────────────────────────────────────────── */

/**
 * Get a translated string for the current language.
 * @param {string} key
 * @returns {string}
 */
function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key;
}

/**
 * Apply translations to all elements with data-i18n, data-i18n-placeholder, and data-i18n-html.
 */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  // Update lang attribute
  document.documentElement.lang = currentLang;

  // Update lang toggle button — show the flag of the OTHER language (click to switch)
  const flagEl = document.getElementById('lang-flag');
  if (flagEl) {
    flagEl.src = currentLang === 'en'
      ? 'https://flagcdn.com/w40/fr.png'
      : 'https://flagcdn.com/w40/gb.png';
    flagEl.alt = currentLang === 'en' ? 'FR' : 'EN';
  }
}

/**
 * Toggle between EN and FR, persist, and re-apply.
 */
function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'fr' : 'en';
  try { localStorage.setItem(LANG_KEY, currentLang); } catch {}
  applyTranslations();
  // Re-run formula preview to translate its dynamic text
  updateFormulaPreview();
  // Re-render history to update time labels
  renderHistory();
}

/**
 * Load persisted language preference.
 */
function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'fr' || saved === 'en') currentLang = saved;
  } catch {}
}

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
  spinnerOverlay:   document.getElementById('spinner-overlay'),
  advantageCheck:    /** @type {HTMLInputElement} */ (document.getElementById('advantage-check')),
  disadvantageCheck: /** @type {HTMLInputElement} */ (document.getElementById('disadvantage-check')),
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
 * Obtain `count` random integers in [1, sides] from random.org.
 * @param {number} count
 * @param {number} sides
 * @returns {Promise<number[]>}
 */
async function getRandomNumbers(count, sides) {
  return fetchFromRandomOrg(count, 1, sides);
}

/* ═══════════════════════════════════════════════════════════════════
   ROLL ENGINE
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{
 *   total: number,
 *   tokens: Token[],
 *   rolls: Record<string, number[]>,
 *   rollPairs: Record<string, {kept: number[], discarded: number[], allPairs: number[][]}>,
 *   advantageMode: string,
 * }} RollResult
 */

/**
 * Evaluate a parsed formula, fetching random numbers.
 * When advantage/disadvantage is active, each individual die is rolled twice
 * and the best (advantage) or worst (disadvantage) is kept.
 * Modifiers are simply added on top.
 * @param {Token[]} tokens
 * @returns {Promise<RollResult>}
 */
async function evaluateTokens(tokens) {
  const mode = state.advantageMode; // 'none' | 'advantage' | 'disadvantage'
  const hasAdvantage = mode !== 'none';

  // Identify the first dice token index (advantage applies only to its FIRST die)
  const firstDiceIdx = tokens.findIndex(tk => tk.type === 'dice');

  // Group dice by face count to minimise API requests
  const diceNeeded = {};
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.type !== 'dice') continue;
    const abs = Math.abs(tk.count);
    // Only the first die of the first dice group gets doubled
    const extraForAdvantage = (hasAdvantage && i === firstDiceIdx) ? 1 : 0;
    diceNeeded[tk.sides] = (diceNeeded[tk.sides] || 0) + abs + extraForAdvantage;
  }

  // Fetch all required random numbers in parallel
  const fetchPromises = Object.entries(diceNeeded).map(([sides, count]) =>
    getRandomNumbers(count, Number(sides)).then(numbers => ({
      sides: Number(sides),
      numbers,
    }))
  );

  const fetched = await Promise.all(fetchPromises);

  // Build a cursor-map per face count
  const pools = {};
  for (const { sides, numbers } of fetched) {
    pools[sides] = { numbers, cursor: 0 };
  }

  // Evaluate
  let total = 0;
  const rolls = {};       // kept rolls
  const rollPairs = {};   // advantage pair for display (only the first die)

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.type === 'dice') {
      const abs  = Math.abs(tk.count);
      const pool = pools[tk.sides];
      const isAdvGroup = hasAdvantage && i === firstDiceIdx;

      if (isAdvGroup) {
        // First die of this group: roll with advantage (2 rolls, keep best/worst)
        const a = pool.numbers[pool.cursor++];
        const b = pool.numbers[pool.cursor++];
        let keptFirst, discFirst;
        if (mode === 'advantage') {
          keptFirst  = Math.max(a, b);
          discFirst  = Math.min(a, b);
        } else {
          keptFirst  = Math.min(a, b);
          discFirst  = Math.max(a, b);
        }

        // Remaining dice of this group: normal rolls
        const restCount = abs - 1;
        const restDrawn = pool.numbers.slice(pool.cursor, pool.cursor + restCount);
        pool.cursor += restCount;

        const allKept = [keptFirst, ...restDrawn];
        rolls[tk.raw] = allKept;
        rollPairs[tk.raw] = {
          // Only the first die has a pair
          advantagePair: [a, b],
          keptFirst,
          discFirst,
          restDrawn,
        };
        const sum = allKept.reduce((x, y) => x + y, 0);
        total += tk.count < 0 ? -sum : sum;
      } else {
        const drawn = pool.numbers.slice(pool.cursor, pool.cursor + abs);
        pool.cursor += abs;
        rolls[tk.raw] = drawn;
        const sum = drawn.reduce((x, y) => x + y, 0);
        total += tk.count < 0 ? -sum : sum;
      }
    } else {
      total += tk.value;
    }
  }

  return { total, tokens, rolls, rollPairs, advantageMode: mode };
}

/* ═══════════════════════════════════════════════════════════════════
   UI — RESULT RENDERING
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Build the breakdown DOM for a roll result.
 * @param {RollResult} result
 */
function renderResult(result) {
  const { total, tokens, rolls, rollPairs, advantageMode } = result;

  // Reconstruct formula string + advantage tag
  let formulaStr = describeFormula(tokens);
  if (advantageMode === 'advantage')    formulaStr += '  ' + t('advantageTag');
  if (advantageMode === 'disadvantage') formulaStr += '  ' + t('disadvantageTag');
  dom.resultFormula.textContent = formulaStr;

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
      const pairs = rollPairs && rollPairs[t.raw];

      if (pairs && pairs.advantagePair) {
        // ── First die: advantage pair (kept + discarded) ──
        const [a, b] = pairs.advantagePair;
        const kept = pairs.keptFirst;
        const disc = pairs.discFirst;
        const bothEqual = a === b;

        const pairWrap = document.createElement('div');
        pairWrap.className = 'die-pair';

        const keptChip = document.createElement('div');
        keptChip.className = 'die-result is-kept';
        if (kept === t.sides) keptChip.classList.add('is-max');
        if (kept === 1)       keptChip.classList.add('is-min');
        keptChip.textContent = String(kept);
        keptChip.style.animationDelay = `${rollIndex * 60}ms`;

        const discChip = document.createElement('div');
        discChip.className = 'die-result is-discarded';
        discChip.textContent = String(disc);
        discChip.style.animationDelay = `${(rollIndex + 1) * 60}ms`;

        pairWrap.appendChild(keptChip);
        if (!bothEqual) pairWrap.appendChild(discChip);
        diceRow.appendChild(pairWrap);

        // ── Remaining dice in this group: normal chips ──
        const animOffset = rollIndex + 2; // after the pair
        pairs.restDrawn.forEach((n, idx) => {
          const chip = document.createElement('div');
          chip.className = 'die-result';
          if (n === t.sides)  chip.classList.add('is-max');
          if (n === 1)        chip.classList.add('is-min');
          chip.textContent = String(n);
          chip.style.animationDelay = `${(animOffset + idx) * 60}ms`;
          diceRow.appendChild(chip);
        });
      } else {
        // Normal mode
        drawn.forEach((n, idx) => {
          const chip = document.createElement('div');
          chip.className = 'die-result';
          if (n === t.sides)  chip.classList.add('is-max');
          if (n === 1)        chip.classList.add('is-min');
          chip.textContent = String(n);
          chip.style.animationDelay = `${(rollIndex + idx) * 60}ms`;
          diceRow.appendChild(chip);
        });
      }
      group.appendChild(diceRow);

      if (drawn.length > 1) {
        const sub = document.createElement('div');
        sub.className = 'breakdown-subtotal';
        const sum = drawn.reduce((a, b) => a + b, 0);
        sub.textContent = `= ${t.count < 0 ? '-' : ''}${sum}`;
        group.appendChild(sub);
      }
      // Advance animation counter: pair shows 2 chips + rest, normal shows drawn.length
      const pairsInfo = rollPairs && rollPairs[t.raw];
      rollIndex += pairsInfo && pairsInfo.advantagePair
        ? 2 + pairsInfo.restDrawn.length
        : drawn.length;
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
   UI — FORMULA PREVIEW
   ═══════════════════════════════════════════════════════════════════ */

function updateFormulaPreview() {
  const raw    = dom.formulaInput.value.trim();
  const tokens = parseFormula(raw);

  if (!raw) {
    dom.formulaPreview.textContent = t('formulaPreviewEmpty');
    dom.formulaPreview.className   = 'formula-preview';
    dom.rollBtn.disabled           = true;
    return;
  }

  if (tokens.length === 0) {
    dom.formulaPreview.textContent = t('formulaInvalid');
    dom.formulaPreview.className   = 'formula-preview is-invalid';
    dom.rollBtn.disabled           = true;
    return;
  }

  // Show warning when advantage/disadvantage is active and more than one die is rolled
  const diceTokens = tokens.filter(tk => tk.type === 'dice');
  const totalDiceCount = diceTokens.reduce((sum, tk) => sum + Math.abs(tk.count), 0);
  const advWarning = (state.advantageMode !== 'none' && totalDiceCount > 1)
    ? '  ⚠ ' + t('advantageFirstOnly')
    : '';

  dom.formulaPreview.textContent = '✓  ' + describeFormula(tokens) + advWarning;
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
  // Track insertion order — only add to the list the first time this die type is clicked
  if (!state.diceOrder.includes(sides)) {
    state.diceOrder.push(sides);
  }
  rebuildFormulaFromDice();
  updateDiceButtons();
}

/**
 * Rebuild the formula string from the selected dice state.
 * Dice-click mode builds only from state.selectedDice; manual
 * typing clears selectedDice so the two modes never mix.
 */
function rebuildFormulaFromDice() {
  const diceParts = state.diceOrder
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
  if (diff < 60_000)  return t('justNow');
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}${t('mAgo')}`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}${t('hAgo')}`;
  return new Date(ts).toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-GB');
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN ROLL ACTION
   ═══════════════════════════════════════════════════════════════════ */

async function doRoll() {
  const raw    = dom.formulaInput.value.trim();
  const tokens = parseFormula(raw);

  if (tokens.length === 0) {
    showError(t('errorInvalid'));
    return;
  }

  showError(null);
  dom.rollBtn.disabled    = true;
  dom.rollBtn.classList.add('is-rolling');
  dom.spinnerOverlay.hidden = false;
  dom.spinnerOverlay.removeAttribute('aria-hidden');

  try {
    const result = await evaluateTokens(tokens);

    renderResult(result);

    // Build compact breakdown summary for history
    const advTag = result.advantageMode === 'advantage'    ? ` ${t('advantageTag')}` :
                   result.advantageMode === 'disadvantage' ? ` ${t('disadvantageTag')}` : '';
    const breakdownSummary = tokens.map(t => {
      if (t.type === 'dice') {
        const drawn = result.rolls[t.raw] || [];
        return `[${drawn.join(', ')}]`;
      }
      return String(t.value);
    }).join(' ') + advTag;

    pushHistory({
      formula:   raw,
      total:     result.total,
      breakdown: breakdownSummary,
      timestamp: Date.now(),
    });
  } catch (err) {
    showError(`${t('errorRoll')}${err.message}`);
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
  // Load persisted language
  loadLanguage();
  applyTranslations();

  // Load persisted history
  loadHistory();

  // Language toggle
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) langToggle.addEventListener('click', toggleLanguage);

  // Advantage / Disadvantage toggles (mutually exclusive)
  if (dom.advantageCheck) {
    dom.advantageCheck.addEventListener('change', () => {
      if (dom.advantageCheck.checked) {
        dom.disadvantageCheck.checked = false;
        state.advantageMode = 'advantage';
      } else {
        state.advantageMode = 'none';
      }
      updateFormulaPreview();
    });
  }
  if (dom.disadvantageCheck) {
    dom.disadvantageCheck.addEventListener('change', () => {
      if (dom.disadvantageCheck.checked) {
        dom.advantageCheck.checked = false;
        state.advantageMode = 'disadvantage';
      } else {
        state.advantageMode = 'none';
      }
      updateFormulaPreview();
    });
  }

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
    state.diceOrder = [];
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
    state.diceOrder = [];
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
