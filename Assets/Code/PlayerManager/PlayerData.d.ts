interface PlayerDataKnown {
    version: number
    [key: string]: unknown;
}

interface PlayerData {
    joinTime: number;
    save: {
        version: number;
        activeProfileId: string;
        profileIds: string[],
        timePlayed: number;
        blocksBuilt: number;
        blocksMined: number;
        itemsCrafted: number;
    }
}