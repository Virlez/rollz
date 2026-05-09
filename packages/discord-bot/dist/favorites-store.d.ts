import { type AdvantageMode } from '@rollz/core';
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
export declare class FavoritesStore {
    private readonly filePath;
    private database;
    private static readonly TABLE_NAME;
    constructor(filePath: string);
    private getDatabase;
    list(userId: string): Promise<FavoriteEntry[]>;
    listMatching(userId: string, query: string, limit?: number): Promise<FavoriteEntry[]>;
    getByName(userId: string, name: string): Promise<FavoriteEntry | null>;
    upsert(input: Omit<FavoriteEntry, 'id' | 'createdAt'>): Promise<{
        entry: FavoriteEntry;
        created: boolean;
    }>;
    remove(userId: string, name: string): Promise<boolean>;
    close(): void;
    getStatus(): Promise<{
        filePath: string;
        reachable: boolean;
    }>;
}
