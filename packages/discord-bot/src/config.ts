import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { resolveLimits, type RollLimits } from '@rollz/core';

const currentDir = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(currentDir, '../../../.env'), quiet: true });

export type PublishMode = 'invocation' | 'dedicated' | 'both';

export type BotConfig = {
  token: string;
  applicationId: string;
  guildId?: string;
  publishMode: PublishMode;
  dedicatedChannelId?: string;
  favoritesFilePath: string;
  limits: RollLimits;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePublishMode(value: string | undefined): PublishMode {
  if (value === 'dedicated' || value === 'both') return value;
  return 'invocation';
}

function parseNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(): BotConfig {
  const publishMode = parsePublishMode(process.env.ROLLZ_PUBLISH_MODE);
  const dedicatedChannelId = process.env.ROLLZ_DEDICATED_CHANNEL_ID?.trim();

  if ((publishMode === 'dedicated' || publishMode === 'both') && !dedicatedChannelId) {
    throw new Error('ROLLZ_DEDICATED_CHANNEL_ID est requis quand le mode de publication est dedicated ou both.');
  }

  return {
    token: requireEnv('DISCORD_TOKEN'),
    applicationId: requireEnv('DISCORD_APPLICATION_ID'),
    guildId: process.env.DISCORD_GUILD_ID?.trim() || undefined,
    publishMode,
    dedicatedChannelId,
    favoritesFilePath: process.env.ROLLZ_FAVORITES_FILE?.trim() || '/data/favorites.db',
    limits: resolveLimits({
      maxRepeatCount: parseNumber('ROLLZ_MAX_REPEAT_COUNT', 20),
      maxFormulasPerRequest: parseNumber('ROLLZ_MAX_FORMULAS_PER_REQUEST', 10),
      maxDicePerFormula: parseNumber('ROLLZ_MAX_DICE_PER_FORMULA', 100),
      maxInputLength: parseNumber('ROLLZ_MAX_INPUT_LENGTH', 500),
    }),
  };
}