import PlayerManager from "../PlayerManager/PlayerManager";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { Game } from "@Easy/Core/Shared/Game";
import { Airship } from "@Easy/Core/Shared/Airship";
import { Player } from "@Easy/Core/Shared/Player/Player";
import GameManagerConfig from "./GameManagerConfig";
import IslandManager from "Code/IslandManager/IslandManager";
import ItemManager from "Code/ItemManager/ItemManager";

export default class GameManager extends AirshipSingleton {

    public onInit = new Signal();
    public onInitServer = new Signal();
    public onInitClient = new Signal();

    public onStart = new Signal();
    public onStartServer = new Signal();
    public onStartClient = new Signal();

    public onTick = new Signal<number>();
    public onTickServer = new Signal<number>();
    public onTickClient = new Signal<number>();

    public onPlayerJoin = new Signal<Player>();
    public onPlayerJoinServer = new Signal<Player>();
    public onPlayerJoinClient = new Signal<Player>();

    public onPlayerLeave = new Signal<Player>();
    public onPlayerLeaveServer = new Signal<Player>();
    public onPlayerLeaveClient = new Signal<Player>();

    public config: GameManagerConfig

    private lastTickTime = DateTime.now().TimestampMilliseconds;

    public Init(config: GameManagerConfig): void {
        this.config = config;
        ItemManager.Get().Setup();
        PlayerManager.Get().Setup();
        IslandManager.Get().Setup();

        this.onInit.Fire();
        if (Game.IsServer()) this.onInitServer.Fire();
        if (Game.IsClient()) this.onInitClient.Fire();

        this.onStart.Fire();
        if (Game.IsServer()) this.onStartServer.Fire();
        if (Game.IsClient()) this.onStartClient.Fire();


        Airship.Players.ObservePlayers((player) => {
            this.onPlayerJoin.Fire(player);
            if (Game.IsServer()) this.onPlayerJoinServer.Fire(player);
            if (Game.IsClient()) this.onPlayerJoinClient.Fire(player);

            return () => {
                this.onPlayerLeave.Fire(player);
                if (Game.IsServer()) this.onPlayerLeaveServer.Fire(player);
                if (Game.IsClient()) this.onPlayerLeaveClient.Fire(player);
            }
        })
    }

    protected FixedUpdate(): void {
        if (DateTime.now().TimestampMilliseconds < this.lastTickTime + this.config.targetTickRate * 1000) return
        
        const dt = DateTime.now().TimestampMilliseconds;

        this.onTick.Fire(dt);
        if (Game.IsServer()) this.onTickServer.Fire(dt);
        if (Game.IsClient()) this.onTickClient.Fire(dt);

        this.lastTickTime = DateTime.now().TimestampMilliseconds;
    }
}