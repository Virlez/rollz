import type { RollBatch, RollLimits, RollMode } from './types.js';
export declare function executeRoll(input: string, mode?: Partial<RollMode>, limits?: Partial<RollLimits>): Promise<RollBatch>;
