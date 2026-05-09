import type { PublishMode } from './config.js';
export type GuildConfigEntry = {
    guildId: string;
    dedicatedChannelId: string | null;
    publishMode: PublishMode | null;
    updatedAt: number;
};
export declare class GuildConfigStore {
    private readonly filePath;
    private database;
    private static readonly TABLE_NAME;
    constructor(filePath: string);
    private getDatabase;
    get(guildId: string): Promise<GuildConfigEntry | null>;
    setDedicatedChannel(guildId: string, channelId: string): Promise<GuildConfigEntry>;
    setPublishMode(guildId: string, publishMode: PublishMode): Promise<GuildConfigEntry>;
    clearPublishMode(guildId: string): Promise<boolean>;
    clearDedicatedChannel(guildId: string): Promise<boolean>;
    getStatus(): Promise<{
        filePath: string;
        reachable: boolean;
    }>;
}
