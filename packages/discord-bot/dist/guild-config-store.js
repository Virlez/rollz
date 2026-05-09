import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
export class GuildConfigStore {
    filePath;
    database = null;
    static TABLE_NAME = 'guild_config';
    constructor(filePath) {
        this.filePath = filePath;
    }
    async getDatabase() {
        if (this.database)
            return this.database;
        await mkdir(dirname(this.filePath), { recursive: true });
        const database = new DatabaseSync(this.filePath);
        database.exec(`
      CREATE TABLE IF NOT EXISTS ${GuildConfigStore.TABLE_NAME} (
        guild_id TEXT PRIMARY KEY,
        dedicated_channel_id TEXT,
        publish_mode TEXT,
        updated_at INTEGER NOT NULL
      );
    `);
        const columns = database.prepare(`PRAGMA table_info(${GuildConfigStore.TABLE_NAME})`).all();
        if (!columns.some(column => column.name === 'publish_mode')) {
            database.exec(`ALTER TABLE ${GuildConfigStore.TABLE_NAME} ADD COLUMN publish_mode TEXT;`);
        }
        this.database = database;
        return database;
    }
    async get(guildId) {
        const database = await this.getDatabase();
        const row = database.prepare(`
      SELECT guild_id, dedicated_channel_id, publish_mode, updated_at
      FROM ${GuildConfigStore.TABLE_NAME}
      WHERE guild_id = ?
      LIMIT 1
    `).get(guildId);
        if (!row)
            return null;
        return {
            guildId: String(row.guild_id),
            dedicatedChannelId: row.dedicated_channel_id ? String(row.dedicated_channel_id) : null,
            publishMode: row.publish_mode ? String(row.publish_mode) : null,
            updatedAt: Number(row.updated_at),
        };
    }
    async setDedicatedChannel(guildId, channelId) {
        const database = await this.getDatabase();
        const updatedAt = Date.now();
        database.prepare(`
      INSERT INTO ${GuildConfigStore.TABLE_NAME} (guild_id, dedicated_channel_id, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET
        dedicated_channel_id = excluded.dedicated_channel_id,
        updated_at = excluded.updated_at
    `).run(guildId, channelId, updatedAt);
        return {
            guildId,
            dedicatedChannelId: channelId,
            publishMode: (await this.get(guildId))?.publishMode ?? null,
            updatedAt,
        };
    }
    async setPublishMode(guildId, publishMode) {
        const database = await this.getDatabase();
        const updatedAt = Date.now();
        database.prepare(`
      INSERT INTO ${GuildConfigStore.TABLE_NAME} (guild_id, publish_mode, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET
        publish_mode = excluded.publish_mode,
        updated_at = excluded.updated_at
    `).run(guildId, publishMode, updatedAt);
        return {
            guildId,
            dedicatedChannelId: (await this.get(guildId))?.dedicatedChannelId ?? null,
            publishMode,
            updatedAt,
        };
    }
    async clearPublishMode(guildId) {
        const database = await this.getDatabase();
        const existing = await this.get(guildId);
        if (!existing) {
            return false;
        }
        if (!existing.dedicatedChannelId) {
            const result = database.prepare(`DELETE FROM ${GuildConfigStore.TABLE_NAME} WHERE guild_id = ?`).run(guildId);
            return Number(result.changes) > 0;
        }
        const result = database.prepare(`
      UPDATE ${GuildConfigStore.TABLE_NAME}
      SET publish_mode = NULL, updated_at = ?
      WHERE guild_id = ?
    `).run(Date.now(), guildId);
        return Number(result.changes) > 0;
    }
    async clearDedicatedChannel(guildId) {
        const database = await this.getDatabase();
        const existing = await this.get(guildId);
        if (!existing) {
            return false;
        }
        if (!existing.publishMode) {
            const result = database.prepare(`DELETE FROM ${GuildConfigStore.TABLE_NAME} WHERE guild_id = ?`).run(guildId);
            return Number(result.changes) > 0;
        }
        const result = database.prepare(`
      UPDATE ${GuildConfigStore.TABLE_NAME}
      SET dedicated_channel_id = NULL, updated_at = ?
      WHERE guild_id = ?
    `).run(Date.now(), guildId);
        return Number(result.changes) > 0;
    }
    async getStatus() {
        const database = await this.getDatabase();
        database.prepare('SELECT 1').get();
        return {
            filePath: this.filePath,
            reachable: true,
        };
    }
}
