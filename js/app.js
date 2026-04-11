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
const APP_VERSION  = '2026-04-12-2';

/* ── i18n Dictionaries ──────────────────────────────────────────── */
const i18n = {
  en: {
    tagline:            'TTRPG Dice Roller',
    diceTitle:          'Choose Your Dice',
    diceHint:           'Click a die to add it to your formula',
    modifierIncrease:   'Increase modifier',
    modifierDecrease:   'Decrease modifier',
    modifierValue:      'Modifier value',
    formulaTitle:       'Roll Formula',
    formulaPlaceholder: 'e.g. 2d6 + 4  ·  1d20 - 2  ·  1d20 + 4 ; 1d8 + 2',
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
    successLabel:       'Success Mode',
    advantageTag:       '(Advantage)',
    disadvantageTag:    '(Disadvantage)',
    successTag:         '(Success Mode)',
    keptLabel:          'kept',
    discardedLabel:     'discarded',
    advantageFirstOnly: 'Advantage/Disadvantage applies to the first die only',
    successFirstGroupOnly: 'In success mode, only the first dice group is used',
    successBonusAdded:  'Fixed modifiers are added to successes',
    multiRollModeFirstOnly: 'Advantage, disadvantage, and success mode apply to the first formula only',
    successTotalLabel:  'Successes',
    ignoredLabel:       'ignored',
    successesSuffix:    'successes',
    successBonusRerollLabel: 'Bonus reroll',
    successBonusRerollNote:  'All dice were even: one bonus reroll',
    criticalFailure:    'Fumble',
    offlineBadge:       'Offline mode',
    offlineRollNote:    '⚡ Secure local draw via Web Crypto',
    installApp:         'Install app',
  },
  fr: {
    tagline:            'Lanceur de Dés JDR',
    diceTitle:          'Choisissez Vos Dés',
    diceHint:           'Cliquez sur un dé pour l\'ajouter à votre formule',
    modifierIncrease:   'Augmenter le modificateur',
    modifierDecrease:   'Diminuer le modificateur',
    modifierValue:      'Valeur du modificateur',
    formulaTitle:       'Formule de Lancer',
    formulaPlaceholder: 'ex. 2d6 + 4  ·  1d20 - 2  ·  1d20 + 4 ; 1d8 + 2',
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
    successLabel:       'Mode réussites',
    advantageTag:       '(Avantage)',
    disadvantageTag:    '(Désavantage)',
    successTag:         '(Réussites)',
    keptLabel:          'gardé',
    discardedLabel:     'écarté',
    advantageFirstOnly: 'L\'avantage/désavantage ne s\'applique qu\'au premier dé',
    successFirstGroupOnly: 'En mode réussites, seul le premier groupe de dés est pris en compte',
    successBonusAdded:  'Les bonus fixes sont ajoutés aux réussites',
    multiRollModeFirstOnly: 'L\'avantage, le désavantage et le mode réussites s\'appliquent uniquement a la premiere formule',
    successTotalLabel:  'Réussites',
    ignoredLabel:       'ignoré',
    successesSuffix:    'réussites',
    successBonusRerollLabel: 'Relance bonus',
    successBonusRerollNote:  'Tous les dés sont pairs : une relance bonus',
    criticalFailure:    'Échec critique',
    offlineBadge:       'Mode hors-ligne',
    offlineRollNote:    '⚡ Tirage local sécurisé via Web Crypto',
    installApp:         'Installer',
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
  /** @type {number} */
  modifier: 0,
  /** @type {'none'|'advantage'|'disadvantage'} */
  advantageMode: 'none',
  /** @type {boolean} */
  successMode: false,
  /** @type {RenderedRoll[]|null} */
  lastResult: null,
  /** @type {boolean} */
  isOffline: navigator.onLine === false,
  /** @type {'randomorg'|'crypto'} */
  currentRollSource: 'randomorg',
  /** @type {BeforeInstallPromptEvent|null} */
  deferredInstallPrompt: null,
  /** @type {boolean} */
  isInstalled: false,
  /** @type {Array<{formula: string, total: number, breakdown: string, timestamp: number}>} */
  history: [],
};

/**
 * @typedef {Event & {
 *   prompt: () => Promise<void>,
 *   userChoice: Promise<{ outcome: 'accepted'|'dismissed', platform?: string }>
 * }} BeforeInstallPromptEvent
 */

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

  updateModifierUI();
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
  // Re-render current result card to translate dynamic result texts
  if (state.lastResult && !dom.resultSection.hidden) {
    renderResult(state.lastResult);
  }
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
  modifierInput:    /** @type {HTMLInputElement|null} */ (document.getElementById('modifier-input')),
  modifierIncBtn:   document.getElementById('modifier-inc'),
  modifierDecBtn:   document.getElementById('modifier-dec'),
  rollBtn:          document.getElementById('roll-btn'),
  resultSection:    document.getElementById('result-section'),
  resultCard:       document.getElementById('result-card'),
  resultFormula:    document.getElementById('result-formula'),
  resultBreakdown:  document.getElementById('result-breakdown'),
  resultTotalRow:   document.getElementById('result-total-row'),
  resultTotalLabel: document.getElementById('result-total-label'),
  resultTotal:      document.getElementById('result-total'),
  resultTotalNote:  document.getElementById('result-total-note'),
  resultSourceNote: document.getElementById('result-source-note'),
  resultMulti:      document.getElementById('result-multi'),
  errorBanner:      document.getElementById('error-banner'),
  errorText:        document.getElementById('error-text'),
  historyList:      document.getElementById('history-list'),
  historyEmpty:     document.getElementById('history-empty'),
  clearHistoryBtn:  document.getElementById('clear-history-btn'),
  spinnerOverlay:   document.getElementById('spinner-overlay'),
  offlineBadge:     document.getElementById('offline-badge'),
  installBtn:       document.getElementById('install-btn'),
  advantageCheck:    /** @type {HTMLInputElement} */ (document.getElementById('advantage-check')),
  disadvantageCheck: /** @type {HTMLInputElement} */ (document.getElementById('disadvantage-check')),
  successCheck:      /** @type {HTMLInputElement} */ (document.getElementById('success-check')),
};

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function clampModifier(value) {
  return Math.max(-99, Math.min(99, value));
}

