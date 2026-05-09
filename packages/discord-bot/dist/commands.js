import { SlashCommandBuilder } from 'discord.js';
export const rollCommand = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Lance une formule Rollz')
    .addStringOption(option => option
    .setName('formula')
    .setDescription('Exemple: 3x 1d20+6;1d10 ou 4d6R1>=4')
    .setRequired(true))
    .addStringOption(option => option
    .setName('mode')
    .setDescription('Mode de lancer')
    .addChoices({ name: 'normal', value: 'normal' }, { name: 'advantage', value: 'advantage' }, { name: 'disadvantage', value: 'disadvantage' }, { name: 'success', value: 'success' }));
export const favoriteCommand = new SlashCommandBuilder()
    .setName('favorite')
    .setDescription('Gère les favoris Rollz')
    .addSubcommand(subcommand => subcommand
    .setName('add')
    .setDescription('Ajoute ou met à jour un favori')
    .addStringOption(option => option.setName('name').setDescription('Nom du favori').setRequired(true))
    .addStringOption(option => option.setName('formula').setDescription('Formule Rollz').setRequired(true))
    .addStringOption(option => option
    .setName('mode')
    .setDescription('Mode de lancer du favori')
    .addChoices({ name: 'normal', value: 'normal' }, { name: 'advantage', value: 'advantage' }, { name: 'disadvantage', value: 'disadvantage' }, { name: 'success', value: 'success' })))
    .addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('Supprime un favori')
    .addStringOption(option => option.setName('name').setDescription('Nom du favori').setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('Liste les favoris du serveur'))
    .addSubcommand(subcommand => subcommand
    .setName('roll')
    .setDescription('Relance un favori')
    .addStringOption(option => option.setName('name').setDescription('Nom du favori').setRequired(true)));
export const commandDefinitions = [rollCommand, favoriteCommand];
