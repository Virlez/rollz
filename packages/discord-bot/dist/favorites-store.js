import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { MAX_FAVORITES } from '@rollz/core';
function createId() {
    return `fav_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}
export class FavoritesStore {
    filePath;
    database = null;
    static TABLE_NAME = 'user_favorites';
    constructor(filePath) {
        this.filePath = filePath;
    }
    async getDatabase() {
        if (this.database)
            return this.database;
        await mkdir(dirname(this.filePath), { recursive: true });
        const database = new DatabaseSync(this.filePath);
        database.exec(`
      CREATE TABLE IF NOT EXISTS ${FavoritesStore.TABLE_NAME} (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        formula TEXT NOT NULL,
        success_mode INTEGER NOT NULL,
        advantage_mode TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(user_id, name)
      );
      CREATE INDEX IF NOT EXISTS user_favorites_user_name_idx ON ${FavoritesStore.TABLE_NAME} (user_id, name);
      CREATE INDEX IF NOT EXISTS user_favorites_user_created_idx ON ${FavoritesStore.TABLE_NAME} (user_id, created_at);
    `);
        database.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        formula TEXT NOT NULL,
        success_mode INTEGER NOT NULL,
        advantage_mode TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(guild_id, name)
      );
      CREATE INDEX IF NOT EXISTS favorites_guild_name_idx ON favorites (guild_id, name);
    `);
        database.exec(`
      INSERT OR IGNORE INTO ${FavoritesStore.TABLE_NAME} (id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at)
      SELECT id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at
      FROM favorites
      WHERE trim(user_id) <> '';
    `);
        this.database = database;
        return database;
    }
    async list(userId) {
        const database = await this.getDatabase();
        const statement = database.prepare(`
      SELECT id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at
      FROM ${FavoritesStore.TABLE_NAME}
      WHERE user_id = ?
      ORDER BY name COLLATE NOCASE ASC
    `);
        const rows = statement.all(userId);
        return rows.map(row => ({
            id: String(row.id),
            guildId: String(row.guild_id),
            userId: String(row.user_id),
            name: String(row.name),
            formula: String(row.formula),
            successMode: Number(row.success_mode) === 1,
            advantageMode: String(row.advantage_mode),
            createdAt: Number(row.created_at),
        }));
    }
    async listMatching(userId, query, limit = 25) {
        const database = await this.getDatabase();
        const normalizedQuery = query.trim().toLocaleLowerCase();
        const statement = normalizedQuery
            ? database.prepare(`
          SELECT id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at
          FROM ${FavoritesStore.TABLE_NAME}
          WHERE user_id = ? AND lower(name) LIKE ?
          ORDER BY name COLLATE NOCASE ASC
          LIMIT ?
        `)
            : database.prepare(`
          SELECT id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at
          FROM ${FavoritesStore.TABLE_NAME}
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `);
        const rows = normalizedQuery
            ? statement.all(userId, `%${normalizedQuery}%`, limit)
            : statement.all(userId, limit);
        return rows.map(row => ({
            id: String(row.id),
            guildId: String(row.guild_id),
            userId: String(row.user_id),
            name: String(row.name),
            formula: String(row.formula),
            successMode: Number(row.success_mode) === 1,
            advantageMode: String(row.advantage_mode),
            createdAt: Number(row.created_at),
        }));
    }
    async getByName(userId, name) {
        const database = await this.getDatabase();
        const statement = database.prepare(`
      SELECT id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at
      FROM ${FavoritesStore.TABLE_NAME}
      WHERE user_id = ? AND lower(name) = lower(?)
      LIMIT 1
    `);
        const row = statement.get(userId, name.trim());
        if (!row)
            return null;
        return {
            id: String(row.id),
            guildId: String(row.guild_id),
            userId: String(row.user_id),
            name: String(row.name),
            formula: String(row.formula),
            successMode: Number(row.success_mode) === 1,
            advantageMode: String(row.advantage_mode),
            createdAt: Number(row.created_at),
        };
    }
    async upsert(input) {
        const database = await this.getDatabase();
        const normalizedName = input.name.trim();
        const existing = await this.getByName(input.userId, normalizedName);
        if (!existing) {
            const countRow = database.prepare(`SELECT COUNT(*) AS count FROM ${FavoritesStore.TABLE_NAME} WHERE user_id = ?`).get(input.userId);
            if (Number(countRow.count) >= MAX_FAVORITES) {
                throw new Error(`Tu as déjà ${MAX_FAVORITES} favoris.`);
            }
            const entry = {
                id: createId(),
                createdAt: Date.now(),
                ...input,
                name: normalizedName,
            };
            database.prepare(`
        INSERT INTO ${FavoritesStore.TABLE_NAME} (id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(entry.id, entry.guildId, entry.userId, entry.name, entry.formula, entry.successMode ? 1 : 0, entry.advantageMode, entry.createdAt);
            return { entry, created: true };
        }
        database.prepare(`
      UPDATE ${FavoritesStore.TABLE_NAME}
      SET formula = ?, success_mode = ?, advantage_mode = ?, guild_id = ?
      WHERE id = ?
    `).run(input.formula, input.successMode ? 1 : 0, input.advantageMode, input.guildId, existing.id);
        return {
            entry: {
                ...existing,
                formula: input.formula,
                successMode: input.successMode,
                advantageMode: input.advantageMode,
                userId: input.userId,
            },
            created: false,
        };
    }
    async remove(userId, name) {
        const database = await this.getDatabase();
        const result = database.prepare(`DELETE FROM ${FavoritesStore.TABLE_NAME} WHERE user_id = ? AND lower(name) = lower(?)`).run(userId, name.trim());
        return Number(result.changes) > 0;
    }
    close() {
        this.database?.close();
        this.database = null;
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
