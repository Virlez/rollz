import type { ChatInputCommandInteraction, MessageCreateOptions } from 'discord.js';
import type { BotConfig } from './config.js';

type RollVisibility = 'public' | 'private';

async function resolveDedicatedChannel(interaction: ChatInputCommandInteraction, channelId: string) {
  const channel = await interaction.client.channels.fetch(channelId);
  if (!channel || !('send' in channel)) {
    return null;
  }
  return channel;
}

export async function publishResponse(
  interaction: ChatInputCommandInteraction,
  payload: MessageCreateOptions,
  config: BotConfig,
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

  const mode = config.publishMode;
  const replyPayload = { ...payload, flags: undefined };

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

  if ((mode === 'dedicated' || mode === 'both') && config.dedicatedChannelId) {
    const channel = await resolveDedicatedChannel(interaction, config.dedicatedChannelId);
    if (!channel) {
      throw new Error('Le salon dédié est inaccessible ou n\'est pas un salon textuel.');
    }
    await channel.send(payload);
  }
}