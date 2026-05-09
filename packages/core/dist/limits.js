import { DEFAULT_MAX_DICE_PER_FORMULA, DEFAULT_MAX_FORMULAS_PER_REQUEST, DEFAULT_MAX_INPUT_LENGTH, DEFAULT_MAX_REPEAT_COUNT, } from './constants.js';
import { analyzeFormulas, parseRollRequest } from './parser.js';
export class RollValidationError extends Error {
}
export function resolveLimits(overrides = {}) {
    return {
        maxRepeatCount: overrides.maxRepeatCount ?? DEFAULT_MAX_REPEAT_COUNT,
        maxFormulasPerRequest: overrides.maxFormulasPerRequest ?? DEFAULT_MAX_FORMULAS_PER_REQUEST,
        maxDicePerFormula: overrides.maxDicePerFormula ?? DEFAULT_MAX_DICE_PER_FORMULA,
        maxInputLength: overrides.maxInputLength ?? DEFAULT_MAX_INPUT_LENGTH,
    };
}
export function validateRollRequest(request, limits = {}) {
    const resolved = resolveLimits(limits);
    if (request.repeatCount > resolved.maxRepeatCount) {
        throw new RollValidationError(`Repeat count exceeds the limit of ${resolved.maxRepeatCount}.`);
    }
    if (request.formulas.length > resolved.maxFormulasPerRequest) {
        throw new RollValidationError(`Formula count exceeds the limit of ${resolved.maxFormulasPerRequest}.`);
    }
    for (const formula of request.formulas) {
        const analysis = analyzeFormulas([formula]);
        if (analysis.totalDiceCount > resolved.maxDicePerFormula) {
            throw new RollValidationError(`Dice count exceeds the limit of ${resolved.maxDicePerFormula} for formula ${formula.formula}.`);
        }
    }
    return request;
}
export function parseAndValidateRollRequest(rawInput, limits = {}) {
    const resolved = resolveLimits(limits);
    const trimmed = rawInput.trim();
    if (!trimmed) {
        throw new RollValidationError('Formula is required.');
    }
    if (trimmed.length > resolved.maxInputLength) {
        throw new RollValidationError(`Formula length exceeds the limit of ${resolved.maxInputLength} characters.`);
    }
    const request = parseRollRequest(trimmed);
    if (!request) {
        throw new RollValidationError('Formula is not recognized.');
    }
    return validateRollRequest(request, resolved);
}
