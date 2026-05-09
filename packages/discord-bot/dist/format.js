import { describeFormula } from '@rollz/core';
import { EmbedBuilder } from 'discord.js';
function renderMode(mode) {
    if (mode.successMode)
        return 'succès';
    if (mode.advantageMode === 'advantage')
        return 'avantage';
    if (mode.advantageMode === 'disadvantage')
        return 'désavantage';
    return 'normal';
}
function wrapChip(value, classes = []) {
    if (classes.includes('discarded'))
        return `~~${value}~~`;
    if (classes.includes('kept'))
        return `**${value}**`;
    if (classes.includes('success'))
        return `**${value}**✓`;
    if (classes.includes('failure'))
        return `${value}✗`;
    if (classes.includes('max'))
        return `**${value}**`;
    if (classes.includes('min'))
        return `_${value}_`;
    return value;
}
function classifyBaseRoll(value, sides) {
    const classes = [];
    if (value === sides)
        classes.push('max');
    if (value === 1)
        classes.push('min');
    return classes;
}
function formatFormulaHeader(execution) {
    return describeFormula(execution.result.tokens);
}
function formatKeptLabel(execution) {
    if (execution.result.advantageMode === 'advantage')
        return 'gardé (avantage)';
    if (execution.result.advantageMode === 'disadvantage')
        return 'gardé (désavantage)';
    return 'gardé';
}
function formatDieToken(token, detail, successMode, execution) {
    if (successMode) {
        const rolls = detail.finalRolls.map((value, index) => wrapChip(String(value), [detail.successMatches[index] ? 'success' : 'failure', ...classifyBaseRoll(value, token.sides)]));
        const bonus = detail.bonusRolls.length > 0
            ? `\n🎁 bonus: ${detail.bonusRolls.map(value => wrapChip(String(value), [value % 2 === 0 ? 'success' : 'failure', ...classifyBaseRoll(value, token.sides)])).join(' • ')}`
            : '';
        if (detail.ignored) {
            return `🎲 **${token.raw}**\nignoré`;
        }
        return `🎲 **${token.raw}**\n${rolls.join(' • ')}${bonus}\nΣ **${detail.subtotal}** succès`;
    }
    if (detail.advantagePair) {
        const [firstRoll, secondRoll] = detail.advantagePair;
        const kept = wrapChip(String(detail.keptFirst), ['kept', ...classifyBaseRoll(detail.keptFirst ?? firstRoll, token.sides)]);
        const discardedValue = firstRoll === secondRoll
            ? null
            : wrapChip(String(detail.discardedFirst), ['discarded', ...classifyBaseRoll(detail.discardedFirst ?? secondRoll, token.sides)]);
        const rest = detail.restDrawn && detail.restDrawn.length > 0
            ? `\n  autres: ${detail.restDrawn.map(value => wrapChip(String(value), classifyBaseRoll(value, token.sides))).join(' • ')}`
            : '';
        return [
            `🎲 **${token.raw}**`,
            `${formatKeptLabel(execution)}: ${kept}`,
            discardedValue ? `écarté: ${discardedValue}` : null,
            rest ? rest.trimStart() : null,
            `= **${detail.subtotal}**`,
        ].filter(Boolean).join('\n');
    }
    const pieces = detail.finalRolls.map((value, index) => {
        if (detail.rerollMask[index] && detail.originalRolls[index] !== undefined) {
            return `${wrapChip(String(detail.originalRolls[index]), ['discarded', ...classifyBaseRoll(detail.originalRolls[index], token.sides)])}→${wrapChip(String(value), token.successThreshold !== undefined ? [detail.successMatches[index] ? 'success' : 'failure', ...classifyBaseRoll(value, token.sides)] : classifyBaseRoll(value, token.sides))}`;
        }
        if (token.successThreshold !== undefined) {
            return wrapChip(String(value), [detail.successMatches[index] ? 'success' : 'failure', ...classifyBaseRoll(value, token.sides)]);
        }
        return wrapChip(String(value), classifyBaseRoll(value, token.sides));
    });
    const suffix = token.successThreshold !== undefined ? `${detail.subtotal} succès` : String(detail.subtotal);
    return `🎲 **${token.raw}**\n${pieces.join(' • ')}\nΣ **${suffix}**`;
}
function formatModifierToken(token) {
    return token.value >= 0
        ? `➕ **${token.value}**`
        : `➖ **${Math.abs(token.value)}**`;
}
function formatExecution(execution, compact = false) {
    const groups = execution.result.tokens.flatMap((token, index) => {
        if (token.type === 'modifier') {
            return formatModifierToken(token);
        }
        const detail = execution.result.tokenResults[index];
        if (!detail)
            return `🎲 **${token.raw}**\naucun détail`;
        return formatDieToken(token, detail, execution.result.successMode, execution);
    });
    const totalLabel = execution.result.totalKind === 'successes' || execution.result.successMode ? 'Succès' : 'Total';
    const notes = [];
    if (execution.result.criticalFailure) {
        notes.push('💥 échec critique');
    }
    if (execution.result.randomSource === 'crypto') {
        notes.push('🛟 source aléatoire de secours: crypto');
    }
    if (compact) {
        return [
            `\`${formatFormulaHeader(execution)}\``,
            groups.join(' · '),
            `🏁 **${execution.result.total}**`,
            ...(notes.length > 0 ? [notes.join(' · ')] : []),
        ].join('\n');
    }
    return [
        `\`${formatFormulaHeader(execution)}\``,
        groups.join('\n'),
        `🏁 **${totalLabel}: ${execution.result.total}**`,
        ...(notes.length > 0 ? [notes.join('\n')] : []),
    ].join('\n\n');
}
function buildFieldName(batch, execution, index) {
    if (batch.executions.length === 1) {
        return execution.formula;
    }
    if (batch.request.repeatCount <= 1) {
        return `${index + 1}. ${execution.formula}`;
    }
    const formulasPerRepeat = batch.request.formulas.length;
    const repetition = Math.floor(index / formulasPerRepeat) + 1;
    const formulaIndex = (index % formulasPerRepeat) + 1;
    return `R${repetition} · F${formulaIndex} · ${execution.formula}`;
}
export function buildRollEmbed(batch, title, requestedBy) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription([
        `Input: ${batch.input}`,
        `Mode: ${renderMode(batch.mode)}`,
        batch.request.repeatCount > 1 ? `Repeats: ${batch.request.repeatCount}` : null,
    ].join('\n'))
        .addFields(batch.executions.map((execution, index) => ({
        name: buildFieldName(batch, execution, index),
        value: `\`\`\`md\n${formatExecution(execution)}\n\`\`\``,
    })))
        .setFooter({ text: `Demandé par ${requestedBy}` })
        .setTimestamp(new Date());
    return embed;
}
export function buildRollMessage(batch, title, requestedBy) {
    const useInlineResults = batch.executions.length > 1 && batch.executions.length <= 4;
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setFooter({ text: `Demandé par ${requestedBy}` })
        .setTimestamp(new Date());
    if (batch.request.repeatCount > 1) {
        embed.setDescription(`**Répétitions**: ${batch.request.repeatCount}`);
    }
    embed.addFields(batch.executions.map((execution, index) => ({
        name: buildFieldName(batch, execution, index),
        value: formatExecution(execution, useInlineResults),
        inline: useInlineResults,
    })));
    return {
        embeds: [embed],
    };
}
