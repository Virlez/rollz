import type { ChatInputCommandInteraction, MessageCreateOptions } from 'discord.js';
import type { BotConfig } from './config.js';
export declare function publishResponse(interaction: ChatInputCommandInteraction, payload: MessageCreateOptions, config: BotConfig): Promise<void>;
