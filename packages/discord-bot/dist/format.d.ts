import { type RollBatch } from '@rollz/core';
import { EmbedBuilder, type MessageCreateOptions } from 'discord.js';
export declare function buildRollEmbed(batch: RollBatch, title: string, requestedBy: string): EmbedBuilder;
export declare function buildRollMessage(batch: RollBatch, title: string, requestedBy: string): MessageCreateOptions;
