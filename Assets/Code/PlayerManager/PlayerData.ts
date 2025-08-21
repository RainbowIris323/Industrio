import ItemComponent from "Code/Components/Items/ItemComponent";
import { Enum } from "Code/Enum";
import { BaseState } from "Code/StateContainer/State/State";
import SaveUtility, { GlobalSaveDataKnown } from "Code/Utility/SaveUtility";

//#region Player Stats

export type PlayerStats = {
    timePlayed: number,
    blocksBuilt: number,
    blocksMined: number,
    recipesCrafted: number,
    recipesProcessed: number,
    tier: Enum.Tier,
}

export const PlayerStats: PlayerStats = {
    timePlayed: 0,
    blocksBuilt: 0,
    blocksMined: 0,
    recipesCrafted: 0,
    recipesProcessed: 0,
    tier: Enum.Tier.StoneAge,
}

export type PlayerStatsState = PlayerStats & BaseState;

//#endregion

//#region Player Config

export type PlayerConfig = {
    machineVolume: number,
    interfaceVolume: number,
    interactionVolume: number
    ambientVolume: number,
}

export const PlayerConfig: PlayerConfig = {
    machineVolume: 0.5,
    interactionVolume: 1,
    interfaceVolume: 0.8,
    ambientVolume: 0.1,
}

export type PlayerConfigState = PlayerConfig & BaseState;

//#endregion

//#region Player Save

export type PlayerSave = {
    location: Enum.World,
    profile: string,
    profiles: string[],
    config: PlayerConfig,
    stats: PlayerStats,
} & GlobalSaveDataKnown;

export const PlayerSave: PlayerSave = {
    version: 0,
    location: Enum.World.Industria,
    profile: `${Enum.World.Industria}:0`,
    profiles: [`${Enum.World.Industria}:0`],
    config: PlayerConfig,
    stats: PlayerStats,
}

export const PlayerSaveUtility = new SaveUtility<PlayerSave>(
    "player",
    {
        0: () => PlayerSave,
    }
);

//#region Player State

export type PlayerState = {
    joinTime: number,
} & BaseState;

//#endregion

//#region Local Player State

export type LocalPlayer = {
    isFirstPerson: boolean,
    isToolActivated: boolean,
    heldItem: ItemComponent | undefined,
    placementRotation: Enum.Rotation,
    target: Vector3 | undefined,
};

export const LocalPlayer: LocalPlayer = {
    isFirstPerson: false,
    isToolActivated: false,
    heldItem: undefined,
    placementRotation: Enum.Rotation.Front,
    target: undefined,
}

export type LocalPlayerState = LocalPlayer & BaseState;

//#endregion