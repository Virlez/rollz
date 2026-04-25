import { dom } from './dom.js';
import { evaluateTokens } from './engine.js';
import { buildHistoryBreakdownSummary, pushHistory } from './history.js';
import { t } from './i18n.js';
import { normalizeRollMode, parseRollRequest } from './parser.js';
import { createRandomNumberSource } from './random.js';
import { renderResult } from './render.js';
import { getCurrentRollMode } from './roll-mode.js';
import { state } from './state.js';
import { getFormulaCompatibilityIssues, showError } from './ui.js';

function setRollingUi(isRolling) {
  dom.rollBtn.disabled = isRolling;
  dom.rollBtn.classList.toggle('is-rolling', isRolling);
  dom.spinnerOverlay.hidden = !isRolling;

  if (isRolling) {
    dom.spinnerOverlay.removeAttribute('aria-hidden');
    return;
  }

  dom.spinnerOverlay.setAttribute('aria-hidden', 'true');
}

async function evaluateFormulaEntry(entry, index, rollMode) {
  const randomSource = createRandomNumberSource();
  const result = await evaluateTokens(entry.tokens, {
    advantageMode: index === 0 ? rollMode.advantageMode : 'none',
    successMode: index === 0 ? rollMode.successMode : false,
    drawNumbers: randomSource.getRandomNumbers,
  });

  result.randomSource = randomSource.getSource();
  return {
    formula: entry.formula,
    result,
  };
}

function buildRepeatedBreakdownSummary(formulas, repeatedRolls) {
  return repeatedRolls
    .map(renderedRolls => renderedRolls
      .map((entry, index) => buildHistoryBreakdownSummary(formulas[index].tokens, entry.result))
      .join(' ; '))
    .join(' • ');
}

function buildRepeatedTotalSummary(repeatedRolls) {
  return repeatedRolls
    .map(renderedRolls => renderedRolls.map(entry => String(entry.result.total)).join(' | '))
    .join(' • ');
}

export async function rollFormulaInput(rawInput, options = {}) {
  const raw = rawInput.trim();
  const request = parseRollRequest(raw);
  const rollMode = normalizeRollMode(options.mode ?? getCurrentRollMode());

  if (!request) {
    showError(t('errorInvalid'));
    return false;
  }

  const { formulas, repeatCount } = request;

  const compatibilityIssues = getFormulaCompatibilityIssues(formulas, rollMode);
  if (compatibilityIssues.length > 0) {
    showError(compatibilityIssues[0]);
    return false;
  }

  showError(null);
  setRollingUi(true);

  try {
    const repeatedRolls = [];

    for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
      const renderedRolls = [];

      for (const [index, entry] of formulas.entries()) {
        renderedRolls.push(await evaluateFormulaEntry(entry, index, rollMode));
      }

      repeatedRolls.push(renderedRolls);
    }

    const renderedResult = repeatCount === 1 ? repeatedRolls[0] : repeatedRolls;

    state.lastResult = renderedResult;
    renderResult(renderedResult);

    const breakdownSummary = buildRepeatedBreakdownSummary(formulas, repeatedRolls);
    const totalSummary = buildRepeatedTotalSummary(repeatedRolls);

    pushHistory({
      formula: raw,
      total: totalSummary,
      breakdown: breakdownSummary,
      timestamp: Date.now(),
      mode: rollMode,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    showError(`${t('errorRoll')}${message}`);
  } finally {
    setRollingUi(false);
  }

  return true;
}