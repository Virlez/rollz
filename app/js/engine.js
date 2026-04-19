/** @typedef {import('./parser.js').Token} Token */

/**
 * @typedef {{
 *   finalRolls: number[],
 *   originalRolls: number[],
 *   rerollMask: boolean[],
 *   successMatches: boolean[],
 *   successCount: number,
 *   bonusRolls: number[],
 *   ignored: boolean,
 *   subtotal: number,
 *   advantagePair?: [number, number],
 *   keptFirst?: number,
 *   discardedFirst?: number,
 *   restDrawn?: number[],
 * }} TokenResult
 */

/**
 * @typedef {{
 *   total: number,
 *   tokens: Token[],
 *   tokenResults: Array<TokenResult|null>,
 *   advantageMode: 'none'|'advantage'|'disadvantage',
 *   successMode: boolean,
 *   totalKind: 'total'|'successes',
 *   criticalFailure?: boolean,
 *   successBonusCount?: number,
 *   randomSource?: 'randomorg'|'crypto',
 * }} RollResult
 */

/**
 * @param {number[]} values
 * @returns {number}
 */
function sumValues(values) {
  return values.reduce((left, right) => left + right, 0);
}

/**
 * @param {number[]} values
 * @param {(value: number) => boolean} predicate
 * @returns {boolean[]}
 */
function mapSuccesses(values, predicate) {
  return values.map(value => predicate(value));
}

/**
 * @param {Token[]} tokens
 * @returns {Array<TokenResult|null>}
 */
function createTokenResults(tokens) {
  return tokens.map(token => token.type === 'dice'
    ? {
        finalRolls: [],
        originalRolls: [],
        rerollMask: [],
        successMatches: [],
        successCount: 0,
        bonusRolls: [],
        ignored: false,
        subtotal: 0,
      }
    : null);
}

/**
 * @param {Token[]} tokens
 * @returns {boolean}
 */
function hasInlineAdvancedTokens(tokens) {
  return tokens.some(token => token.type === 'dice' && (token.successThreshold !== undefined || token.rerollAtOrBelow !== undefined));
}

/**
 * @param {Token[]} tokens
 * @returns {boolean}
 */
function allDiceUseThreshold(tokens) {
  const diceTokens = tokens.filter(token => token.type === 'dice');
  return diceTokens.length > 0 && diceTokens.every(token => token.successThreshold !== undefined);
}

/**
 * @param {Token[]} tokens
 * @param {(count: number, sides: number) => Promise<number[]>} drawNumbers
 * @returns {Promise<RollResult>}
 */
async function evaluateInlineAdvancedTokens(tokens, drawNumbers) {
  let total = 0;
  const tokenResults = createTokenResults(tokens);

  for (const [index, token] of tokens.entries()) {
    if (token.type !== 'dice') {
      total += token.value;
      continue;
    }

    const count = Math.abs(token.count);
    const originalRolls = await drawNumbers(count, token.sides);
    const finalRolls = originalRolls.slice();
    const rerollMask = originalRolls.map(value => token.rerollAtOrBelow !== undefined && value <= token.rerollAtOrBelow);
    const rerollCount = rerollMask.filter(Boolean).length;

    if (rerollCount > 0) {
      const rerolls = await drawNumbers(rerollCount, token.sides);
      let rerollCursor = 0;

      rerollMask.forEach((shouldReroll, rollIndex) => {
        if (!shouldReroll) return;
        finalRolls[rollIndex] = rerolls[rerollCursor++];
      });
    }

    const successMatches = token.successThreshold !== undefined
      ? mapSuccesses(finalRolls, value => value >= token.successThreshold)
      : [];
    const successCount = successMatches.filter(Boolean).length;
    const subtotal = token.successThreshold !== undefined ? successCount : sumValues(finalRolls);
    const signedSubtotal = token.count < 0 ? -subtotal : subtotal;

    tokenResults[index] = {
      finalRolls,
      originalRolls: token.rerollAtOrBelow !== undefined ? originalRolls : [],
      rerollMask,
      successMatches,
      successCount,
      bonusRolls: [],
      ignored: false,
      subtotal: signedSubtotal,
    };

    total += signedSubtotal;
  }

  return {
    total,
    tokens,
    tokenResults,
    advantageMode: 'none',
    successMode: false,
    totalKind: allDiceUseThreshold(tokens) ? 'successes' : 'total',
  };
}

/**
 * @param {Token[]} tokens
 * @param {{
 *   advantageMode?: 'none'|'advantage'|'disadvantage',
 *   successMode?: boolean,
 *   drawNumbers: (count: number, sides: number) => Promise<number[]>,
 * }} options
 * @returns {Promise<RollResult>}
 */
