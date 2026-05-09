import type { DrawNumbers, RollResult, Token } from './types.js';
export declare function evaluateTokens(tokens: Token[], options: {
    advantageMode?: 'none' | 'advantage' | 'disadvantage';
    successMode?: boolean;
    drawNumbers: DrawNumbers;
}): Promise<RollResult>;
