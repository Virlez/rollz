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
function buildHelpEmbed(isAdministrator) {
    const embed = new EmbedBuilder()
        .setTitle('Aide Rollz')
        .setDescription('Commandes disponibles pour lancer des jets, gerer des favoris et comprendre la publication des resultats.')
        .addFields({
        name: '/roll',
        value: [
            'Lance une formule Rollz.',
            'Usage: /roll formula:<formule> [mode] [visibility]',
            'Exemples: /roll formula:1d20+7 ; /roll formula:4d6R1>=4 mode:success visibility:prive',
        ].join('\n'),
    }, {
        name: '/favorite',
        value: [
            'Gere tes favoris personnels.',
            'Usage: /favorite add name:<nom> formula:<formule> [mode]',
            'Autres sous-commandes: list, remove, roll',
            'Exemple: /favorite roll name:attaque visibility:prive',
        ].join('\n'),
    }, {
        name: 'Publication',
        value: [
            'visibility:public suit le mode de publication du serveur.',
            'visibility:prive envoie toujours une reponse ephemere visible seulement par toi.',
        ].join('\n'),
    })
        .setTimestamp(new Date());
    if (isAdministrator) {
        embed.addFields({
            name: 'Commandes admin',
            value: [
                '/rollz status',
                '/rollz set-channel channel:<salon>',
                '/rollz clear-channel',
                '/rollz set-mode mode:<invocation|dedicated|both>',
                '/rollz clear-mode',
            ].join('\n'),
        });
    }
    return embed;
}
function buildStatusEmbed(input) {
    const updatedAt = input.serverConfigUpdatedAt
        ? `<t:${Math.floor(input.serverConfigUpdatedAt / 1000)}:F>`
        : 'aucune configuration spécifique enregistrée';
    return new EmbedBuilder()
        .setTitle('Configuration du serveur Rollz')
        .addFields({
        name: 'Serveur',
        value: [
            `Nom: ${input.guildName}`,
            `ID: ${input.guildId}`,
            `Dernière mise à jour locale: ${updatedAt}`,
        ].join('\n'),
    }, {
        name: 'Publication',
        value: [
            `Mode effectif: ${formatPublishMode(input.effectivePublishMode)}`,
            `Origine du mode: ${input.publishModeSource}`,
            `Salon dédié effectif: ${input.dedicatedChannelStatus}`,
            `Origine du salon dédié: ${input.dedicatedChannelSource}`,
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
    if (!interaction.guildId || !interaction.guild) {
        await interaction.reply({ content: 'Cette commande affiche uniquement la configuration du serveur courant.', ephemeral: true });
        return;
    }
    const guildConfig = await guildConfigStore.get(interaction.guildId);
    const effectivePublishMode = guildConfig?.publishMode ?? config.publishMode;
    const dedicatedChannelId = guildConfig?.dedicatedChannelId ?? config.dedicatedChannelId;
    const publishModeSource = guildConfig?.publishMode ? 'configuration spécifique au serveur' : 'valeur par défaut du bot';
    const dedicatedChannelSource = guildConfig?.dedicatedChannelId
        ? 'configuration spécifique au serveur'
        : config.dedicatedChannelId
            ? 'valeur par défaut du bot'
            : 'aucun salon défini';
    const dedicatedChannelStatus = dedicatedChannelId
        ? await interaction.client.channels.fetch(dedicatedChannelId)
            .then(channel => channel && 'send' in channel ? `<#${channel.id}>` : 'configuré mais inaccessible')
            .catch(error => error instanceof Error ? `erreur: ${error.message}` : 'erreur')
        : 'non configuré';
    const embed = buildStatusEmbed({
        requestedBy: interaction.user.username,
        guildName: interaction.guild.name,
        guildId: interaction.guildId,
        effectivePublishMode,
        publishModeSource,
        dedicatedChannelStatus,
        dedicatedChannelSource,
        serverConfigUpdatedAt: guildConfig?.updatedAt ?? null,
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
export async function handleHelpCommand(interaction) {
    const embed = buildHelpEmbed(isAdmin(interaction));
    await interaction.reply({ embeds: [embed], ephemeral: true });
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
