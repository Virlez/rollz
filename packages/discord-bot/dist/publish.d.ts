import type { ChatInputCommandInteraction, MessageCreateOptions } from 'discord.js';
import type { BotConfig } from './config.js';
import type { GuildConfigStore } from './guild-config-store.js';
type RollVisibility = 'public' | 'private';
export declare function publishResponse(interaction: ChatInputCommandInteraction, payload: MessageCreateOptions, config: BotConfig, guildConfigStore: GuildConfigStore, visibility?: RollVisibility): Promise<void>;
export {};
