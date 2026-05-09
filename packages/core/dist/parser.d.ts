import type { ParsedFormula, RollMode, RollRequest, Token } from './types.js';
export declare function parseFormula(formula: string): Token[];
export declare function parseFormulaInput(formulaInput: string): ParsedFormula[];
export declare function parseRollRequest(rawInput: string): RollRequest | null;
export declare function describeFormula(tokens: Token[]): string;
export declare function describeFormulaInput(formulas: ParsedFormula[]): string;
export declare function describeRollRequest(request: RollRequest): string;
export declare function analyzeFormulas(formulas: ParsedFormula[]): {
    firstTokens: Token[];
    diceTokens: import("./types.js").DiceToken[];
    totalDiceCount: number;
    hasModifiers: boolean;
    hasInlineAdvanced: boolean;
    hasInlineThreshold: boolean;
    hasInlineReroll: boolean;
    firstHasInlineAdvanced: boolean;
    firstHasInlineThreshold: boolean;
};
export declare function normalizeRollMode(mode: Partial<RollMode> | undefined): RollMode;
