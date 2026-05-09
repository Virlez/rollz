import { type RollLimits } from '@rollz/core';
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
export declare function loadConfig(): BotConfig;
