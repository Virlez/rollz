export type AdvantageMode = 'none' | 'advantage' | 'disadvantage';

export type DiceToken = {
  type: 'dice';
  count: number;
  sides: number;
  raw: string;
  successThreshold?: number;
  rerollAtOrBelow?: number;
};

export type ModifierToken = {
  type: 'modifier';
  value: number;
  raw: string;
};

export type Token = DiceToken | ModifierToken;

export type ParsedFormula = {
  formula: string;
  tokens: Token[];
};

export type RollRequest = {
  repeatCount: number;
  formulas: ParsedFormula[];
};

export type RollMode = {
  advantageMode: AdvantageMode;
  successMode: boolean;
};

export type TokenResult = {
  finalRolls: number[];
  originalRolls: number[];
  rerollMask: boolean[];
  successMatches: boolean[];
  successCount: number;
  bonusRolls: number[];
  ignored: boolean;
  subtotal: number;
  advantagePair?: [number, number];
  keptFirst?: number;
  discardedFirst?: number;
  restDrawn?: number[];
};

export type RollResult = {
  total: number;
  tokens: Token[];
  tokenResults: Array<TokenResult | null>;
  advantageMode: AdvantageMode;
  successMode: boolean;
  totalKind: 'total' | 'successes';
  criticalFailure?: boolean;
  successBonusCount?: number;
  randomSource?: 'randomorg' | 'crypto';
};

export type RollExecution = {
  formula: string;
  result: RollResult;
};

export type RollBatch = {
  input: string;
  request: RollRequest;
  mode: RollMode;
  executions: RollExecution[];
};

export type RollLimits = {
  maxRepeatCount: number;
  maxFormulasPerRequest: number;
  maxDicePerFormula: number;
  maxInputLength: number;
};

export type DrawNumbers = (count: number, sides: number) => Promise<number[]>;

export type RandomNumberSource = {
  getRandomNumbers: DrawNumbers;
  getSource: () => 'randomorg' | 'crypto';
};