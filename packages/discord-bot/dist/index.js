import { Client, GatewayIntentBits } from 'discord.js';
import { loadConfig } from './config.js';
import { FavoritesStore } from './favorites-store.js';
import { GuildConfigStore } from './guild-config-store.js';
import { handleFavoriteAutocomplete, handleFavoriteCommand, handleHelpCommand, handleRollCommand, handleStatusCommand } from './handlers.js';
async function main() {
    const config = loadConfig();
    const favoritesStore = new FavoritesStore(config.favoritesFilePath);
    const guildConfigStore = new GuildConfigStore(config.favoritesFilePath);
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    client.once('clientReady', () => {
        console.log(`Rollz Discord bot connected as ${client.user?.tag ?? 'unknown user'}`);
    });
    client.on('interactionCreate', async (interaction) => {
        if (interaction.isAutocomplete()) {
            await handleFavoriteAutocomplete(interaction, favoritesStore);
            return;
        }
        if (!interaction.isChatInputCommand())
            return;
        if (interaction.commandName === 'roll') {
            await handleRollCommand(interaction, config, guildConfigStore);
            return;
        }
        if (interaction.commandName === 'favorite') {
            await handleFavoriteCommand(interaction, config, favoritesStore, guildConfigStore);
            return;
        }
        if (interaction.commandName === 'help') {
            await handleHelpCommand(interaction);
            return;
        }
        if (interaction.commandName === 'rollz') {
            await handleStatusCommand(interaction, config, favoritesStore, guildConfigStore);
        }
    });
    await client.login(config.token);
}
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
