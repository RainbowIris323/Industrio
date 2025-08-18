import { MathUtil } from "@Easy/Core/Shared/Util/MathUtil";
import { Airship } from "@Easy/Core/Shared/Airship";
import { World } from "./World";
import GameManager from "Code/GameManager/GameManager";
import { Player } from "@Easy/Core/Shared/Player/Player";
import PlayerManager from "Code/PlayerManager/PlayerManager";
import Ghost from "./Ghost";
import BlockComponent from "Code/Components/Items/WorldObject/WorldObject";
import { Placement } from "./Placement";
import { Enum } from "Code/Enum";
import PlayerGUI from "Code/PlayerGUI/PlayerGUI";

export class ClientWorld {
    public size: Vector3 = new Vector3(300, 150, 300);
    public voxel: VoxelWorld;
    private shared: World;
    public ghost: Ghost;

    private models: { [posId: string]: GameObject | undefined } = {}

    public constructor(world: World) {
        this.ghost = new Ghost();
        this.shared = world;
        this.voxel = GameManager.Get().config.gameObject.AddComponent<VoxelWorld>();
        this.voxel.voxelBlocks = GameManager.Get().config.blockList;
        GameManager.Get().config.blockDefinitionWorld.blockIdToScopeName.forEach((def) => {
            if (def.id === 0) return;
            const name = def.name.split(":")[1]
            this.shared.blocks[name] = def.id;
        })

        this.voxel.ReloadTextureAtlas();
        
        this.shared.events.Get("PlayerBrokeBlock").Client.Connect((player, position) => this.OnPlayerBrokeBlock(player, position));
        this.shared.events.Get("ServerBrokeBlock").Client.Connect((position) => this.OnServerBrokeBlock(position));

        this.shared.events.Get("PlayerPlacedBlock").Client.Connect((player, netData) => this.OnPlayerPlacedBlock(player, Placement.Data.receiveNet(netData)));
        this.shared.events.Get("ServerPlacedBlock").Client.Connect((netData) => this.OnServerPlacedBlock(Placement.Data.receiveNet(netData)));

        this.shared.events.Get("PlayerHitBlock").Client.Connect((player, position, damage, remainingHealth) => this.OnPlayerHitBlock(player, position, damage, remainingHealth));
    }

    public OnPlayerHitBlock(player: Player, position: Vector3, damage: number, remainingHealth: number) {
        const data = this.shared.bin.GetObjectByCollisionAt(position);
        if (!data) return;
        if (remainingHealth <= 0) {
            data.worldObject.healthData[data.positionId] = undefined;
        } else {
            data.worldObject.healthData[data.positionId] = remainingHealth;
        }

        if (data.positionId === PlayerManager.Get().GetTarget()?.positionId) PlayerGUI.Get().onWorldMenuUpdateNeeded.Fire();
    }
    
    public OnPlayerPlacedBlock(player: Player, data?: Placement.Data) {
        if (!data) return;
        print(data.positionId);
        this.SetBlock(data);
    }

    public OnServerPlacedBlock(data?: Placement.Data) {
        if (!data) return;
        this.SetBlock(data);
    }

    public SetBlock(data: Placement.Data): void {
        this.shared.bin.AddObject(data);
        const model = Instantiate(data.worldObject.worldObject!, GameManager.Get().config.gameObject.transform);
        Placement.Data.TransformModel(data, model);
        model.SetLayerRecursive(data.worldObject.colliderType === Enum.Collider.OccupancyOnly ? GameManager.Get().config.noSupportObjectsLayer : GameManager.Get().config.supportObjectsLayer);
        model.SetActive(true);
        this.models[data.positionId] = model;
    }

    public OnPlayerBrokeBlock(player: Player, position: Vector3): void {
        this.DeleteBlock(position);
    }

    public OnServerBrokeBlock(position: Vector3): void {
        this.DeleteBlock(position);
    }

    public DeleteBlock(position: Vector3): void {
        const data = this.shared.bin.GetObjectByCollisionAt(position);
        if (!data) return;
        if (this.models[data?.positionId]) Destroy(this.models[data.positionId]!);
        this.shared.bin.RemoveObject(data);
        return;
    }

    public data: Placement.Data | undefined = undefined;

    public ActivateTargetGhost() {
        this.ghost.Create({ color: new Color(0, 0, 0), renderer: GameManager.Get().config.selectionRenderer, size: new Vector3(1.05, 1.05, 1.05) });

        const Tick = () => {
            const position = this.Raycast("Select") as Vector3 | undefined;
            if (!position) {
                this.data = undefined;
                this.ghost.Update(false, undefined);
                return;
            }
            this.data = this.shared.bin.GetObjectByCollisionAt(position);
            this.ghost.Update(false, this.data);
        }

        return () => Tick();
    }

    public ActivateBlockPlacement(block: BlockComponent) {
        this.ghost.Create({ model: block.worldObject });

        const Tick = () => {
            this.data = this.Raycast("Place", block) as Placement.Data | undefined;
            this.ghost.Update(true, this.data);
        }

        return () => Tick();
    }
    
    public Raycast(mode: "Place" | "Select", block?: BlockComponent): Placement.Data | Vector3 | undefined {
        const ray = Airship.Camera.cameraSystem!.GetActiveCamera().ScreenPointToRay(Input.mousePosition);
        let layers = LayerMask.InvertMask(GameManager.Get().config.supportObjectsLayer | GameManager.Get().config.noSupportObjectsLayer);
        let raycastData: ReturnType<typeof Physics.Raycast>;

        if (mode === "Place") {
            if (block!.requireSupport) layers = LayerMask.InvertMask(GameManager.Get().config.supportObjectsLayer);

            raycastData = Physics.Raycast(ray.origin, ray.direction, GameManager.Get().config.playerInteractDistance, layers);

            const processPlace = (position: Vector3, normal: Vector3) => {
                return new Placement.Data(block!, { 
                    position: position, 
                    normal: block!.rotateForNormal ? Enum.NormalFromVector3(normal.mul(-1)) : undefined,
                    rotation: block!.canRotate ? PlayerManager.Get().input.rotation : undefined,
                    height: block!.canAdjustHeight ? Enum.Height.Default : undefined, // TODO: replace default with proper value
                    quarter: block!.canAdjustQuarter ? Enum.Quarter.Default : undefined, // TODO: replace default with proper value
                });
            }

            if (!raycastData[0] && GameManager.Get().config.airPlaceEnabled && block?.allowAirPlace) {
                raycastData = Physics.Raycast(ray.origin, new Vector3(ray.direction.x, ray.direction.y + GameManager.Get().config.airPlaceRayYAngleOffset, ray.direction.z), 3, layers);
                
                if (!raycastData[0]) return;
                const position = MathUtil.RoundVec(MathUtil.RoundVec(raycastData[1].add(new Vector3(ray.direction.x, -0.5, ray.direction.z))));
                return processPlace(position, raycastData[2]);
            }

            if (!raycastData[0]) return;
            const position = MathUtil.RoundVec(MathUtil.RoundVec(raycastData[1].add(raycastData[2].mul(0.5))));
            return processPlace(position, raycastData[2]);

        }
        raycastData = Physics.Raycast(ray.origin, ray.direction, GameManager.Get().config.playerInteractDistance, layers);
        if (!raycastData[0]) return;
        return MathUtil.RoundVec(MathUtil.RoundVec(raycastData[1].add(raycastData[2].mul(-0.5))));
    }
}