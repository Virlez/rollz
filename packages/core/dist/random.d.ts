import type { RandomNumberSource } from './types.js';
export declare function fetchFromRandomOrg(count: number, min: number, max: number): Promise<number[]>;
export declare function getCryptoRandomNumbers(count: number, sides: number): number[];
export declare function createRandomNumberSource(): RandomNumberSource;
