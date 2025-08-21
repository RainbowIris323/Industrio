import { Enum } from "Code/Enum";
import WorldObjectComponent from "./WorldObject";
import { Placement } from "Code/IslandManager/World/Placement";
import IslandManager from "Code/IslandManager/IslandManager";
import { Game } from "@Easy/Core/Shared/Game";

@AirshipComponentMenu("Island/Items/World Objects/Mining Stage")
export default class MiningStageComponent extends WorldObjectComponent {
    public itemType: Enum.ItemComponent = Enum.ItemComponent.MiningStage;
    public nextObject: WorldObjectComponent;

    public OnBreak(placement: Placement.Data): boolean {
        if (!Game.IsServer()) return true;
        IslandManager.Get().world.server.PlaceBlock(new Placement.Data(this.nextObject, {position: placement.position, normal: placement.normal, rotation: placement.rotation }))
        return true;
    }
}