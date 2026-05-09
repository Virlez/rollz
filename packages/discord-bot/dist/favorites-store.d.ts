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
    constructor(filePath: string);
    private getDatabase;
    list(guildId: string): Promise<FavoriteEntry[]>;
    getByName(guildId: string, name: string): Promise<FavoriteEntry | null>;
    upsert(input: Omit<FavoriteEntry, 'id' | 'createdAt'>): Promise<{
        entry: FavoriteEntry;
        created: boolean;
    }>;
    remove(guildId: string, name: string): Promise<boolean>;
    close(): void;
    getStatus(): Promise<{
        filePath: string;
        reachable: boolean;
    }>;
}
