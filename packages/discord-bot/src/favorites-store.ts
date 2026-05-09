import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { MAX_FAVORITES, type AdvantageMode } from '@rollz/core';

export type FavoriteEntry = {
  id: string;
  guildId: string;
  userId: string;
  name: string;
  formula: string;
  successMode: boolean;
  advantageMode: AdvantageMode;
  createdAt: number;
};

function createId(): string {
  return `fav_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export class FavoritesStore {
  private readonly filePath: string;
  private database: DatabaseSync | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private async getDatabase(): Promise<DatabaseSync> {
    if (this.database) return this.database;

    await mkdir(dirname(this.filePath), { recursive: true });
    const database = new DatabaseSync(this.filePath);
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

    this.database = database;
    return database;
  }

  async list(guildId: string): Promise<FavoriteEntry[]> {
    const database = await this.getDatabase();
    const statement = database.prepare(`
      SELECT id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at
      FROM favorites
      WHERE guild_id = ?
      ORDER BY name COLLATE NOCASE ASC
    `);

    const rows = statement.all(guildId) as Array<Record<string, string | number>>;
    return rows.map(row => ({
      id: String(row.id),
      guildId: String(row.guild_id),
      userId: String(row.user_id),
      name: String(row.name),
      formula: String(row.formula),
      successMode: Number(row.success_mode) === 1,
      advantageMode: String(row.advantage_mode) as AdvantageMode,
      createdAt: Number(row.created_at),
    }));
  }

  async getByName(guildId: string, name: string): Promise<FavoriteEntry | null> {
    const database = await this.getDatabase();
    const statement = database.prepare(`
      SELECT id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at
      FROM favorites
      WHERE guild_id = ? AND lower(name) = lower(?)
      LIMIT 1
    `);
    const row = statement.get(guildId, name.trim()) as Record<string, string | number> | undefined;
    if (!row) return null;

    return {
      id: String(row.id),
      guildId: String(row.guild_id),
      userId: String(row.user_id),
      name: String(row.name),
      formula: String(row.formula),
      successMode: Number(row.success_mode) === 1,
      advantageMode: String(row.advantage_mode) as AdvantageMode,
      createdAt: Number(row.created_at),
    };
  }

  async upsert(input: Omit<FavoriteEntry, 'id' | 'createdAt'>): Promise<{ entry: FavoriteEntry; created: boolean }> {
    const database = await this.getDatabase();
    const normalizedName = input.name.trim();
    const existing = await this.getByName(input.guildId, normalizedName);

    if (!existing) {
      const countRow = database.prepare('SELECT COUNT(*) AS count FROM favorites WHERE guild_id = ?').get(input.guildId) as { count: number };
      if (Number(countRow.count) >= MAX_FAVORITES) {
        throw new Error(`This server already has ${MAX_FAVORITES} favorites.`);
      }

      const entry: FavoriteEntry = {
        id: createId(),
        createdAt: Date.now(),
        ...input,
        name: normalizedName,
      };

      database.prepare(`
        INSERT INTO favorites (id, guild_id, user_id, name, formula, success_mode, advantage_mode, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.id,
        entry.guildId,
        entry.userId,
        entry.name,
        entry.formula,
        entry.successMode ? 1 : 0,
        entry.advantageMode,
        entry.createdAt,
      );

      return { entry, created: true };
    }

    database.prepare(`
      UPDATE favorites
      SET formula = ?, success_mode = ?, advantage_mode = ?, user_id = ?
      WHERE id = ?
    `).run(
      input.formula,
      input.successMode ? 1 : 0,
      input.advantageMode,
      input.userId,
      existing.id,
    );

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

  async remove(guildId: string, name: string): Promise<boolean> {
    const database = await this.getDatabase();
    const result = database.prepare('DELETE FROM favorites WHERE guild_id = ? AND lower(name) = lower(?)').run(guildId, name.trim());
    return Number(result.changes) > 0;
  }

  close(): void {
    this.database?.close();
    this.database = null;
  }

  async getStatus(): Promise<{ filePath: string; reachable: boolean }> {
    const database = await this.getDatabase();
    database.prepare('SELECT 1').get();
    return {
      filePath: this.filePath,
      reachable: true,
    };
  }
}