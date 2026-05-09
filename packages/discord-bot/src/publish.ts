import type { ChatInputCommandInteraction, MessageCreateOptions } from 'discord.js';
import type { BotConfig, PublishMode } from './config.js';
import type { GuildConfigStore } from './guild-config-store.js';

type RollVisibility = 'public' | 'private';

async function resolveDedicatedChannel(interaction: ChatInputCommandInteraction, channelId: string) {
  const channel = await interaction.client.channels.fetch(channelId);
  if (!channel || !('send' in channel)) {
    return null;
  }
  return channel;
}

async function resolveConfiguredDedicatedChannelId(
  interaction: ChatInputCommandInteraction,
  config: BotConfig,
  guildConfigStore: GuildConfigStore,
): Promise<string | undefined> {
  if (!interaction.guildId) {
    return config.dedicatedChannelId;
  }

  const guildConfig = await guildConfigStore.get(interaction.guildId);
  return guildConfig?.dedicatedChannelId ?? config.dedicatedChannelId;
}

async function resolveConfiguredPublishMode(
  interaction: ChatInputCommandInteraction,
  config: BotConfig,
  guildConfigStore: GuildConfigStore,
): Promise<PublishMode> {
  if (!interaction.guildId) {
    return config.publishMode;
  }

  const guildConfig = await guildConfigStore.get(interaction.guildId);
  return guildConfig?.publishMode ?? config.publishMode;
}

export async function publishResponse(
  interaction: ChatInputCommandInteraction,
  payload: MessageCreateOptions,
  config: BotConfig,
  guildConfigStore: GuildConfigStore,
  visibility: RollVisibility = 'public',
): Promise<void> {
  if (visibility === 'private') {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ ...payload, flags: undefined, ephemeral: true });
    } else {
      await interaction.reply({ ...payload, flags: undefined, ephemeral: true });
    }
    return;
  }

  const mode = await resolveConfiguredPublishMode(interaction, config, guildConfigStore);
  const replyPayload = { ...payload, flags: undefined };
  const dedicatedChannelId = (mode === 'dedicated' || mode === 'both')
    ? await resolveConfiguredDedicatedChannelId(interaction, config, guildConfigStore)
    : undefined;

  if (mode === 'invocation' || mode === 'both') {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(replyPayload);
    } else {
      await interaction.reply(replyPayload);
    }
  } else {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: 'Jet publié dans le salon dédié.' });
    } else {
      await interaction.reply({ content: 'Jet publié dans le salon dédié.', ephemeral: true });
    }
  }

  if ((mode === 'dedicated' || mode === 'both') && !dedicatedChannelId) {
    throw new Error('Aucun salon dédié n’est configuré pour ce serveur. Un administrateur doit utiliser /rollz set-channel.');
  }

  if ((mode === 'dedicated' || mode === 'both') && dedicatedChannelId) {
    const channel = await resolveDedicatedChannel(interaction, dedicatedChannelId);
    if (!channel) {
      throw new Error('Le salon dédié est inaccessible ou n\'est pas un salon textuel.');
    }
    await channel.send(payload);
  }
}