export async function evaluateTokens(tokens, options) {
  const successMode = options.successMode === true;
  const mode = options.advantageMode === 'advantage' || options.advantageMode === 'disadvantage'
    ? options.advantageMode
    : 'none';
  const drawNumbers = options.drawNumbers;

  if (typeof drawNumbers !== 'function') {
    throw new TypeError('evaluateTokens requires a drawNumbers option');
  }

  if (successMode) {
    const tokenResults = createTokenResults(tokens);
    const firstDiceIndex = tokens.findIndex(token => token.type === 'dice');
    const firstDiceToken = firstDiceIndex >= 0 ? tokens[firstDiceIndex] : null;

    if (!firstDiceToken || firstDiceToken.type !== 'dice') {
      return {
        total: 0,
        tokens,
        tokenResults,
        advantageMode: 'none',
        successMode: true,
        totalKind: 'successes',
      };
    }

    const diceCount = Math.abs(firstDiceToken.count);
    const drawn = await drawNumbers(diceCount, firstDiceToken.sides);
    const successMatches = mapSuccesses(drawn, value => value % 2 === 0);
    const successCount = successMatches.filter(Boolean).length;
    const criticalFailure = drawn.length > 0 && drawn.every(value => value % 2 !== 0);
    const allEven = drawn.length > 0 && drawn.every(value => value % 2 === 0);
    const successBonusRolls = (!criticalFailure && allEven)
      ? await drawNumbers(diceCount, firstDiceToken.sides)
      : [];
    const successBonusCount = successBonusRolls.reduce((sum, value) => sum + (value % 2 === 0 ? 1 : 0), 0);
    const modifierTotal = tokens.reduce((sum, token) => token.type === 'modifier' ? sum + token.value : sum, 0);

    tokens.forEach((token, index) => {
      if (token.type !== 'dice' || index === firstDiceIndex) return;
      tokenResults[index] = {
        finalRolls: [],
        originalRolls: [],
        rerollMask: [],
        successMatches: [],
        successCount: 0,
        bonusRolls: [],
        ignored: true,
        subtotal: 0,
      };
    });

    tokenResults[firstDiceIndex] = {
      finalRolls: drawn,
      originalRolls: [],
      rerollMask: [],
      successMatches,
      successCount,
      bonusRolls: successBonusRolls,
      ignored: false,
      subtotal: criticalFailure ? 0 : successCount + successBonusCount,
    };

    return {
      total: criticalFailure ? 0 : successCount + successBonusCount + modifierTotal,
      tokens,
      tokenResults,
      advantageMode: 'none',
      successMode: true,
      successBonusCount,
      criticalFailure,
      totalKind: 'successes',
    };
  }

  if (hasInlineAdvancedTokens(tokens)) {
    return evaluateInlineAdvancedTokens(tokens, drawNumbers);
  }

  const hasAdvantage = mode !== 'none';
  const firstDiceIdx = tokens.findIndex(token => token.type === 'dice');
  const diceNeeded = {};

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'dice') continue;

    const abs = Math.abs(token.count);
    const extraForAdvantage = (hasAdvantage && i === firstDiceIdx) ? 1 : 0;
    diceNeeded[token.sides] = (diceNeeded[token.sides] || 0) + abs + extraForAdvantage;
  }

  const fetched = await Promise.all(
    Object.entries(diceNeeded).map(([sides, count]) =>
      drawNumbers(count, Number(sides)).then(numbers => ({
        sides: Number(sides),
        numbers,
      }))
    )
  );

  const pools = {};
  for (const { sides, numbers } of fetched) {
    pools[sides] = { numbers, cursor: 0 };
  }

  let total = 0;
  const tokenResults = createTokenResults(tokens);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'dice') {
      const abs = Math.abs(token.count);
      const pool = pools[token.sides];
      const isAdvGroup = hasAdvantage && i === firstDiceIdx;

      if (isAdvGroup) {
        const a = pool.numbers[pool.cursor++];
        const b = pool.numbers[pool.cursor++];
        let keptFirst;
        let discFirst;

        if (mode === 'advantage') {
          keptFirst = Math.max(a, b);
          discFirst = Math.min(a, b);
        } else {
          keptFirst = Math.min(a, b);
          discFirst = Math.max(a, b);
        }

        const restCount = abs - 1;
        const restDrawn = pool.numbers.slice(pool.cursor, pool.cursor + restCount);
        pool.cursor += restCount;

        const allKept = [keptFirst, ...restDrawn];
        tokenResults[i] = {
          finalRolls: allKept,
          originalRolls: [],
          rerollMask: [],
          successMatches: [],
          successCount: 0,
          bonusRolls: [],
          ignored: false,
          subtotal: token.count < 0 ? -sumValues(allKept) : sumValues(allKept),
          advantagePair: [a, b],
          keptFirst,
          discardedFirst: discFirst,
          restDrawn,
        };
        const sum = sumValues(allKept);
        total += token.count < 0 ? -sum : sum;
      } else {
        const drawn = pool.numbers.slice(pool.cursor, pool.cursor + abs);
        pool.cursor += abs;
        const sum = sumValues(drawn);
        tokenResults[i] = {
          finalRolls: drawn,
          originalRolls: [],
          rerollMask: [],
          successMatches: [],
          successCount: 0,
          bonusRolls: [],
          ignored: false,
          subtotal: token.count < 0 ? -sum : sum,
        };
        total += token.count < 0 ? -sum : sum;
      }
    } else {
      total += token.value;
    }
  }

  return { total, tokens, tokenResults, advantageMode: mode, successMode: false, totalKind: 'total' };
}
