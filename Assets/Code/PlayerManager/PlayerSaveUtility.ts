import SaveUtility from "Code/Utility/SaveUtility";

export const PlayerSaves = new SaveUtility<PlayerData["save"]>(
    "player",
    {
        0: () => ({
            version: 0,
            activeProfileId: "",
            profileIds: [],
            timePlayed: 0,
            blocksBuilt: 0,
            blocksMined: 0,
            itemsCrafted: 0,
        })
    }
);