function updateModifierUI() {
  if (!dom.modifierInput) return;

  dom.modifierInput.value = String(state.modifier);
  dom.modifierInput.setAttribute('aria-label', t('modifierValue'));

  if (dom.modifierIncBtn) dom.modifierIncBtn.setAttribute('aria-label', t('modifierIncrease'));
  if (dom.modifierDecBtn) dom.modifierDecBtn.setAttribute('aria-label', t('modifierDecrease'));
}

function resetFormulaBuilderState() {
  state.selectedDice = {};
  state.diceOrder = [];
  state.modifier = 0;
  updateDiceButtons();
  updateModifierUI();
}

function setModifier(value) {
  state.modifier = clampModifier(Number.isFinite(value) ? value : 0);
  updateModifierUI();
  rebuildFormulaFromDice();
}

/* ═══════════════════════════════════════════════════════════════════
   FORMULA PARSER
   Supported syntax: NdM, NdM + K, NdM - K, NdM + NdM + K …
   Examples: "2d6 + 4", "1d20 - 2", "3d8 + 1d4 + 5"
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{ type: 'dice', count: number, sides: number, raw: string }
 *          |{ type: 'modifier', value: number, raw: string }} Token
 *
 * @typedef {{ formula: string, tokens: Token[] }} ParsedFormula
 */

/** @typedef {{ formula: string, result: RollResult }} RenderedRoll */

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
  let cursor = 0;

  while ((match = re.exec(str)) !== null) {
    if (match.index !== cursor) return [];

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

    cursor = re.lastIndex;
  }

  if (cursor !== str.length) return [];

  // Sanity: at least one dice token required
  if (!tokens.some(t => t.type === 'dice')) return [];
  return tokens;
}

