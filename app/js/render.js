import { dom } from './dom.js';
import { t } from './i18n.js';
import { describeFormula } from './parser.js';

/** @typedef {import('./engine.js').RollResult} RollResult */
/** @typedef {import('./engine.js').TokenResult} TokenResult */
/** @typedef {import('./parser.js').Token} Token */
/** @typedef {import('./parser.js').RenderedRoll} RenderedRoll */

function isRepeatedRolls(renderedRolls) {
  return Array.isArray(renderedRolls)
    && renderedRolls.length > 0
    && Array.isArray(renderedRolls[0]);
}

/**
 * @typedef {{
 *   formula: HTMLElement,
 *   breakdown: HTMLElement,
 *   totalLabel: HTMLElement,
 *   total: HTMLElement,
 *   totalNote: HTMLElement,
 *   sourceNote: HTMLElement,
 * }} RenderTarget
 */

/**
 * @param {RollResult} result
 * @param {number} index
 * @returns {TokenResult|null}
 */
function getTokenResult(result, index) {
  return result && result.tokenResults && result.tokenResults[index] ? result.tokenResults[index] : null;
}

/**
 * @param {Element} element
 */
function clearElement(element) {
  element.replaceChildren();
}

/**
 * @param {number} value
 * @param {number} sides
 * @param {number} animationIndex
 * @param {string[]} [extraClasses]
 * @returns {HTMLDivElement}
 */
function createDieChip(value, sides, animationIndex, extraClasses = []) {
  const chip = document.createElement('div');
  chip.className = 'die-result';
  extraClasses.forEach(className => chip.classList.add(className));
  if (value === sides) chip.classList.add('is-max');
  if (value === 1) chip.classList.add('is-min');
  chip.textContent = String(value);
  chip.style.animationDelay = `${animationIndex * 60}ms`;
  return chip;
}

/**
 * @param {HTMLDivElement} diceRow
 * @param {Token} token
 * @param {TokenResult|null} detail
 * @param {number} startIndex
 * @param {(value: number, index: number) => string[]} classify
 * @returns {number}
 */
function appendDiceResults(diceRow, token, detail, startIndex, classify) {
  const finalRolls = detail && Array.isArray(detail.finalRolls) ? detail.finalRolls : [];
  const originalRolls = detail && Array.isArray(detail.originalRolls) ? detail.originalRolls : [];
  const rerollMask = detail && Array.isArray(detail.rerollMask) ? detail.rerollMask : [];
  let visualCount = 0;

  finalRolls.forEach((value, index) => {
    const extraClasses = classify(value, index);
    if (rerollMask[index]) {
      const pairWrap = document.createElement('div');
      pairWrap.className = 'die-pair is-reroll';
      pairWrap.appendChild(createDieChip(originalRolls[index], token.sides, startIndex + visualCount, ['is-discarded', 'is-rerolled-original']));
      pairWrap.appendChild(createDieChip(value, token.sides, startIndex + visualCount + 1, [...extraClasses, 'is-rerolled-new']));
      diceRow.appendChild(pairWrap);
      visualCount += 2;
      return;
    }

    diceRow.appendChild(createDieChip(value, token.sides, startIndex + visualCount, extraClasses));
    visualCount += 1;
  });

  return visualCount;
}

/**
 * @param {RollResult} result
 * @param {RenderTarget} target
 */
