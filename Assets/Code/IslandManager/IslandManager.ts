import GameManager from "Code/GameManager/GameManager";
import {Airship, Platform} from "@Easy/Core/Shared/Airship";
import {Player} from "@Easy/Core/Shared/Player/Player";
import PlayerManager from "Code/PlayerManager/PlayerContainer";
import {World} from "./World/World";
import {Game} from "@Easy/Core/Shared/Game";
import {AirshipServerAccessMode} from "@Easy/Core/Shared/Airship/Types/AirshipServerManager";
import {SignalPriority} from "@Easy/Core/Shared/Util/Signal";
import {DefaultWorldSave} from "./DefaultWorldSave";
import ItemManager from "Code/ItemManager/ItemManager";
import {IslandSave, IslandSaveData} from "./WorldSave";
import { Enum } from "Code/Enum";
import { keys } from "@Easy/Core/Shared/Util/ObjectUtils";

export default class IslandManager extends AirshipSingleton {
    public save: IslandSaveData;
    public world: World;
    public isLoaded: boolean = false;
    private owner: Player;
    private users: Player[] = [];
    private visitors: Player[] = [];

    public Setup(): void {
        GameManager.Get().onInitClient.Connect(() => this.OnInitClient());
        GameManager.Get().onInitServer.Connect(() => this.OnInitServer());
        GameManager.Get().onTickServer.Connect((dt) => this.OnTickServer(dt));
        GameManager.Get().onPlayerJoinServer.ConnectWithPriority(SignalPriority.HIGH, (player) => this.OnPlayerJoinServer(player));
        GameManager.Get().onPlayerLeaveServer.ConnectWithPriority(SignalPriority.NORMAL, (player) => this.OnPlayerLeaveServer(player));

        this.world = new World();
    }

    public OnInitClient(): void {
        this.world.OnInitClient();
        PlayerManager.Get().input.onEquippedItemChanged.ConnectWithPriority(SignalPriority.HIGHEST, () => IslandManager.Get().world.client);
        this.isLoaded = true;
    }

    public OnInitServer(): void {
        Platform.Server.ServerManager.SetAccessMode(AirshipServerAccessMode.CLOSED);
        this.world.OnInitServer()
        this.isLoaded = true;
    }

    public OnPlayerJoinServer(player: Player): void {
        if (this.owner) {
            this.world.server.SendWorldToClient(player);
            if (player.userId in this.save.users) {
                this.users.push(player);
            } else {
                this.visitors.push(player);
            }
            this.SpawnPlayer(player);
            PlayerManager.Get().FinishPlayerLoad(player);
            return;
        };

        task.wait(1);

        // Load save
        const save = IslandSave.Get(PlayerManager.Get().GetPlayerData(player).save.activeProfileId, (save) => {
            save.owner = player.userId;
            return save;
        });

        if (!save) return player.Kick("Unable to load island!");
        this.save = save

        // Load World
        if (save.blocks === "") {
            this.world.server.LoadWorldFromSave(DefaultWorldSave.blocks, DefaultWorldSave.key);

            ItemManager.Get().GivePlayerItem(player, ItemManager.Get().GetItem("wood-pickaxe"), 1);
            ItemManager.Get().GivePlayerItem(player, ItemManager.Get().GetItem("wood-axe"), 1);

            PlayerManager.Get().NotifyPlayer(player, "Welcome to Industrio!", 10);
        } else {
            this.world.server.LoadWorldFromSave(save.blocks, save.blockKey);
            PlayerManager.Get().NotifyPlayer(player, "Welcome back to Industrio!", 10);
        }
        
        this.owner = player;
        this.users.push(player);
        this.SpawnPlayer(this.owner);

        PlayerManager.Get().FinishPlayerLoad(player);
    }

    public OnPlayerLeaveServer(player: Player): void {
        if (player.userId !== this.owner.userId) return;
        const save = this.world.server.GenerateWorldSave();
        this.save.blocks = save.blocks;
        this.save.blockKey = save.key;
        this.save.blockSaves = save.blockSaves;
        IslandSave.Set(PlayerManager.Get().GetPlayerData(player).save.activeProfileId, this.save);
        Platform.Server.ServerManager.ShutdownServer();
    }
    
    /**
     * Sends a player back to spawn.
     * 
     * @param player The player to send to spawn.
     */
    public SpawnPlayer(player: Player): void {
        player.character?.Teleport(this.world.server.GetSpawnLocation());
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public OnTickServer(dt: number): void {
        this.CheckPlayersForVoid();
        ItemManager.Get().GetItemsInGroup(Enum.ItemComponentGroup.WorldObject).forEach((item) => {
            const component = ItemManager.Get().GetItemComponentGroup(item, Enum.ItemComponentGroup.WorldObject);
            if (!component.UseData || !component.DoTick) return;
            keys(component.data).forEach((key) => {
                if (!component.data[key]) return;
                const obj = this.world.bin.GetObjects()[key];
                if (!obj) return;
                component.OnTick(obj);
            })
        })
    }
    
    public CheckPlayerAuthorization(player: Player): boolean {
        if (this.owner.userId === player.userId) return true;
        if (this.users.includes(player)) return true;
        return false;
    }

    /**
     * Sends all players located in the void back to spawn. 
     */
    private CheckPlayersForVoid(): void {
        Airship.Players.GetPlayers().forEach((player) => {
            if (player.character!.movement.GetPosition().y < GameManager.Get().config.maxIslandSize.div(-2).y) {
                this.SpawnPlayer(player);
            }
        });
    }

    protected FixedUpdate(): void {
        if (!this.isLoaded || !Game.IsClient()) return;
        const position = this.world.client.Raycast("Select") as Vector3 | undefined;
        if (!position) return PlayerManager.Get().SetTarget(undefined);
        PlayerManager.Get().SetTarget(this.world.bin.GetObjectByCollisionAt(position));
    }
}