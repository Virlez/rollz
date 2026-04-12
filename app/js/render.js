import { dom } from './dom.js';
import { t } from './i18n.js';
import { describeFormula } from './parser.js';

/**
 * @param {any} result
 * @param {{
 *   formula: HTMLElement,
 *   breakdown: HTMLElement,
 *   totalLabel: HTMLElement,
 *   total: HTMLElement,
 *   totalNote: HTMLElement,
 *   sourceNote: HTMLElement,
 * }} target
 */
export function renderSingleResult(result, target) {
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
  if (advantageMode === 'advantage') formulaStr += '  ' + t('advantageTag');
  if (advantageMode === 'disadvantage') formulaStr += '  ' + t('disadvantageTag');
  if (successMode) formulaStr += '  ' + t('successTag');
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
          drawn.forEach((value, index) => {
            const chip = document.createElement('div');
            chip.className = 'die-result';
            chip.classList.add(value % 2 === 0 ? 'is-success' : 'is-failure');
            if (value === token.sides) chip.classList.add('is-max');
            if (value === 1) chip.classList.add('is-min');
            chip.textContent = String(value);
            chip.style.animationDelay = `${(rollIndex + index) * 60}ms`;
            diceRow.appendChild(chip);
          });

          if (successBonusRolls && successBonusRolls.length > 0) {
            const bonusRow = document.createElement('div');
            bonusRow.className = 'breakdown-dice breakdown-bonus';

            successBonusRolls.forEach((value, index) => {
              const chip = document.createElement('div');
              chip.className = 'die-result';
              chip.classList.add(value % 2 === 0 ? 'is-success' : 'is-failure');
              if (value === token.sides) chip.classList.add('is-max');
              if (value === 1) chip.classList.add('is-min');
              chip.textContent = String(value);
              chip.style.animationDelay = `${(rollIndex + drawn.length + index) * 60}ms`;
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
          pairs.restDrawn.forEach((value, index) => {
            const chip = document.createElement('div');
            chip.className = 'die-result';
            if (value === token.sides) chip.classList.add('is-max');
            if (value === 1) chip.classList.add('is-min');
            chip.textContent = String(value);
            chip.style.animationDelay = `${(animOffset + index) * 60}ms`;
            diceRow.appendChild(chip);
          });
        } else {
          drawn.forEach((value, index) => {
            const chip = document.createElement('div');
            chip.className = 'die-result';
            if (value === token.sides) chip.classList.add('is-max');
            if (value === 1) chip.classList.add('is-min');
            chip.textContent = String(value);
            chip.style.animationDelay = `${(rollIndex + index) * 60}ms`;
            diceRow.appendChild(chip);
          });
        }

        group.appendChild(diceRow);

        if (drawn.length > 1) {
          const sub = document.createElement('div');
          sub.className = 'breakdown-subtotal';
          const sum = drawn.reduce((left, right) => left + right, 0);
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
 * @param {any} result
 * @returns {HTMLElement}
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

/**
 * @param {Array<{ formula: string, result: any }>} renderedRolls
 */
export function renderResult(renderedRolls) {
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
