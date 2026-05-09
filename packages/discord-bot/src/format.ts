import { describeFormula, type RollBatch, type RollExecution, type RollMode, type Token, type TokenResult } from '@rollz/core';
import { EmbedBuilder } from 'discord.js';

function renderMode(mode: RollMode): string {
  if (mode.successMode) return 'success';
  if (mode.advantageMode === 'advantage') return 'advantage';
  if (mode.advantageMode === 'disadvantage') return 'disadvantage';
  return 'normal';
}

function formatDieToken(token: Extract<Token, { type: 'dice' }>, detail: TokenResult, successMode: boolean): string {
  if (successMode) {
    const rolls = detail.finalRolls.map((value, index) => `${value}${detail.successMatches[index] ? '✓' : '✗'}`);
    const bonus = detail.bonusRolls.length > 0
      ? ` | bonus ${detail.bonusRolls.map(value => `${value}${value % 2 === 0 ? '✓' : '✗'}`).join(', ')}`
      : '';
    if (detail.ignored) {
      return `${token.raw}: ignored`;
    }
    return `${token.raw}: ${rolls.join(', ')}${bonus} => ${detail.subtotal} successes`;
  }

  if (detail.advantagePair) {
    const [firstRoll, secondRoll] = detail.advantagePair;
    const kept = detail.keptFirst;
    const discarded = detail.discardedFirst;
    const rest = detail.restDrawn && detail.restDrawn.length > 0 ? `, rest ${detail.restDrawn.join(', ')}` : '';
    return `${token.raw}: ${kept} kept, ${discarded} discarded (pair ${firstRoll}/${secondRoll})${rest} => ${detail.subtotal}`;
  }

  const pieces = detail.finalRolls.map((value, index) => {
    if (detail.rerollMask[index] && detail.originalRolls[index] !== undefined) {
      return `${detail.originalRolls[index]}→${value}`;
    }
    if (token.successThreshold !== undefined) {
      return `${value}${detail.successMatches[index] ? '✓' : '✗'}`;
    }
    return String(value);
  });

  const suffix = token.successThreshold !== undefined ? ` => ${detail.subtotal} successes` : ` => ${detail.subtotal}`;
  return `${token.raw}: ${pieces.join(', ')}${suffix}`;
}

function formatModifierToken(token: Extract<Token, { type: 'modifier' }>): string {
  return `modifier: ${token.value >= 0 ? `+${token.value}` : token.value}`;
}

function formatExecution(execution: RollExecution): string {
  const lines = execution.result.tokens.flatMap((token, index) => {
    if (token.type === 'modifier') {
      return formatModifierToken(token);
    }

    const detail = execution.result.tokenResults[index];
    if (!detail) return `${token.raw}: no details`;
    return formatDieToken(token, detail, execution.result.successMode);
  });

  if (execution.result.criticalFailure) {
    lines.push('critical failure');
  }

  if (execution.result.randomSource === 'crypto') {
    lines.push('fallback random source: crypto');
  }

  lines.push(`total: ${execution.result.total}`);
  return lines.join('\n');
}

function buildFieldName(batch: RollBatch, execution: RollExecution, index: number): string {
  if (batch.request.repeatCount <= 1) {
    return `${index + 1}. ${execution.formula}`;
  }

  const formulasPerRepeat = batch.request.formulas.length;
  const repetition = Math.floor(index / formulasPerRepeat) + 1;
  const formulaIndex = (index % formulasPerRepeat) + 1;
  return `R${repetition} · F${formulaIndex} · ${execution.formula}`;
}

export function buildRollEmbed(batch: RollBatch, title: string, requestedBy: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription([
      `Input: ${batch.input}`,
      `Parsed: ${describeFormula(batch.request.formulas[0]?.tokens ?? [])}${batch.request.formulas.length > 1 ? ` + ${batch.request.formulas.length - 1} other formula(s)` : ''}`,
      `Mode: ${renderMode(batch.mode)}`,
    ].join('\n'))
    .addFields(batch.executions.map((execution: RollExecution, index: number) => ({
      name: buildFieldName(batch, execution, index),
      value: formatExecution(execution),
    })))
    .setFooter({ text: `Demandé par ${requestedBy}` })
    .setTimestamp(new Date());

  return embed;
}