export function renderSingleResult(result, target) {
  const {
    total,
    tokens,
    advantageMode,
    successMode,
    criticalFailure,
    randomSource,
    totalKind,
  } = result;

  let formulaStr = describeFormula(tokens);
  if (advantageMode === 'advantage') formulaStr += '  ' + t('advantageTag');
  if (advantageMode === 'disadvantage') formulaStr += '  ' + t('disadvantageTag');
  if (successMode) formulaStr += '  ' + t('successTag');
  target.formula.textContent = formulaStr;

  target.totalLabel.textContent = totalKind === 'successes' || successMode ? t('successTotalLabel') : t('totalLabel');
  target.totalNote.textContent = criticalFailure ? t('criticalFailure') : '';
  target.totalNote.classList.toggle('is-critical', Boolean(criticalFailure));

  if (target.sourceNote) {
    const usedCryptoFallback = randomSource === 'crypto';
    target.sourceNote.textContent = usedCryptoFallback ? t('offlineRollNote') : '';
    target.sourceNote.hidden = !usedCryptoFallback;
  }
  target.total.classList.toggle('is-critical', Boolean(criticalFailure));

  clearElement(target.breakdown);

  let rollIndex = 0;
  for (const [tokenIndex, token] of tokens.entries()) {
    const group = document.createElement('div');
    group.className = 'breakdown-group';

    if (token.type === 'dice') {
      const detail = getTokenResult(result, tokenIndex);
      const isIgnoredInSuccess = Boolean(successMode && detail && detail.ignored);
      if (isIgnoredInSuccess) group.classList.add('is-ignored');

      const label = document.createElement('div');
      label.className = 'breakdown-label';
      label.textContent = token.raw.startsWith('-') ? `(${token.raw.replace(/^-/, '−')})` : token.raw;
      group.appendChild(label);

      const diceRow = document.createElement('div');
      diceRow.className = 'breakdown-dice';
      const drawn = detail && Array.isArray(detail.finalRolls) ? detail.finalRolls : [];

      if (successMode) {
        if (!isIgnoredInSuccess) {
          const renderedCount = appendDiceResults(
            diceRow,
            token,
            detail,
            rollIndex,
            (_value, index) => detail && detail.successMatches && detail.successMatches[index]
              ? ['is-success']
              : ['is-failure']
          );

          if (detail && detail.bonusRolls && detail.bonusRolls.length > 0) {
            const bonusRow = document.createElement('div');
            bonusRow.className = 'breakdown-dice breakdown-bonus';

            detail.bonusRolls.forEach((value, index) => {
              bonusRow.appendChild(createDieChip(
                value,
                token.sides,
                rollIndex + renderedCount + index,
                [value % 2 === 0 ? 'is-success' : 'is-failure']
              ));
            });

            group.appendChild(diceRow);

            const bonusLabel = document.createElement('div');
            bonusLabel.className = 'breakdown-note';
            bonusLabel.textContent = `${t('successBonusRerollLabel')} • +${result.successBonusCount || 0}`;
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
          const successCount = detail && typeof detail.successCount === 'number' ? detail.successCount : 0;
          const totalSuccessCount = successCount + (result.successBonusCount || 0);
          note.textContent = detail && detail.bonusRolls && detail.bonusRolls.length > 0
            ? `${t('successBonusRerollNote')} • = ${totalSuccessCount} ${t('successesSuffix')}`
            : `= ${successCount} ${t('successesSuffix')}`;
        }
        group.appendChild(note);
        rollIndex += drawn.length + (detail && detail.bonusRolls ? detail.bonusRolls.length : 0);
      } else {
        if (detail && detail.advantagePair) {
          const [firstRoll, secondRoll] = detail.advantagePair;
          const kept = detail.keptFirst;
          const discarded = detail.discardedFirst;
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
          detail.restDrawn.forEach((value, index) => {
            diceRow.appendChild(createDieChip(value, token.sides, animOffset + index));
          });
        } else {
          appendDiceResults(
            diceRow,
            token,
            detail,
            rollIndex,
            (_value, index) => token.successThreshold !== undefined && detail && detail.successMatches && detail.successMatches[index]
              ? ['is-success']
              : token.successThreshold !== undefined
                ? ['is-failure']
                : []
          );
        }

        group.appendChild(diceRow);

        if (token.successThreshold !== undefined) {
          const note = document.createElement('div');
          note.className = 'breakdown-note';
          note.textContent = `= ${detail ? detail.subtotal : 0} ${t('successesSuffix')}`;
          group.appendChild(note);
        } else if (drawn.length > 1 || (detail && detail.rerollMask && detail.rerollMask.some(Boolean))) {
          const sub = document.createElement('div');
          sub.className = 'breakdown-subtotal';
          const sum = drawn.reduce((left, right) => left + right, 0);
          sub.textContent = `= ${token.count < 0 ? '-' : ''}${sum}`;
          group.appendChild(sub);
        }

        rollIndex += detail && detail.advantagePair
          ? 2 + detail.restDrawn.length
          : (detail && detail.rerollMask ? detail.finalRolls.length + detail.rerollMask.filter(Boolean).length : drawn.length);
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
 * @returns {HTMLDivElement}
 */
export function createResultSubBlock(result) {
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

function createCenteredTailRow(result) {
  const row = document.createElement('div');
  row.className = 'result-tail-row';
  row.appendChild(createResultSubBlock(result));
  return row;
}

function appendRollBlocks(container, renderedRolls) {
  const rolls = Array.isArray(renderedRolls) ? renderedRolls : [];
  const hasCenteredTail = rolls.length > 2 && rolls.length % 2 === 1;
  container.classList.toggle('is-two-up', rolls.length > 1);
  container.classList.toggle('has-centered-tail', hasCenteredTail);
  clearElement(container);

  rolls.forEach((entry, index) => {
    if (index > 0) {
      const separator = document.createElement('div');
      separator.className = 'result-separator';
      container.appendChild(separator);
    }

    container.appendChild(
      hasCenteredTail && index === rolls.length - 1
        ? createCenteredTailRow(entry.result)
        : createResultSubBlock(entry.result)
    );
  });
}

function createRepeatBlock(renderedRolls, index) {
  const block = document.createElement('div');
  block.className = 'result-repeat-block';

  const title = document.createElement('div');
  title.className = 'result-repeat-title';
  title.textContent = `${t('repeatRollLabel')} ${index + 1}`;

  const body = document.createElement('div');
  body.className = 'result-repeat-body result-multi';
  appendRollBlocks(body, renderedRolls);

  block.appendChild(title);
  block.appendChild(body);
  return block;
}

/**
 * @param {RenderedRoll[]|RenderedRoll[][]} renderedRolls
 */
export function renderResult(renderedRolls) {
  const isRepeated = isRepeatedRolls(renderedRolls);
  const rolls = Array.isArray(renderedRolls) ? renderedRolls : [];

  if (isRepeated) {
    dom.resultFormula.hidden = true;
    dom.resultBreakdown.hidden = true;
    dom.resultTotalRow.hidden = true;
    dom.resultMulti.hidden = false;
    dom.resultMulti.classList.remove('is-two-up');
    dom.resultMulti.classList.remove('has-centered-tail');
    clearElement(dom.resultMulti);

    rolls.forEach((repeatRolls, index) => {
      dom.resultMulti.appendChild(createRepeatBlock(repeatRolls, index));
    });

    dom.resultSection.hidden = false;
    dom.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  const hasCenteredTail = rolls.length > 2 && rolls.length % 2 === 1;
  dom.resultMulti.classList.toggle('is-two-up', rolls.length > 1);
  dom.resultMulti.classList.toggle('has-centered-tail', hasCenteredTail);

  if (rolls.length === 1) {
    dom.resultFormula.hidden = false;
    dom.resultBreakdown.hidden = false;
    dom.resultTotalRow.hidden = false;
    dom.resultMulti.hidden = true;
    clearElement(dom.resultMulti);

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
    clearElement(dom.resultMulti);

    rolls.forEach((entry, index) => {
      if (index > 0) {
        const separator = document.createElement('div');
        separator.className = 'result-separator';
        dom.resultMulti.appendChild(separator);
      }

      dom.resultMulti.appendChild(
        hasCenteredTail && index === rolls.length - 1
          ? createCenteredTailRow(entry.result)
          : createResultSubBlock(entry.result)
      );
    });
  }

  dom.resultSection.hidden = false;
  dom.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