/**
 * Parse one or more formulas separated by ';'.
 * Returns an empty array when any segment is invalid.
 * @param {string} formulaInput
 * @returns {ParsedFormula[]}
 */
function parseFormulaInput(formulaInput) {
  const parts = formulaInput
    .split(';')
    .map(part => part.trim());

  if (parts.length === 0 || parts.some(part => !part)) return [];

  const parsed = parts.map(formula => ({ formula, tokens: parseFormula(formula) }));
  if (parsed.some(entry => entry.tokens.length === 0)) return [];

  return parsed;
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

/**
 * @param {ParsedFormula[]} formulas
 * @returns {string}
 */
function describeFormulaInput(formulas) {
  return formulas.map(entry => describeFormula(entry.tokens)).join('  ;  ');
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
 * Obtain `count` integers in [1, sides] from Web Crypto without modulo bias.
 * @param {number} count
 * @param {number} sides
 * @returns {number[]}
 */
function getCryptoRandomNumbers(count, sides) {
  if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') {
    throw new Error('Web Crypto is unavailable');
  }

  const values = [];
  const maxUint32 = 0x100000000;
  const limit = Math.floor(maxUint32 / sides) * sides;

  while (values.length < count) {
    const batch = new Uint32Array(Math.max(8, count - values.length));
    window.crypto.getRandomValues(batch);

    for (const randomValue of batch) {
      if (randomValue >= limit) continue;
      values.push((randomValue % sides) + 1);
      if (values.length === count) break;
    }
  }

  return values;
}

/**
 * Obtain `count` random integers in [1, sides] from random.org.
 * @param {number} count
 * @param {number} sides
 * @returns {Promise<number[]>}
 */
async function getRandomNumbers(count, sides) {
  try {
    return await fetchFromRandomOrg(count, 1, sides);
  } catch (error) {
    state.currentRollSource = 'crypto';
    return getCryptoRandomNumbers(count, sides);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ROLL ENGINE
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @typedef {{
 *   total: number,
 *   tokens: Token[],
 *   rolls: Record<string, number[]>,
 *   rollPairs: Record<string, {advantagePair: number[], keptFirst: number, discFirst: number, restDrawn: number[]}>,
 *   advantageMode: string,
 *   successMode?: boolean,
 *   countedDiceIndex?: number,
 *   successesByToken?: Record<string, number>,
 *   ignoredDiceIndices?: number[],
 *   successBonusRolls?: number[],
 *   successBonusCount?: number,
 *   criticalFailure?: boolean,
 *   randomSource?: 'randomorg'|'crypto',
 * }} RollResult
 */

/**
 * Evaluate a parsed formula, fetching random numbers.
 * When advantage/disadvantage is active, each individual die is rolled twice
 * and the best (advantage) or worst (disadvantage) is kept.
 * Modifiers are simply added on top.
 * @param {Token[]} tokens
 * @param {{ advantageMode?: 'none'|'advantage'|'disadvantage', successMode?: boolean }} [options]
 * @returns {Promise<RollResult>}
 */
async function evaluateTokens(tokens, options = {}) {
  const successMode = options.successMode ?? state.successMode;
  const mode = options.advantageMode ?? state.advantageMode;

  if (successMode) {
    const firstDiceIndex = tokens.findIndex(tk => tk.type === 'dice');
    const firstDiceToken = firstDiceIndex >= 0 ? tokens[firstDiceIndex] : null;

    if (!firstDiceToken || firstDiceToken.type !== 'dice') {
      return {
        total: 0,
        tokens,
        rolls: {},
        rollPairs: {},
        advantageMode: 'none',
        successMode: true,
        countedDiceIndex: undefined,
        successesByToken: {},
        ignoredDiceIndices: [],
      };
    }

    const diceCount = Math.abs(firstDiceToken.count);
    const drawn = await getRandomNumbers(diceCount, firstDiceToken.sides);
    const successCount = drawn.reduce((sum, value) => sum + (value % 2 === 0 ? 1 : 0), 0);
    const criticalFailure = drawn.length > 0 && drawn.every(value => value % 2 !== 0);
    const allEven = drawn.length > 0 && drawn.every(value => value % 2 === 0);
    const successBonusRolls = (!criticalFailure && allEven) ? await getRandomNumbers(diceCount, firstDiceToken.sides) : [];
    const successBonusCount = successBonusRolls.reduce((sum, value) => sum + (value % 2 === 0 ? 1 : 0), 0);
    const modifierTotal = tokens.reduce((sum, tk) => tk.type === 'modifier' ? sum + tk.value : sum, 0);
    const ignoredDiceIndices = tokens
      .map((tk, idx) => ({ tk, idx }))
      .filter(({ tk, idx }) => tk.type === 'dice' && idx !== firstDiceIndex)
      .map(({ idx }) => idx);

    return {
      total: criticalFailure ? 0 : successCount + successBonusCount + modifierTotal,
      tokens,
      rolls: { [firstDiceToken.raw]: drawn },
      rollPairs: {},
      advantageMode: 'none',
      successMode: true,
      countedDiceIndex: firstDiceIndex,
      successesByToken: { [firstDiceToken.raw]: successCount },
      ignoredDiceIndices,
      successBonusRolls,
      successBonusCount,
      criticalFailure,
    };
  }

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
 * Render a roll result into a target node set.
 * @param {RollResult} result
 * @param {{
 *   formula: HTMLElement,
 *   breakdown: HTMLElement,
 *   totalLabel: HTMLElement,
 *   total: HTMLElement,
 *   totalNote: HTMLElement,
 *   sourceNote: HTMLElement,
 * }} target
 */
function renderSingleResult(result, target) {
  const {
    total,
    tokens,
    rolls,
    rollPairs,
    advantageMode,
    successMode,
    countedDiceIndex,
    successesByToken,
    ignoredDiceIndices,
    successBonusRolls,
    successBonusCount,
    criticalFailure,
    randomSource,
  } = result;

  let formulaStr = describeFormula(tokens);
  if (advantageMode === 'advantage')    formulaStr += '  ' + t('advantageTag');
  if (advantageMode === 'disadvantage') formulaStr += '  ' + t('disadvantageTag');
  if (successMode)                      formulaStr += '  ' + t('successTag');
  target.formula.textContent = formulaStr;

  target.totalLabel.textContent = successMode ? t('successTotalLabel') : t('totalLabel');
  target.totalNote.textContent = criticalFailure ? t('criticalFailure') : '';
  target.totalNote.classList.toggle('is-critical', Boolean(criticalFailure));

  if (target.sourceNote) {
    const usedCryptoFallback = randomSource === 'crypto';
    target.sourceNote.textContent = usedCryptoFallback ? t('offlineRollNote') : '';
    target.sourceNote.hidden = !usedCryptoFallback;
  }
  target.total.classList.toggle('is-critical', Boolean(criticalFailure));

  target.breakdown.innerHTML = '';

  let rollIndex = 0;
  for (const [tokenIndex, token] of tokens.entries()) {
    const group = document.createElement('div');
    group.className = 'breakdown-group';

    if (token.type === 'dice') {
      const isIgnoredInSuccess = Boolean(successMode && ignoredDiceIndices && ignoredDiceIndices.includes(tokenIndex));
      if (isIgnoredInSuccess) group.classList.add('is-ignored');

      const label = document.createElement('div');
      label.className = 'breakdown-label';
      label.textContent = token.raw.startsWith('-') ? `(${token.raw.replace(/^-/, '−')})` : token.raw;
      group.appendChild(label);

      const diceRow = document.createElement('div');
      diceRow.className = 'breakdown-dice';
      const drawn = rolls[token.raw] || [];
      const pairs = rollPairs && rollPairs[token.raw];

      if (successMode) {
        if (tokenIndex === countedDiceIndex) {
          drawn.forEach((value, idx) => {
            const chip = document.createElement('div');
            chip.className = 'die-result';
            chip.classList.add(value % 2 === 0 ? 'is-success' : 'is-failure');
            if (value === token.sides) chip.classList.add('is-max');
            if (value === 1) chip.classList.add('is-min');
            chip.textContent = String(value);
            chip.style.animationDelay = `${(rollIndex + idx) * 60}ms`;
            diceRow.appendChild(chip);
          });

          if (successBonusRolls && successBonusRolls.length > 0) {
            const bonusRow = document.createElement('div');
            bonusRow.className = 'breakdown-dice breakdown-bonus';

            successBonusRolls.forEach((value, idx) => {
              const chip = document.createElement('div');
              chip.className = 'die-result';
              chip.classList.add(value % 2 === 0 ? 'is-success' : 'is-failure');
              if (value === token.sides) chip.classList.add('is-max');
              if (value === 1) chip.classList.add('is-min');
              chip.textContent = String(value);
              chip.style.animationDelay = `${(rollIndex + drawn.length + idx) * 60}ms`;
              bonusRow.appendChild(chip);
            });

            group.appendChild(diceRow);

            const bonusLabel = document.createElement('div');
            bonusLabel.className = 'breakdown-note';
            bonusLabel.textContent = `${t('successBonusRerollLabel')} • +${successBonusCount || 0}`;
            group.appendChild(bonusLabel);
            group.appendChild(bonusRow);
          } else {
            group.appendChild(diceRow);
          }
        } else {
          group.appendChild(diceRow);
        }

        const note = document.createElement('div');
        note.className = 'breakdown-note';
        if (isIgnoredInSuccess) {
          note.textContent = t('ignoredLabel');
        } else if (criticalFailure) {
          note.textContent = `= 0 ${t('successesSuffix')}`;
        } else {
          const successCount = successesByToken && successesByToken[token.raw] ? successesByToken[token.raw] : 0;
          const totalSuccessCount = successCount + (successBonusCount || 0);
          note.textContent = successBonusRolls && successBonusRolls.length > 0
            ? `${t('successBonusRerollNote')} • = ${totalSuccessCount} ${t('successesSuffix')}`
            : `= ${successCount} ${t('successesSuffix')}`;
        }
        group.appendChild(note);
        rollIndex += drawn.length + (successBonusRolls ? successBonusRolls.length : 0);
      } else {
        if (pairs && pairs.advantagePair) {
          const [firstRoll, secondRoll] = pairs.advantagePair;
          const kept = pairs.keptFirst;
          const discarded = pairs.discFirst;
          const bothEqual = firstRoll === secondRoll;

          const pairWrap = document.createElement('div');
          pairWrap.className = 'die-pair';

          const keptChip = document.createElement('div');
          keptChip.className = 'die-result is-kept';
          if (kept === token.sides) keptChip.classList.add('is-max');
          if (kept === 1) keptChip.classList.add('is-min');
          keptChip.textContent = String(kept);
          keptChip.style.animationDelay = `${rollIndex * 60}ms`;

          const discardedChip = document.createElement('div');
          discardedChip.className = 'die-result is-discarded';
          discardedChip.textContent = String(discarded);
          discardedChip.style.animationDelay = `${(rollIndex + 1) * 60}ms`;

          pairWrap.appendChild(keptChip);
          if (!bothEqual) pairWrap.appendChild(discardedChip);
          diceRow.appendChild(pairWrap);

          const animOffset = rollIndex + 2;
          pairs.restDrawn.forEach((value, idx) => {
            const chip = document.createElement('div');
            chip.className = 'die-result';
            if (value === token.sides) chip.classList.add('is-max');
            if (value === 1) chip.classList.add('is-min');
            chip.textContent = String(value);
            chip.style.animationDelay = `${(animOffset + idx) * 60}ms`;
            diceRow.appendChild(chip);
          });
        } else {
          drawn.forEach((value, idx) => {
            const chip = document.createElement('div');
            chip.className = 'die-result';
            if (value === token.sides) chip.classList.add('is-max');
            if (value === 1) chip.classList.add('is-min');
            chip.textContent = String(value);
            chip.style.animationDelay = `${(rollIndex + idx) * 60}ms`;
            diceRow.appendChild(chip);
          });
        }

        group.appendChild(diceRow);

        if (drawn.length > 1) {
          const sub = document.createElement('div');
          sub.className = 'breakdown-subtotal';
          const sum = drawn.reduce((a, b) => a + b, 0);
          sub.textContent = `= ${token.count < 0 ? '-' : ''}${sum}`;
          group.appendChild(sub);
        }

        const pairsInfo = rollPairs && rollPairs[token.raw];
        rollIndex += pairsInfo && pairsInfo.advantagePair
          ? 2 + pairsInfo.restDrawn.length
          : drawn.length;
      }
    } else {
      const chip = document.createElement('div');
      chip.className = 'modifier-chip';
      chip.textContent = token.value >= 0 ? `+${token.value}` : String(token.value);
      chip.style.animationDelay = `${rollIndex * 60}ms`;
      group.appendChild(chip);
    }

    target.breakdown.appendChild(group);
  }

  target.total.textContent = String(total);
}

/**
 * @param {RollResult} result
 * @returns {HTMLElement}
 */
function createResultSubBlock(result) {
  const block = document.createElement('div');
  block.className = 'result-sub-block';

  const formula = document.createElement('div');
  formula.className = 'result-formula';

  const breakdown = document.createElement('div');
  breakdown.className = 'result-breakdown';

  const totalRow = document.createElement('div');
  totalRow.className = 'result-total-row';

  const totalLabel = document.createElement('span');
  totalLabel.className = 'result-total-label';

  const total = document.createElement('span');
  total.className = 'result-total';

  const totalNote = document.createElement('span');
  totalNote.className = 'result-total-note';

  const sourceNote = document.createElement('span');
  sourceNote.className = 'result-source-note';
  sourceNote.hidden = true;

  totalRow.appendChild(totalLabel);
  totalRow.appendChild(total);
  totalRow.appendChild(totalNote);
  totalRow.appendChild(sourceNote);

  block.appendChild(formula);
  block.appendChild(breakdown);
  block.appendChild(totalRow);

  renderSingleResult(result, {
    formula,
    breakdown,
    totalLabel,
    total,
    totalNote,
    sourceNote,
  });

  return block;
}

/**
 * Build the breakdown DOM for one or more roll results.
 * @param {RenderedRoll[]} renderedRolls
 */
function renderResult(renderedRolls) {
  const rolls = Array.isArray(renderedRolls) ? renderedRolls : [];
  dom.resultMulti.classList.toggle('is-two-up', rolls.length === 2);

  if (rolls.length === 1) {
    dom.resultFormula.hidden = false;
    dom.resultBreakdown.hidden = false;
    dom.resultTotalRow.hidden = false;
    dom.resultMulti.hidden = true;
    dom.resultMulti.innerHTML = '';

    renderSingleResult(rolls[0].result, {
      formula: dom.resultFormula,
      breakdown: dom.resultBreakdown,
      totalLabel: dom.resultTotalLabel,
      total: dom.resultTotal,
      totalNote: dom.resultTotalNote,
      sourceNote: dom.resultSourceNote,
    });
  } else {
    dom.resultFormula.hidden = true;
    dom.resultBreakdown.hidden = true;
    dom.resultTotalRow.hidden = true;
    dom.resultMulti.hidden = false;
    dom.resultMulti.innerHTML = '';

    rolls.forEach((entry, index) => {
      if (index > 0) {
        const separator = document.createElement('div');
        separator.className = 'result-separator';
        dom.resultMulti.appendChild(separator);
      }

      dom.resultMulti.appendChild(createResultSubBlock(entry.result));
    });
  }

  dom.resultSection.hidden = false;
  dom.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ═══════════════════════════════════════════════════════════════════
   UI — FORMULA PREVIEW
   ═══════════════════════════════════════════════════════════════════ */

function updateFormulaPreview() {
  const raw    = dom.formulaInput.value.trim();
  const formulas = parseFormulaInput(raw);

  if (!raw) {
    dom.formulaPreview.textContent = t('formulaPreviewEmpty');
    dom.formulaPreview.className   = 'formula-preview';
    dom.rollBtn.disabled           = true;
    return;
  }

  if (formulas.length === 0) {
    dom.formulaPreview.textContent = t('formulaInvalid');
    dom.formulaPreview.className   = 'formula-preview is-invalid';
    dom.rollBtn.disabled           = true;
    return;
  }

  const firstTokens = formulas[0].tokens;
  const diceTokens = firstTokens.filter(tk => tk.type === 'dice');
  const totalDiceCount = diceTokens.reduce((sum, tk) => sum + Math.abs(tk.count), 0);
  const hasModifiers = firstTokens.some(tk => tk.type === 'modifier');
  const advWarning = (state.advantageMode !== 'none' && totalDiceCount > 1)
    ? '  ⚠ ' + t('advantageFirstOnly')
    : '';
  const successWarnings = [];
  if (state.successMode) {
    successWarnings.push(`⚠ ${t('successFirstGroupOnly')}`);
  }
  if (state.successMode && hasModifiers) {
    successWarnings.push(`➕ ${t('successBonusAdded')}`);
  }
  if (formulas.length > 1 && (state.advantageMode !== 'none' || state.successMode)) {
    successWarnings.push(`⚠ ${t('multiRollModeFirstOnly')}`);
  }
  const successWarning = successWarnings.length > 0 ? `  ${successWarnings.join('  ')}` : '';

  dom.formulaPreview.textContent = '✓  ' + describeFormulaInput(formulas) + advWarning + successWarning;
  dom.formulaPreview.className   = 'formula-preview is-valid';
  dom.rollBtn.disabled           = false;
}

/**
 * @param {Token[]} tokens
 * @param {RollResult} result
 * @returns {string}
 */
function buildHistoryBreakdownSummary(tokens, result) {
  const advTag = result.advantageMode === 'advantage'    ? ` ${t('advantageTag')}` :
                 result.advantageMode === 'disadvantage' ? ` ${t('disadvantageTag')}` : '';
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

  let formula = diceParts.join(' + ');

  if (state.modifier !== 0) {
    const modifierValue = String(Math.abs(state.modifier));
    if (formula) {
      formula += state.modifier > 0 ? ` + ${modifierValue}` : ` - ${modifierValue}`;
    } else {
      formula = state.modifier > 0 ? modifierValue : `-${modifierValue}`;
    }
  }

  dom.formulaInput.value = formula;
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

function updateOfflineUI() {
  state.isOffline = navigator.onLine === false;
  if (dom.offlineBadge) {
    dom.offlineBadge.hidden = !state.isOffline;
  }
}

function updateInstallUI() {
  state.isInstalled = isStandaloneMode();
  if (!dom.installBtn) return;

  dom.installBtn.hidden = state.isInstalled || !state.deferredInstallPrompt;
}

async function triggerInstallPrompt() {
  if (!state.deferredInstallPrompt) return;

  const installPrompt = state.deferredInstallPrompt;
  state.deferredInstallPrompt = null;
  updateInstallUI();

  try {
    await installPrompt.prompt();
    await installPrompt.userChoice;
  } catch {}

  updateInstallUI();
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    state.deferredInstallPrompt = /** @type {BeforeInstallPromptEvent} */ (event);
    updateInstallUI();
  });

  window.addEventListener('appinstalled', () => {
    state.deferredInstallPrompt = null;
    state.isInstalled = true;
    updateInstallUI();
  });

  if (dom.installBtn) {
    dom.installBtn.addEventListener('click', triggerInstallPrompt);
  }

  updateInstallUI();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    let hasRefreshedForNewWorker = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasRefreshedForNewWorker) return;
      hasRefreshedForNewWorker = true;
      window.location.reload();
    });

    navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`, { updateViaCache: 'none' })
      .then(registration => {
        registration.update().catch(() => {});

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {});
  }, { once: true });
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
 * @param {{formula:string, total:string|number, breakdown:string, timestamp:number}} entry
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

    // Re-roll the saved formula on click
    el.addEventListener('click', async () => {
      resetFormulaBuilderState();
      dom.formulaInput.value = entry.formula;
      updateFormulaPreview();
      await doRoll();
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
  const raw = dom.formulaInput.value.trim();
  const formulas = parseFormulaInput(raw);

  if (formulas.length === 0) {
    showError(t('errorInvalid'));
    return;
  }

  showError(null);
  dom.rollBtn.disabled    = true;
  dom.rollBtn.classList.add('is-rolling');
  dom.spinnerOverlay.hidden = false;
  dom.spinnerOverlay.removeAttribute('aria-hidden');

  try {
    const renderedRolls = [];

    for (const [index, entry] of formulas.entries()) {
      state.currentRollSource = 'randomorg';
      const result = await evaluateTokens(entry.tokens, {
        advantageMode: index === 0 ? state.advantageMode : 'none',
        successMode: index === 0 ? state.successMode : false,
      });
      result.randomSource = state.currentRollSource;
      renderedRolls.push({ formula: entry.formula, result });
    }

    state.lastResult = renderedRolls;
    renderResult(renderedRolls);

    const breakdownSummary = renderedRolls
      .map((entry, index) => buildHistoryBreakdownSummary(formulas[index].tokens, entry.result))
      .join(' ; ');
    const totalSummary = renderedRolls.map(entry => String(entry.result.total)).join(' ; ');

    pushHistory({
      formula:   raw,
      total:     totalSummary,
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
  updateOfflineUI();
  setupInstallPrompt();
  registerServiceWorker();

  // Load persisted history
  loadHistory();

  window.addEventListener('online', updateOfflineUI);
  window.addEventListener('offline', updateOfflineUI);

  // Language toggle
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) langToggle.addEventListener('click', toggleLanguage);

  // Advantage / Disadvantage toggles (mutually exclusive)
  if (dom.advantageCheck) {
    dom.advantageCheck.addEventListener('change', () => {
      if (dom.advantageCheck.checked) {
        dom.disadvantageCheck.checked = false;
        if (dom.successCheck) dom.successCheck.checked = false;
        state.advantageMode = 'advantage';
        state.successMode = false;
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
        if (dom.successCheck) dom.successCheck.checked = false;
        state.advantageMode = 'disadvantage';
        state.successMode = false;
      } else {
        state.advantageMode = 'none';
      }
      updateFormulaPreview();
    });
  }
  if (dom.successCheck) {
    dom.successCheck.addEventListener('change', () => {
      if (dom.successCheck.checked) {
        dom.advantageCheck.checked = false;
        dom.disadvantageCheck.checked = false;
        state.advantageMode = 'none';
        state.successMode = true;
      } else {
        state.successMode = false;
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

  // Formula input changes
  dom.formulaInput.addEventListener('input', () => {
    // Reset selected-dice state when user types manually
    resetFormulaBuilderState();
    updateFormulaPreview();
  });

  // Enter to roll
  dom.formulaInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !dom.rollBtn.disabled) doRoll();
  });

  // Clear formula button
  dom.clearBtn.addEventListener('click', () => {
    dom.formulaInput.value = '';
    resetFormulaBuilderState();
    updateFormulaPreview();
    dom.resultSection.hidden = true;
    showError(null);
    dom.formulaInput.blur();
    dom.clearBtn.blur();
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
  updateModifierUI();
  updateFormulaPreview();
}

// Kick everything off once the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
