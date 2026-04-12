/**
 * @typedef {{ type: 'dice', count: number, sides: number, raw: string }
 *          | { type: 'modifier', value: number, raw: string }} Token
 */

/**
 * @typedef {{ formula: string, tokens: Token[] }} ParsedFormula
 */

/** @typedef {{ formula: string, result: any }} RenderedRoll */

/**
 * @typedef {{
 *   advantageMode: 'none'|'advantage'|'disadvantage',
 *   successMode: boolean,
 * }} RollMode
 */

/**
 * @typedef {{
 *   formula: string,
 *   total: string|number,
 *   breakdown: string,
 *   timestamp: number,
 *   mode?: RollMode,
 * }} HistoryEntry
 */

/**
 * @param {string} formula
 * @returns {Token[]}
 */
export function parseFormula(formula) {
  const tokens = [];
  const str = formula.replace(/\s+/g, '');
  if (!str) return tokens;

  const re = /([+-]?)(\d*)d(\d+)|([+-]?\d+)/gi;
  let match;
  let cursor = 0;

  while ((match = re.exec(str)) !== null) {
    if (match.index !== cursor) return [];

    if (match[3] !== undefined) {
      const sign = match[1] === '-' ? -1 : 1;
      const count = match[2] ? parseInt(match[2], 10) : 1;
      const sides = parseInt(match[3], 10);

      if (sides < 1 || count < 1) return [];
      tokens.push({ type: 'dice', count: sign * count, sides, raw: match[0] });
    } else if (match[4] !== undefined) {
      const value = parseInt(match[4], 10);
      if (Number.isNaN(value)) return [];
      tokens.push({ type: 'modifier', value, raw: match[0] });
    }

    cursor = re.lastIndex;
  }

  if (cursor !== str.length) return [];
  if (!tokens.some(token => token.type === 'dice')) return [];
  return tokens;
}

/**
 * @param {string} formulaInput
 * @returns {ParsedFormula[]}
 */
export function parseFormulaInput(formulaInput) {
  const parts = formulaInput
    .split(';')
    .map(part => part.trim());

  if (parts.length === 0 || parts.some(part => !part)) return [];

  const parsed = parts.map(formula => ({ formula, tokens: parseFormula(formula) }));
  if (parsed.some(entry => entry.tokens.length === 0)) return [];

  return parsed;
}

/**
 * @param {Token[]} tokens
 * @returns {string}
 */
export function describeFormula(tokens) {
  return tokens.map(token => {
    if (token.type === 'dice') {
      const sign = token.count < 0 ? '−' : (tokens.indexOf(token) === 0 ? '' : '+');
      const count = Math.abs(token.count);
      return `${sign} ${count}d${token.sides}`.trim();
    }

    const sign = token.value < 0 ? '−' : '+';
    return `${sign} ${Math.abs(token.value)}`;
  }).join('  ').replace(/^\+\s*/, '');
}

/**
 * @param {ParsedFormula[]} formulas
 * @returns {string}
 */
export function describeFormulaInput(formulas) {
  return formulas.map(entry => describeFormula(entry.tokens)).join('  ;  ');
}

/**
 * @param {Partial<RollMode>|undefined} mode
 * @returns {RollMode}
 */
export function normalizeRollMode(mode) {
  const advantageMode = mode && (mode.advantageMode === 'advantage' || mode.advantageMode === 'disadvantage')
    ? mode.advantageMode
    : 'none';
  const successMode = Boolean(mode && mode.successMode);

  if (successMode) {
    return { advantageMode: 'none', successMode: true };
  }

  return { advantageMode, successMode: false };
}

/**
 * @param {Partial<HistoryEntry>} entry
 * @returns {HistoryEntry}
 */
export function normalizeHistoryEntry(entry) {
  return {
    formula: typeof entry.formula === 'string' ? entry.formula : '',
    total: typeof entry.total === 'string' || typeof entry.total === 'number' ? entry.total : '',
    breakdown: typeof entry.breakdown === 'string' ? entry.breakdown : '',
    timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now(),
    mode: normalizeRollMode(entry.mode),
  };
}
