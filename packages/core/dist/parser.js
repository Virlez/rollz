const TOKEN_RE = /([+-]?)(\d*)d(\d+)((?:(?:>=\d+)|(?:R\d+))*)|([+-]?\d+)/gi;
const DICE_SUFFIX_RE = /(>=)(\d+)|(R)(\d+)/gi;
const REPEAT_PREFIX_RE = /^(\d+)x\s*(.+)$/i;
function parseDiceSuffix(suffix, sides) {
    if (!suffix)
        return {};
    DICE_SUFFIX_RE.lastIndex = 0;
    let cursor = 0;
    const parsed = {};
    let match;
    while ((match = DICE_SUFFIX_RE.exec(suffix)) !== null) {
        if (match.index !== cursor)
            return null;
        if (match[1]) {
            if (parsed.successThreshold !== undefined)
                return null;
            const threshold = Number.parseInt(match[2], 10);
            if (!Number.isInteger(threshold) || threshold < 1)
                return null;
            parsed.successThreshold = threshold;
        }
        else if (match[3]) {
            if (parsed.rerollAtOrBelow !== undefined)
                return null;
            const rerollAtOrBelow = Number.parseInt(match[4], 10);
            if (!Number.isInteger(rerollAtOrBelow) || rerollAtOrBelow < 1 || rerollAtOrBelow > sides)
                return null;
            parsed.rerollAtOrBelow = rerollAtOrBelow;
        }
        cursor = DICE_SUFFIX_RE.lastIndex;
    }
    if (cursor !== suffix.length)
        return null;
    return parsed;
}
function describeToken(token, index) {
    if (token.type === 'modifier') {
        if (token.raw.startsWith('+'))
            return `+ ${token.raw.slice(1)}`;
        if (token.raw.startsWith('-'))
            return `− ${token.raw.slice(1)}`;
        return token.raw;
    }
    const raw = token.raw.startsWith('+')
        ? `+ ${token.raw.slice(1)}`
        : token.raw.startsWith('-')
            ? `− ${token.raw.slice(1)}`
            : token.raw;
    if (index === 0 && raw.startsWith('+ '))
        return raw.slice(2);
    return raw;
}
export function parseFormula(formula) {
    const tokens = [];
    const str = formula.replace(/\s+/g, '');
    if (!str)
        return tokens;
    let match;
    let cursor = 0;
    TOKEN_RE.lastIndex = 0;
    while ((match = TOKEN_RE.exec(str)) !== null) {
        if (match.index !== cursor)
            return [];
        if (match[3] !== undefined) {
            const sign = match[1] === '-' ? -1 : 1;
            const count = match[2] ? Number.parseInt(match[2], 10) : 1;
            const sides = Number.parseInt(match[3], 10);
            const suffix = match[4] || '';
            if (sides < 1 || count < 1)
                return [];
            const suffixData = parseDiceSuffix(suffix, sides);
            if (!suffixData)
                return [];
            tokens.push({
                type: 'dice',
                count: sign * count,
                sides,
                raw: match[0],
                ...suffixData,
            });
        }
        else if (match[5] !== undefined) {
            const value = Number.parseInt(match[5], 10);
            if (Number.isNaN(value))
                return [];
            tokens.push({ type: 'modifier', value, raw: match[0] });
        }
        cursor = TOKEN_RE.lastIndex;
    }
    if (cursor !== str.length)
        return [];
    if (!tokens.some(token => token.type === 'dice'))
        return [];
    return tokens;
}
export function parseFormulaInput(formulaInput) {
    const parts = formulaInput
        .split(';')
        .map(part => part.trim());
    if (parts.length === 0 || parts.some(part => !part))
        return [];
    const parsed = parts.map(formula => ({ formula, tokens: parseFormula(formula) }));
    if (parsed.some(entry => entry.tokens.length === 0))
        return [];
    return parsed;
}
export function parseRollRequest(rawInput) {
    const raw = typeof rawInput === 'string' ? rawInput.trim() : '';
    if (!raw)
        return null;
    let repeatCount = 1;
    let formulaInput = raw;
    const repeatMatch = raw.match(REPEAT_PREFIX_RE);
    if (repeatMatch) {
        repeatCount = Number.parseInt(repeatMatch[1], 10);
        if (!Number.isInteger(repeatCount) || repeatCount < 1)
            return null;
        formulaInput = repeatMatch[2].trim();
        if (!formulaInput)
            return null;
    }
    const formulas = parseFormulaInput(formulaInput);
    if (formulas.length === 0)
        return null;
    return {
        repeatCount,
        formulas,
    };
}
export function describeFormula(tokens) {
    return tokens.map((token, index) => describeToken(token, index)).join('  ');
}
export function describeFormulaInput(formulas) {
    return formulas.map(entry => describeFormula(entry.tokens)).join('  ;  ');
}
export function describeRollRequest(request) {
    const formulaDescription = describeFormulaInput(request.formulas);
    return request.repeatCount > 1
        ? `${request.repeatCount}x ${formulaDescription}`
        : formulaDescription;
}
export function analyzeFormulas(formulas) {
    const firstTokens = formulas[0] ? formulas[0].tokens : [];
    const diceTokens = firstTokens.filter((token) => token.type === 'dice');
    const allDiceTokens = formulas.flatMap(entry => entry.tokens).filter((token) => token.type === 'dice');
    const firstHasInlineAdvanced = diceTokens.some(token => token.successThreshold !== undefined || token.rerollAtOrBelow !== undefined);
    const firstHasInlineThreshold = diceTokens.some(token => token.successThreshold !== undefined);
    return {
        firstTokens,
        diceTokens,
        totalDiceCount: diceTokens.reduce((sum, token) => sum + Math.abs(token.count), 0),
        hasModifiers: firstTokens.some(token => token.type === 'modifier'),
        hasInlineAdvanced: allDiceTokens.some(token => token.successThreshold !== undefined || token.rerollAtOrBelow !== undefined),
        hasInlineThreshold: allDiceTokens.some(token => token.successThreshold !== undefined),
        hasInlineReroll: allDiceTokens.some(token => token.rerollAtOrBelow !== undefined),
        firstHasInlineAdvanced,
        firstHasInlineThreshold,
    };
}
export function normalizeRollMode(mode) {
    return {
        advantageMode: mode?.advantageMode === 'advantage' || mode?.advantageMode === 'disadvantage'
            ? mode.advantageMode
            : 'none',
        successMode: mode?.successMode === true,
    };
}
