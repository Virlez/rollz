import { executeRoll, normalizeRollMode, RollValidationError } from '@rollz/core';
import { EmbedBuilder } from 'discord.js';
import { buildRollEmbed } from './format.js';
import { publishResponse } from './publish.js';
function parseMode(mode) {
    if (mode === 'advantage' || mode === 'disadvantage') {
        return { advantageMode: mode, successMode: false };
    }
    if (mode === 'success') {
        return { advantageMode: 'none', successMode: true };
    }
    return normalizeRollMode({});
}
function buildFavoritesEmbed(items) {
    return new EmbedBuilder()
        .setTitle('Favoris Rollz')
        .setDescription(items.length > 0
        ? items.map(item => `**${item.name}** — ${item.formula}${item.successMode ? ' [success]' : item.advantageMode !== 'none' ? ` [${item.advantageMode}]` : ''}`).join('\n')
        : 'Aucun favori enregistré pour ce serveur.')
        .setTimestamp(new Date());
}
function buildStatusEmbed(input) {
    const uptime = input.readyTimestamp ? `${Math.max(0, Math.round((Date.now() - input.readyTimestamp) / 1000))}s` : 'unknown';
    return new EmbedBuilder()
        .setTitle('Rollz status')
        .addFields({
        name: 'Discord',
        value: [
            `Guild: ${input.guildName ?? 'DM / unknown'}${input.guildId ? ` (${input.guildId})` : ''}`,
            `Commands scope: ${input.config.guildId ? `guild ${input.config.guildId}` : 'global'}`,
            `Publish mode: ${input.config.publishMode}`,
            `Dedicated channel: ${input.dedicatedChannelStatus}`,
            `Uptime: ${uptime}`,
        ].join('\n'),
    }, {
        name: 'Storage',
        value: [
            `Favorites DB: ${input.favoritesStatus}`,
            `Path: ${input.config.favoritesFilePath}`,
        ].join('\n'),
    }, {
        name: 'Limits',
        value: [
            `Max repeats: ${input.config.limits.maxRepeatCount}`,
            `Max formulas: ${input.config.limits.maxFormulasPerRequest}`,
            `Max dice/formula: ${input.config.limits.maxDicePerFormula}`,
            `Max input length: ${input.config.limits.maxInputLength}`,
        ].join('\n'),
    })
        .setFooter({ text: `Demandé par ${input.requestedBy}` })
        .setTimestamp(new Date());
}
export async function handleStatusCommand(interaction, config, favoritesStore) {
    const subcommand = interaction.options.getSubcommand(true);
    if (subcommand !== 'status') {
        await interaction.reply({ content: 'Sous-commande non prise en charge.', ephemeral: true });
        return;
    }
    const favoritesStatus = await favoritesStore.getStatus()
        .then(() => 'ok')
        .catch(error => error instanceof Error ? `error: ${error.message}` : 'error');
    const dedicatedChannelStatus = config.dedicatedChannelId
        ? await interaction.client.channels.fetch(config.dedicatedChannelId)
            .then(channel => channel && 'send' in channel ? `${channel.id}` : 'configured but inaccessible')
            .catch(error => error instanceof Error ? `error: ${error.message}` : 'error')
        : 'not configured';
    const embed = buildStatusEmbed({
        config,
        requestedBy: interaction.user.username,
        guildName: interaction.guild?.name ?? null,
        guildId: interaction.guildId,
        dedicatedChannelStatus,
        favoritesStatus,
        readyTimestamp: interaction.client.readyTimestamp,
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
export async function handleRollCommand(interaction, config) {
    const formula = interaction.options.getString('formula', true);
    const mode = parseMode(interaction.options.getString('mode'));
    try {
        const batch = await executeRoll(formula, mode, config.limits);
        const embed = buildRollEmbed(batch, 'Jet Rollz', interaction.user.username);
        await publishResponse(interaction, { embeds: [embed] }, config);
    }
    catch (error) {
        const message = error instanceof RollValidationError
            ? error.message
            : error instanceof Error
                ? error.message
                : 'Le jet a échoué.';
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: message, ephemeral: true });
        }
        else {
            await interaction.reply({ content: message, ephemeral: true });
        }
    }
}
export async function handleFavoriteCommand(interaction, config, favoritesStore) {
    const guildId = interaction.guildId;
    if (!guildId) {
        await interaction.reply({ content: 'Les favoris ne sont disponibles que sur un serveur Discord.', ephemeral: true });
        return;
    }
    const subcommand = interaction.options.getSubcommand(true);
    if (subcommand === 'list') {
        const favorites = await favoritesStore.list(guildId);
        await interaction.reply({ embeds: [buildFavoritesEmbed(favorites)], ephemeral: true });
        return;
    }
    if (subcommand === 'remove') {
        const name = interaction.options.getString('name', true);
        const removed = await favoritesStore.remove(guildId, name);
        await interaction.reply({ content: removed ? `Favori ${name} supprimé.` : `Favori ${name} introuvable.`, ephemeral: true });
        return;
    }
    if (subcommand === 'add') {
        const name = interaction.options.getString('name', true);
        const formula = interaction.options.getString('formula', true);
        const mode = parseMode(interaction.options.getString('mode'));
        try {
            await executeRoll(formula, mode, config.limits);
            const result = await favoritesStore.upsert({
                guildId,
                userId: interaction.user.id,
                name,
                formula,
                successMode: mode.successMode,
                advantageMode: mode.advantageMode,
            });
            await interaction.reply({
                content: result.created ? `Favori ${name} ajouté.` : `Favori ${name} mis à jour.`,
                ephemeral: true,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Impossible d’enregistrer ce favori.';
            await interaction.reply({ content: message, ephemeral: true });
        }
        return;
    }
    if (subcommand === 'roll') {
        const name = interaction.options.getString('name', true);
        const favorite = await favoritesStore.getByName(guildId, name);
        if (!favorite) {
            await interaction.reply({ content: `Favori ${name} introuvable.`, ephemeral: true });
            return;
        }
        try {
            const batch = await executeRoll(favorite.formula, {
                advantageMode: favorite.advantageMode,
                successMode: favorite.successMode,
            }, config.limits);
            const embed = buildRollEmbed(batch, `Favori ${favorite.name}`, interaction.user.username);
            await publishResponse(interaction, { embeds: [embed] }, config);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Impossible de relancer ce favori.';
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: message, ephemeral: true });
            }
            else {
                await interaction.reply({ content: message, ephemeral: true });
            }
        }
    }
}
