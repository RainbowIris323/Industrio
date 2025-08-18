import { Player } from "@Easy/Core/Shared/Player/Player";
import { PlayerSaves } from "./PlayerSaveUtility";
import GameManager from "Code/GameManager/GameManager";
import { Signal, SignalPriority } from "@Easy/Core/Shared/Util/Signal";
import { InputHandler } from "./InputHandler/InputHandler";
import { Game } from "@Easy/Core/Shared/Game";
import { Placement } from "Code/IslandManager/World/Placement";

export default class PlayerManager extends AirshipSingleton {

    private players: { [userId: string]: PlayerData } = {};
    public input: InputHandler;
    public onTargetChanged = new Signal<{ last: Placement.Data | undefined, current: Placement.Data | undefined }>();
    private target: Placement.Data | undefined;
    public readonly GetTarget = () => this.target;
    public SetTarget(target: Placement.Data | undefined): void {
        if (target?.positionId === this.target?.positionId) return;
        this.onTargetChanged.Fire({ last: this.target, current: target });
        this.target = target;
    }


    public Setup(): void {
        if (Game.IsClient()) {
            this.input = new InputHandler();
            this.input.OnStartClient();
        }
        GameManager.Get().onPlayerJoinServer.ConnectWithPriority(SignalPriority.HIGHEST, (player) => this.OnPlayerJoinServer(player));
        GameManager.Get().onPlayerLeaveServer.ConnectWithPriority(SignalPriority.LOWEST, (player) => this.OnPlayerLeaveServer(player));
    }

    //#region On Player Join

    public OnPlayerJoinServer(player: Player): void {
        // Spawn character and load data.
        player.SpawnCharacter(new Vector3(0, 1000, 0));
        const save = PlayerSaves.Get(player.userId, (save) => {
            save.activeProfileId = `${player.userId}:0`;
            save.profileIds = [`${player.userId}:0`];
            return save;
        })
        if (!save) return player.Kick("Failed to load data!");
        this.players[player.userId] = {
            joinTime: DateTime.now().TimestampSeconds,
            save: save,
        }
    }

    //#endregion

    //#region On Player Leave

    public OnPlayerLeaveServer(player: Player): void {
        // Saves player data and removes them from the array
        const data = this.players[player.userId];
        data["save"]["timePlayed"] += math.round((DateTime.now().TimestampSeconds - data["joinTime"]) /  60);
        PlayerSaves.Set(player.userId, data["save"]);
        this.players[player.userId] = undefined!;
    }

    //#endregion

    /**
     * Gets a players data.
     * @param player The player to get data for.
     * @returns The players data.
     */
    public GetPlayerData(player: Player): PlayerData {
        return this.players[player.userId];
    }
}