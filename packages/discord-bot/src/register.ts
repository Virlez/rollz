import { REST, Routes } from 'discord.js';
import type { BotConfig } from './config.js';
import { commandDefinitions } from './commands.js';

export async function registerCommands(config: BotConfig): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(config.token);
  const body = commandDefinitions.map(command => command.toJSON());

  if (config.guildId) {
    await rest.put(Routes.applicationGuildCommands(config.applicationId, config.guildId), { body });
    return;
  }

  await rest.put(Routes.applicationCommands(config.applicationId), { body });
}