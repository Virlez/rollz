import { type ChatInputCommandInteraction } from 'discord.js';
import type { BotConfig } from './config.js';
import type { FavoritesStore } from './favorites-store.js';
export declare function handleRollCommand(interaction: ChatInputCommandInteraction, config: BotConfig): Promise<void>;
export declare function handleFavoriteCommand(interaction: ChatInputCommandInteraction, config: BotConfig, favoritesStore: FavoritesStore): Promise<void>;
