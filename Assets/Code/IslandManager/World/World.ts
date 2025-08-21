import { ServerWorld } from "./ServerWorld";
import { ClientWorld } from "./ClientWorld";
import { WaitFrame } from "@Easy/Core/Shared/Util/TimeUtil";
import Nexus, { NexusTypes } from "@Vorlias/NexusNet/Framework";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { SetTimeout } from "@Easy/Core/Shared/Util/Timer";
import { Placement } from "./Placement";
import { Enum } from "Code/Enum";
import { ObjectSideBasedEvents } from "Code/Components/Items/ObjectSideBasedEvents";
import { Game } from "@Easy/Core/Shared/Game";

export class World {
    public server: ServerWorld;
    public client: ClientWorld;

    private timeouts: { [key: string]: { [user: string]: boolean } }  = {}

    public events = 
        Nexus.BuildObjectModel()
        .AddClient("PlayerTryPlaceBlock", Nexus.Event(Placement.netData))
        .AddClient("PlayerTryHitBlock", Nexus.Event(NexusTypes.Vector3))
        .AddServer("PlayerHitBlock", Nexus.Event(NexusTypes.Player, NexusTypes.Vector3, NexusTypes.Number, NexusTypes.Number, NexusTypes.Number))
        .AddServer("PlayerBrokeBlock", Nexus.Event(NexusTypes.Player, NexusTypes.Vector3))
        .AddServer("ServerBrokeBlock", Nexus.Event(NexusTypes.Vector3))
        .AddServer("PlayerPlacedBlock", Nexus.Event(NexusTypes.Player, Placement.netData))
        .AddServer("ServerPlacedBlock", Nexus.Event(Placement.netData))

        .Build();

    public blocks: { [name: string]: number } = {}

    public readonly bin: Placement.Bin = new Placement.Bin();

    public constructor() {

    }

    public OnInitClient(): void {
        this.client = new ClientWorld(this);
    }

    public OnInitServer(): void {
        this.server = new ServerWorld(this);
    }

    /**
     * Runs a function for every possible block location.
     * @param startPos The lowest values in the space.
     * @param endPos The highest values in the space.
     * @param func The function to run for each possible block position.
     * @returns The time it tool to process in ms.
     */
    public ExecPerBlock(startPos: Vector3, endPos: Vector3, func: (data: Placement.Data) => void) {
        const startTime = DateTime.now();
        for (let x = startPos.x; x < endPos.x; x++) {
            for (let y = startPos.y; y < endPos.y; y++) {
                for (let z = startPos.z; z < endPos.z; z++) {
                    print(x, y, z)
                    const pos = new Vector3(x, y, z);
                    const object = this.bin.GetObjectByBaseAt(pos);
                    if (object) func(object);
                }
                WaitFrame();
            }
            WaitFrame();
        }
        return DateTime.now().TimestampMilliseconds - startTime.TimestampMilliseconds
    }

    /**
     * Checks for a timeout and sets one if theres not
     * @param duration Time in seconds to timeout
     * @returns If false a timeout is already in effect
     */
    public SetTimeout(key: string, player: Player, duration: number): boolean {
        if (!(key in this.timeouts)) this.timeouts[key] = { };
        if (!(player.userId in this.timeouts[key])) this.timeouts[key][player.userId] = false;
        if (!this.timeouts[key][player.userId]) return false;
        this.timeouts[key][player.userId] = true;
        SetTimeout(duration, () => this.timeouts[key][player.userId] = false);
        return true;
    }

    private CheckSide(data: Placement.Data, side: Enum.Normal, player: Player, placed: boolean) {
        const obj = this.bin.GetObjectByCollisionAt(data.position.add(Enum.NormalToVector3(side).mul(-1)));
        if (!obj) return;
        const event = ObjectSideBasedEvents[obj.worldObject.name].find(event => event.side === side);
        if (!event) return;
        if (event.env === "Client" && Game.IsClient()) {
            event.event({ player: player, thisModel: this.client.models[obj.positionId], thisPlacementData: obj, newPlacementData: data, placed: placed });
            return;
        }
        if (event.env === "Server" && Game.IsServer()) {
            event.event({ player: player, thisPlacementData: obj, newPlacementData: data, placed: placed });
            return;
        }
    }

    public CheckSides(data: Placement.Data, player: Player, placed: boolean): void {
        for (let i = 0; i < 6; i++) {
            this.CheckSide(data, i + 1, player, placed);
        }
    }
}