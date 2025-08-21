import ItemManager from "Code/ItemManager/ItemManager";
import { Player } from "@Easy/Core/Shared/Player/Player";
import IslandManager from "../IslandManager";
import GameManager from "Code/GameManager/GameManager";
import { World } from "./World";
import { MathUtil } from "@Easy/Core/Shared/Util/MathUtil";
import { Placement } from "./Placement";
import { Enum } from "Code/Enum";
import WorldObjectComponent from "Code/Components/Items/WorldObject/WorldObject";
import PlayerManager from "Code/PlayerManager/PlayerContainer";
import { keys } from "@Easy/Core/Shared/Util/ObjectUtils";
import { BlockDamageCategory } from "Code/Components/Items/Tools/MiningToolComponent";


export class ServerWorld {   
    private shared: World;

    public constructor(world: World) {
        this.shared = world;
        this.shared.events.Get("PlayerTryHitBlock").Server.Connect((player, position) => this.PlayerHitBlock(player, position));
        this.shared.events.Get("PlayerTryPlaceBlock").Server.Connect((player, placementData) => this.PlayerPlaceBlock(player, Placement.Data.receiveNet(placementData)));
    }

    public ServerDeleteBlock(data: Placement.Data): void {
        this.shared.bin.RemoveObject(data);
        this.shared.events.Get("ServerBrokeBlock").Server.SendToAllPlayers(data.position);
        if (data.worldObject.UseData) data.worldObject.OnBreak(data);
    }

    /**
     * Deletes a block at a given position.
     * 
     * @param position The blocks position.
     */
    public ServerDeleteBlockAt(position: Vector3): void {
        const data = this.shared.bin.RemoveObjectAt(position);
        if (data) this.shared.events.Get("ServerBrokeBlock").Server.SendToAllPlayers(data.position);
    }

    public LoadBlock(placementData: Placement.Data, data?: unknown): void {
        this.shared.events.Get("ServerPlacedBlock").Server.SendToAllPlayers(Placement.Data.sendNet(placementData));
        this.shared.bin.AddObject(placementData);
        if (placementData.worldObject.UseData) placementData.worldObject.OnLoad(placementData, data);
    }

    public PlaceBlock(placementData: Placement.Data, player?: Player): void {
        this.shared.events.Get("ServerPlacedBlock").Server.SendToAllPlayers(Placement.Data.sendNet(placementData));
        this.shared.bin.AddObject(placementData);
        if (placementData.worldObject.UseData) placementData.worldObject.OnPlace(placementData, player);
    }

    public SwapBlock(placementData: Placement.Data, object: WorldObjectComponent) {
        const newPlacementData = new Placement.Data(object, { position: placementData.position, rotation: placementData.rotation });
        const res = this.shared.bin.Verify(newPlacementData);
        if (!res.success) {
            for (let i = 0; i < res.collisions.size(); i++) {
                if (this.shared.bin.GetObjectByCollisionAt(res.collisions[i])?.positionId !== placementData.positionId) return;
            }
        }
        this.ServerDeleteBlock(placementData);
        this.PlaceBlock(newPlacementData);
    }

    /**
     * Place a block from by a player.
     */
    public PlayerPlaceBlock(player: Player, placementData?: Placement.Data): void {
        if (!placementData) return;
        if (!IslandManager.Get().CheckPlayerAuthorization(player)) return;
        const toolName = player.character?.heldItem?.itemType;
        if (!toolName) return;
        if (!this.shared.bin.Verify(placementData).success) return;
        if (!ItemManager.Get().TryTakePlayerItem(player, placementData.worldObject, 1)) return;
        this.shared.events.Get("PlayerPlacedBlock").Server.SendToAllPlayers(player, Placement.Data.sendNet(placementData));
        this.shared.bin.AddObject(placementData);
        if (placementData.worldObject.UseData) placementData.worldObject.OnPlace(placementData, player);
        this.shared.CheckSides(placementData, player, true);
    }

    public BreakBlock(player: Player, data: Placement.Data): number {
        data.worldObject.healthData[data.positionId] = undefined;
        this.shared.bin.RemoveObject(data);
        ItemManager.Get().GivePlayerBlockDrop(player, data.worldObject.name);
        this.shared.events.Get("PlayerBrokeBlock").Server.SendToAllPlayers(player, data.position);
        this.shared.CheckSides(data, player, false);
        if (data.worldObject.UseData) data.worldObject.OnBreak(data);
        return data.worldObject.healthData[data.positionId]!;
    }

    /**
     * Damages a block by a player.
     */
    public DamageBlock(player: Player, data: Placement.Data, damage: number, tool: BlockDamageCategory): number {
        if (!(data.positionId in data.worldObject.healthData)) {
            data.worldObject.healthData[data.positionId] = data.worldObject.health;
        }
        data.worldObject.healthData[data.positionId]! -= damage;

        this.shared.events.Get("PlayerHitBlock").Server.SendToAllPlayers(player, data.position, damage, data.worldObject.healthData[data.positionId]!, tool);
        if (data.worldObject.healthData[data.positionId]! > 0) return data.worldObject.healthData[data.positionId]!;
        data.worldObject.healthData[data.positionId] = undefined;
        return this.BreakBlock(player, data);
    }

