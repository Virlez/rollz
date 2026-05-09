import type { RollLimits, RollRequest } from './types.js';
export declare class RollValidationError extends Error {
}
export declare function resolveLimits(overrides?: Partial<RollLimits>): RollLimits;
export declare function validateRollRequest(request: RollRequest, limits?: Partial<RollLimits>): RollRequest;
export declare function parseAndValidateRollRequest(rawInput: string, limits?: Partial<RollLimits>): RollRequest;
