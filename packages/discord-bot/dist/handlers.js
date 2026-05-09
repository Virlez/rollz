import { executeRoll, normalizeRollMode, RollValidationError } from '@rollz/core';
import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { buildRollMessage } from './format.js';
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
function parseVisibility(visibility) {
    return visibility === 'private' ? 'private' : 'public';
}
function formatPublishMode(mode) {
    if (mode === 'dedicated') {
        return 'salon dédié';
    }
    if (mode === 'both') {
        return 'les deux';
    }
    return 'salon de commande';
}
function buildFavoritesEmbed(items) {
    return new EmbedBuilder()
        .setTitle('Mes favoris Rollz')
        .setDescription(items.length > 0
        ? items.map(item => `**${item.name}** — ${item.formula}${item.successMode ? ' [succès]' : item.advantageMode === 'advantage' ? ' [avantage]' : item.advantageMode === 'disadvantage' ? ' [désavantage]' : ''}`).join('\n')
        : 'Aucun favori enregistré pour cet utilisateur.')
        .setTimestamp(new Date());
}
function buildStatusEmbed(input) {
    const uptime = input.readyTimestamp ? `${Math.max(0, Math.round((Date.now() - input.readyTimestamp) / 1000))}s` : 'inconnu';
    return new EmbedBuilder()
        .setTitle('État de Rollz')
        .addFields({
        name: 'Discord',
        value: [
            `Serveur: ${input.guildName ?? 'Message privé / inconnu'}${input.guildId ? ` (${input.guildId})` : ''}`,
            `Portée des commandes: ${input.config.guildId ? `serveur ${input.config.guildId}` : 'globale'}`,
            `Mode de publication: ${formatPublishMode(input.effectivePublishMode)}${input.effectivePublishMode === input.config.publishMode ? ' (global)' : ' (spécifique au serveur)'}`,
            `Salon dédié: ${input.dedicatedChannelStatus}`,
            `Temps de fonctionnement: ${uptime}`,
        ].join('\n'),
    }, {
        name: 'Stockage',
        value: [
            `Base SQLite: ${input.storageStatus}`,
            `Chemin: ${input.config.favoritesFilePath}`,
        ].join('\n'),
    }, {
        name: 'Limites',
        value: [
            `Répétitions max: ${input.config.limits.maxRepeatCount}`,
            `Formules max: ${input.config.limits.maxFormulasPerRequest}`,
            `Dés max/formule: ${input.config.limits.maxDicePerFormula}`,
            `Longueur max de saisie: ${input.config.limits.maxInputLength}`,
        ].join('\n'),
    })
        .setFooter({ text: `Demandé par ${input.requestedBy}` })
        .setTimestamp(new Date());
}
function isAdmin(interaction) {
    return interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator) ?? false;
}
async function requireGuildAdmin(interaction) {
    if (!interaction.guildId) {
        await interaction.reply({ content: 'Cette commande doit être utilisée sur un serveur Discord.', ephemeral: true });
        return false;
    }
    if (isAdmin(interaction)) {
        return true;
    }
    await interaction.reply({ content: 'Seuls les administrateurs du serveur peuvent modifier la configuration du serveur.', ephemeral: true });
    return false;
}
export async function handleStatusCommand(interaction, config, favoritesStore, guildConfigStore) {
    const subcommand = interaction.options.getSubcommand(true);
    if (subcommand === 'set-channel') {
        if (!await requireGuildAdmin(interaction)) {
            return;
        }
        const guildId = interaction.guildId;
        const channel = interaction.options.getChannel('channel', true);
        await guildConfigStore.setDedicatedChannel(guildId, channel.id);
        await interaction.reply({ content: `Salon dédié configuré sur <#${channel.id}> pour ce serveur.`, ephemeral: true });
        return;
    }
    if (subcommand === 'clear-channel') {
        if (!await requireGuildAdmin(interaction)) {
            return;
        }
        const guildId = interaction.guildId;
        const cleared = await guildConfigStore.clearDedicatedChannel(guildId);
        await interaction.reply({
            content: cleared
                ? 'Salon dédié supprimé pour ce serveur.'
                : 'Aucun salon dédié spécifique n’était configuré pour ce serveur.',
            ephemeral: true,
        });
        return;
    }
    if (subcommand === 'set-mode') {
        if (!await requireGuildAdmin(interaction)) {
            return;
        }
        const guildId = interaction.guildId;
        const mode = interaction.options.getString('mode', true);
        await guildConfigStore.setPublishMode(guildId, mode);
        await interaction.reply({
            content: `Mode de publication configuré sur ${formatPublishMode(mode)} pour ce serveur.`,
            ephemeral: true,
        });
        return;
    }
    if (subcommand === 'clear-mode') {
        if (!await requireGuildAdmin(interaction)) {
            return;
        }
        const guildId = interaction.guildId;
        const cleared = await guildConfigStore.clearPublishMode(guildId);
        await interaction.reply({
            content: cleared
                ? `Mode de publication spécifique supprimé. Le serveur réutilise maintenant le mode global ${formatPublishMode(config.publishMode)}.`
                : 'Aucun mode de publication spécifique n’était configuré pour ce serveur.',
            ephemeral: true,
        });
        return;
    }
    if (subcommand !== 'status') {
        await interaction.reply({ content: 'Sous-commande non prise en charge.', ephemeral: true });
        return;
    }
    const storageStatus = await Promise.allSettled([
        favoritesStore.getStatus(),
        guildConfigStore.getStatus(),
    ]).then(results => {
        const rejected = results.find(result => result.status === 'rejected');
        if (rejected?.status === 'rejected') {
            const reason = rejected.reason;
            return reason instanceof Error ? `erreur: ${reason.message}` : 'erreur';
        }
        return 'ok';
    });
    const guildConfig = interaction.guildId
        ? await guildConfigStore.get(interaction.guildId)
        : null;
    const effectivePublishMode = guildConfig?.publishMode ?? config.publishMode;
    const dedicatedChannelId = guildConfig?.dedicatedChannelId ?? config.dedicatedChannelId;
    const dedicatedChannelStatus = dedicatedChannelId
        ? await interaction.client.channels.fetch(dedicatedChannelId)
            .then(channel => channel && 'send' in channel ? `${channel.id}` : 'configuré mais inaccessible')
            .catch(error => error instanceof Error ? `erreur: ${error.message}` : 'erreur')
        : config.dedicatedChannelId
            ? `par défaut: ${config.dedicatedChannelId}`
            : 'non configuré';
    const embed = buildStatusEmbed({
        config,
        requestedBy: interaction.user.username,
        guildName: interaction.guild?.name ?? null,
        guildId: interaction.guildId,
        effectivePublishMode,
        dedicatedChannelStatus,
        storageStatus,
        readyTimestamp: interaction.client.readyTimestamp,
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
export async function handleFavoriteAutocomplete(interaction, favoritesStore) {
    if (interaction.commandName !== 'favorite') {
        await interaction.respond([]);
        return;
    }
    const subcommand = interaction.options.getSubcommand();
    if (subcommand !== 'roll' && subcommand !== 'remove') {
        await interaction.respond([]);
        return;
    }
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'name') {
        await interaction.respond([]);
        return;
    }
    const matches = await favoritesStore.listMatching(interaction.user.id, String(focused.value), 25);
    await interaction.respond(matches.map(favorite => ({
        name: favorite.name,
        value: favorite.name,
    })));
}
export async function handleRollCommand(interaction, config, guildConfigStore) {
    const formula = interaction.options.getString('formula', true);
    const mode = parseMode(interaction.options.getString('mode'));
    const visibility = parseVisibility(interaction.options.getString('visibility'));
    try {
        const batch = await executeRoll(formula, mode, config.limits);
        await publishResponse(interaction, buildRollMessage(batch, 'Jet Rollz', interaction.user.username), config, guildConfigStore, visibility);
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
export async function handleFavoriteCommand(interaction, config, favoritesStore, guildConfigStore) {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    if (!guildId) {
        await interaction.reply({ content: 'Les favoris ne sont disponibles que sur un serveur Discord.', ephemeral: true });
        return;
    }
    const subcommand = interaction.options.getSubcommand(true);
    if (subcommand === 'list') {
        const favorites = await favoritesStore.list(userId);
        await interaction.reply({ embeds: [buildFavoritesEmbed(favorites)], ephemeral: true });
        return;
    }
    if (subcommand === 'remove') {
        const name = interaction.options.getString('name', true);
        const removed = await favoritesStore.remove(userId, name);
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
                userId,
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
        const visibility = parseVisibility(interaction.options.getString('visibility'));
        const favorite = await favoritesStore.getByName(userId, name);
        if (!favorite) {
            await interaction.reply({ content: `Favori ${name} introuvable.`, ephemeral: true });
            return;
        }
        try {
            const batch = await executeRoll(favorite.formula, {
                advantageMode: favorite.advantageMode,
                successMode: favorite.successMode,
            }, config.limits);
            await publishResponse(interaction, buildRollMessage(batch, `Favori ${favorite.name}`, interaction.user.username), config, guildConfigStore, visibility);
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
