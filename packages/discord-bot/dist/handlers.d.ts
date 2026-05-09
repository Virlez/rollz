import { type AutocompleteInteraction, type ChatInputCommandInteraction } from 'discord.js';
import type { BotConfig } from './config.js';
import type { FavoritesStore } from './favorites-store.js';
import type { GuildConfigStore } from './guild-config-store.js';
export declare function handleStatusCommand(interaction: ChatInputCommandInteraction, config: BotConfig, favoritesStore: FavoritesStore, guildConfigStore: GuildConfigStore): Promise<void>;
export declare function handleFavoriteAutocomplete(interaction: AutocompleteInteraction, favoritesStore: FavoritesStore): Promise<void>;
export declare function handleHelpCommand(interaction: ChatInputCommandInteraction): Promise<void>;
export declare function handleRollCommand(interaction: ChatInputCommandInteraction, config: BotConfig, guildConfigStore: GuildConfigStore): Promise<void>;
export declare function handleFavoriteCommand(interaction: ChatInputCommandInteraction, config: BotConfig, favoritesStore: FavoritesStore, guildConfigStore: GuildConfigStore): Promise<void>;
