import { Enum } from "Code/Enum";
import WorldObjectComponent from "./WorldObject";
import { Placement } from "Code/IslandManager/World/Placement";
import IslandManager from "Code/IslandManager/IslandManager";
import { Game } from "@Easy/Core/Shared/Game";

@AirshipComponentMenu("Island/Items/World Objects/Crop")
export default class CropComponent extends WorldObjectComponent {
    public itemType: Enum.ItemComponent = Enum.ItemComponent.Crop;
    public seconds: number = 5;
    public nextObject: WorldObjectComponent;

    public data: { [posId: string]: number | undefined } = {}

    public OnLoad(placement: Placement.Data, data?: number): void {
        if (!Game.IsServer()) return;
        print(`Loaded Crop: ${placement.worldObject.displayName}`);
        if (!data) {
            this.data[placement.positionId] = DateTime.now().TimestampSeconds;
            return;
        }
        this.data[placement.positionId] = DateTime.now().TimestampSeconds - data;
    }

    public OnPlace(placement: Placement.Data): boolean {
        if (!Game.IsServer()) return true;
        print(`Placed Crop: ${placement.worldObject.displayName}`);
        const surface = IslandManager.Get().world.bin.GetObjectByCollisionAt(placement.position.add(new Vector3(0, -1, 0)));
        if (!(surface?.worldObject.name === "grass")) return false;
        this.data[placement.positionId] = DateTime.now().TimestampSeconds;
        return true;
    }

    public OnBreak(placement: Placement.Data): boolean {
        print(`Broke Crop: ${placement.worldObject.displayName}`);
        this.data[placement.positionId] = undefined;
        return true;
    }

    public OnSave(placement: Placement.Data): number {
        print(`Saved Crop: ${placement.worldObject.displayName}`);
        return DateTime.now().TimestampSeconds - this.data[placement.positionId]!;
    }

    public OnTick(placement: Placement.Data): void {
        if (!Game.IsServer()) return;
        print(`Ticking Crop: ${placement.worldObject.displayName} | ${this.data[placement.positionId]! + this.seconds} < ${this.seconds > DateTime.now().TimestampSeconds}`)
        if (this.data[placement.positionId]! + this.seconds > DateTime.now().TimestampSeconds) return;
        IslandManager.Get().world.server.SwapBlock(placement, this.nextObject);
    }
}