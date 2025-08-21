import { Player } from "@Easy/Core/Shared/Player/Player";
import GameManager from "Code/GameManager/GameManager";
import { Signal, SignalPriority } from "@Easy/Core/Shared/Util/Signal";
import { InputHandler } from "./InputHandler";
import { Game } from "@Easy/Core/Shared/Game";
import { Placement } from "Code/IslandManager/World/Placement";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import PlayerGUI from "Code/PlayerGUI/PlayerGUI";
import SoundManager from "Code/SoundManager/SoundManager";
import { Enum } from "Code/Enum";
import { SetTimeout } from "@Easy/Core/Shared/Util/Timer";
import { PlayerBin } from "./PlayerBin";
import { Bin } from "@Easy/Core/Shared/Util/Bin";

export default class PlayerContainer extends AirshipSingleton {
    private _players: Map<Player, PlayerBin> = new Map<Player, PlayerBin>();
    private _bin: Bin = new Bin();

    private LoadPlayerData(): void {
        
    }

    private CreatePlayer(player?: Player): void {
        if (!player) {
            if (Game.IsServer()) error("Must specify player on server for 'PlayerContainer.CreatePlayer'");
            player = Game.localPlayer;
        }
        const playerObject = GameObject.Create(`${player.userId}.PlayerBin`);
        const playerBin = playerObject.AddAirshipComponent<PlayerBin>();
        playerBin.Initialize()
    }

    public OnDestroy(): void {
        this._bin.Clean();
        this._players.forEach((playerBin) => Destroy(playerBin));
        this._players.clear();
    }

    ///

    public onTargetChanged = new Signal<{ last: Placement.Data | undefined, current: Placement.Data | undefined }>();
    private target: Placement.Data | undefined;
    public readonly GetTarget = () => this.target;

    public SetTarget(target: Placement.Data | undefined): void {
        if (target?.positionId === this.target?.positionId) return;
        this.onTargetChanged.Fire({ last: this.target, current: target });
        this.target = target;
    }

    public signal = new NetworkSignal<[msg: string, timeToLive: number]>("Notify Player");

    public NotifyPlayer(player: Player, msg: string, timeToLive: number = 5): void {
        this.signal.server.FireClient(player, msg, timeToLive);
    }

    public NotifyPlayers(players: Player[], msg: string, timeToLive: number = 5): void {
        this.signal.server.FireClients(players, msg, timeToLive);
    }

    public NotifyAllPlayers(msg: string, timeToLive: number = 5): void {
        this.signal.server.FireAllClients(msg, timeToLive);
    }

    public FinishPlayerLoad(player: Player): void {
        this.events.Get("LoadPlayer").Server.SendToPlayer(player, this.players[player.userId]);
    }

    public LoadLocal(data: PlayerData): void {
        this.local = data;
        this.isLoaded = true;
        PlayerGUI.Get().LoadPlayer();
        const ambient = () => {
            SoundManager.Get().PlaySound(Game.localPlayer.character!.rig.gameObject, SoundManager.Get().sounds.playerWorldAmbient, Enum.Sound.Ambient, 190);
            SetTimeout(190, () => ambient);
        }
        ambient();
    }

    public Setup(): void {
        if (Game.IsClient()) {
            this.events.Get("LoadPlayer").Client.Connect((data) => this.LoadLocal(data));
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