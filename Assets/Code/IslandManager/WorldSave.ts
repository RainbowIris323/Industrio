import SaveUtility from "Code/Utility/SaveUtility";

export interface IslandSaveData {
    version: number,
    owner: string,
    users: string[],
    isLarge: boolean,
    blocks: string,
    blockSaves: string,
    blockKey: { [id: number]: string },
    inventory: string,
}

export const IslandSave = new SaveUtility<IslandSaveData>(
    "island",
    {
        0: () => ({
            version: 0,
            owner: "",
            users: [],
            isLarge: false,
            blocks: "",
            blockSaves: "",
            blockKey: {},
            inventory: string,
        })
    }
);