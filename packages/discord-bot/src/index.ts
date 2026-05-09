import { Client, GatewayIntentBits } from 'discord.js';
import { loadConfig } from './config.js';
import { FavoritesStore } from './favorites-store.js';
import { handleFavoriteAutocomplete, handleFavoriteCommand, handleRollCommand, handleStatusCommand } from './handlers.js';

async function main(): Promise<void> {
  const config = loadConfig();

  const favoritesStore = new FavoritesStore(config.favoritesFilePath);
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('clientReady', () => {
    console.log(`Rollz Discord bot connected as ${client.user?.tag ?? 'unknown user'}`);
  });

  client.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete()) {
      await handleFavoriteAutocomplete(interaction, favoritesStore);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'roll') {
      await handleRollCommand(interaction, config);
      return;
    }

    if (interaction.commandName === 'favorite') {
      await handleFavoriteCommand(interaction, config, favoritesStore);
      return;
    }

    if (interaction.commandName === 'rollz') {
      await handleStatusCommand(interaction, config, favoritesStore);
    }
  });

  await client.login(config.token);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});