async function resolveDedicatedChannel(interaction, channelId) {
    const channel = await interaction.client.channels.fetch(channelId);
    if (!channel || !('send' in channel)) {
        return null;
    }
    return channel;
}
export async function publishResponse(interaction, payload, config) {
    const mode = config.publishMode;
    const replyPayload = { ...payload, flags: undefined };
    if (mode === 'invocation' || mode === 'both') {
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(replyPayload);
        }
        else {
            await interaction.reply(replyPayload);
        }
    }
    else {
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'Jet publié dans le salon dédié.' });
        }
        else {
            await interaction.reply({ content: 'Jet publié dans le salon dédié.', ephemeral: true });
        }
    }
    if ((mode === 'dedicated' || mode === 'both') && config.dedicatedChannelId) {
        const channel = await resolveDedicatedChannel(interaction, config.dedicatedChannelId);
        if (!channel) {
            throw new Error('Dedicated channel is not accessible or is not text-based.');
        }
        await channel.send(payload);
    }
}
