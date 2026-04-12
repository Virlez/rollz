import { state } from './state.js';
import { getRandomNumbers } from './random.js';

/**
 * @param {Array<any>} tokens
 * @param {{ advantageMode?: 'none'|'advantage'|'disadvantage', successMode?: boolean }} [options]
 * @returns {Promise<any>}
 */
export async function evaluateTokens(tokens, options = {}) {
  const successMode = options.successMode ?? state.successMode;
  const mode = options.advantageMode ?? state.advantageMode;

  if (successMode) {
    const firstDiceIndex = tokens.findIndex(token => token.type === 'dice');
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
    const successBonusRolls = (!criticalFailure && allEven)
      ? await getRandomNumbers(diceCount, firstDiceToken.sides)
      : [];
    const successBonusCount = successBonusRolls.reduce((sum, value) => sum + (value % 2 === 0 ? 1 : 0), 0);
    const modifierTotal = tokens.reduce((sum, token) => token.type === 'modifier' ? sum + token.value : sum, 0);
    const ignoredDiceIndices = tokens
      .map((token, index) => ({ token, index }))
      .filter(({ token, index }) => token.type === 'dice' && index !== firstDiceIndex)
      .map(({ index }) => index);

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
      getRandomNumbers(count, Number(sides)).then(numbers => ({
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
  const rolls = {};
  const rollPairs = {};

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
        rolls[token.raw] = allKept;
        rollPairs[token.raw] = {
          advantagePair: [a, b],
          keptFirst,
          discFirst,
          restDrawn,
        };
        const sum = allKept.reduce((left, right) => left + right, 0);
        total += token.count < 0 ? -sum : sum;
      } else {
        const drawn = pool.numbers.slice(pool.cursor, pool.cursor + abs);
        pool.cursor += abs;
        rolls[token.raw] = drawn;
        const sum = drawn.reduce((left, right) => left + right, 0);
        total += token.count < 0 ? -sum : sum;
      }
    } else {
      total += token.value;
    }
  }

  return { total, tokens, rolls, rollPairs, advantageMode: mode };
}
