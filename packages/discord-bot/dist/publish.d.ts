import type { ChatInputCommandInteraction, MessageCreateOptions } from 'discord.js';
import type { BotConfig } from './config.js';
type RollVisibility = 'public' | 'private';
export declare function publishResponse(interaction: ChatInputCommandInteraction, payload: MessageCreateOptions, config: BotConfig, visibility?: RollVisibility): Promise<void>;
export {};