    /**
     * Damages a block by a player using a tool.
     */
    public PlayerHitBlock(player: Player, position: Vector3): void {
        if (!IslandManager.Get().CheckPlayerAuthorization(player)) {
            PlayerManager.Get().NotifyPlayer(player, `You are not authorized`);
            return;
        }
        position = MathUtil.RoundVec(position);
        const data = this.shared.bin.GetObjectByCollisionAt(position);
        if (!data) return;
        if (!data.worldObject.breakable) {
            PlayerManager.Get().NotifyPlayer(player, `Object is indestructible`);
            return;
        }
        const toolName = player.character?.heldItem?.itemType;
        if (!toolName) return;
        const toolComponent = ItemManager.Get().TryGetItemComponent(toolName, Enum.ItemComponent.MiningTool);
        if (!toolComponent) return;
        const damageRatio = toolComponent.damageCategory === data.worldObject.damageCategory ? 1 : 0.25;
        if (this.shared.SetTimeout('HitBlock', player, toolComponent.secondsPerHit)) {
            PlayerManager.Get().NotifyPlayer(player, `You are swinging too fast O.o`);
            return;
        }
        this.DamageBlock(player, data, damageRatio * toolComponent.damagePerHit, toolComponent.damageCategory);
        return;
    }


    public GenerateWorldSave(): { blocks: string, blockSaves: string, key: { [id: number]: string } } {

        const list: string[] = [];
        const groupingData: {
            quantity: number,
            type: number,
            data: Placement.Data,
        } = {
            quantity: 1,
            type: 0,
            data: undefined!,
        }

        const CheckCanGroup = (data: Placement.Data): boolean => {
            if (groupingData.data.position !== data.position.add(new Vector3(0, 0, -1))) return false;
            if (groupingData.data.worldObject.name !== data.worldObject.name) return false;
            if (groupingData.data.rotation !== data.rotation) return false;
            if (groupingData.data.normal !== data.normal) return false;
            if (groupingData.data.quarter !== data.quarter) return false;
            if (groupingData.data.height !== data.height) return false;
            return true;
        }

        let blockCount = 0;

        const key = ItemManager.Get().GenerateBlockKey();

        const time = this.ExecPerBlock((data) => {
            if (data.worldObject.UseData) {
                data.worldObject.OnSave(data);
            }
            blockCount++;

            if (groupingData.data) {
                if (CheckCanGroup(data)) {
                    groupingData.data = data;
                    groupingData.quantity++;
                    return
                };
                list.push(
                    `${groupingData.type}:${groupingData.quantity}:${groupingData.data.position.x},${groupingData.data.position.y},${groupingData.data.position.z}:${groupingData.data.normal},${groupingData.data.rotation},${groupingData.data.height}`
                );
            }

            const blockId = key.save[data.worldObject.name];
            groupingData.type = blockId;
            groupingData.quantity = 1;
            groupingData.data = data;

        });

        list.push(
            `${groupingData.type}:${groupingData.quantity}:${groupingData.data.position.x},${groupingData.data.position.y},${groupingData.data.position.z}:${groupingData.data.normal},${groupingData.data.rotation},${groupingData.data.height}`
        );

        const save = list.join(";");

        PlayerManager.Get().NotifyAllPlayers(`Finished generating world save with ${blockCount} blocks in ${time} seconds`);

        return { blocks: save, blockSaves: "", key: key.load };
    }

    public ExecPerBlock(func: (data: Placement.Data) => void) {
        const objects = this.shared.bin.GetObjects();
        const objs = keys(objects).filter((k) => objects[k] !== undefined).map(k => objects[k]!);
        objs.sort((a, b) => {
            if (a.position.x !== b.position.x) return a.position.x < b.position.x;
            if (a.position.y !== b.position.y) return a.position.y < b.position.y;
            return a.position.z < b.position.z;
        }).forEach((obj) => func(obj));
    }

    public LoadWorldFromSave(save: string, key: { [id: number]: string } ) {

        this.ExecPerBlock((data) => {
            this.ServerDeleteBlock(data);
        });

        const groups = save.split(";");

        groups.forEach((group) => {
            const list = group.split(":");
            const id = tonumber(list[0])!;
            const name = key[id];
            const quantity = tonumber(list[1])!;
            const sPos = list[2].split(",");
            const sRot = list[3].split(",");
            const pos = new Vector3(tonumber(sPos[0])!, tonumber(sPos[1])!, tonumber(sPos[2])!);
            const block = ItemManager.Get().TryGetItemComponentGroup(name, Enum.ItemComponentGroup.WorldObject);
            if (!block) return;

            for (let z = 0; z < quantity; z++) {
                const data: Placement.Data = new Placement.Data(block, { position: pos.sub(new Vector3(0, 0, z)), normal: tonumber(sRot[0])!, rotation: tonumber(sRot[1])!, height: tonumber(sRot[2])! });
                this.LoadBlock(data);
            }
        })
    }

    public GetSpawnLocation(spawn: Vector3 = Vector3.zero): Vector3 {
        const hasNoBlocks: boolean[] = [];
        while (spawn.y < GameManager.Get().config.maxIslandSize.div(2).y + 2) {
            hasNoBlocks.push(!this.shared.bin.GetObjectByCollisionAt(spawn));
            spawn = spawn.add(new Vector3(0, 1, 0));
            if (hasNoBlocks[hasNoBlocks.size()] === false) continue;
            if (hasNoBlocks[hasNoBlocks.size() - 1] === false) continue;
            if (hasNoBlocks[hasNoBlocks.size() - 2] === false) continue;
            return spawn.sub(new Vector3(0.5, -1, 0.5));
        }
        spawn = spawn.sub(new Vector3(0.5, -1, 0.5));
        return spawn;
    }

    public SendWorldToClient(player: Player): void {
        this.shared.ExecPerBlock(GameManager.Get().config.maxIslandSize.div(2).mul(-1), GameManager.Get().config.maxIslandSize, (data) => {
            this.shared.events.Get("ServerPlacedBlock").Server.SendToPlayer(player, Placement.Data.sendNet(data));
        });
    }
}