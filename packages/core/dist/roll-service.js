import { evaluateTokens } from './engine.js';
import { parseAndValidateRollRequest } from './limits.js';
import { normalizeRollMode } from './parser.js';
import { createRandomNumberSource } from './random.js';
export async function executeRoll(input, mode = {}, limits = {}) {
    const normalizedMode = normalizeRollMode(mode);
    const request = parseAndValidateRollRequest(input, limits);
    const randomSource = createRandomNumberSource();
    const executions = [];
    for (let repeatIndex = 0; repeatIndex < request.repeatCount; repeatIndex += 1) {
        for (const formula of request.formulas) {
            const result = await evaluateTokens(formula.tokens, {
                advantageMode: normalizedMode.advantageMode,
                successMode: normalizedMode.successMode,
                drawNumbers: randomSource.getRandomNumbers,
            });
            result.randomSource = randomSource.getSource();
            executions.push({
                formula: formula.formula,
                result,
            });
        }
    }
    return {
        input,
        request,
        mode: normalizedMode,
        executions,
    };
}
