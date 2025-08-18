import { WaitFrame } from "@Easy/Core/Shared/Util/TimeUtil";
import { ServerWorld } from "./World/ServerWorld";
import { Placement } from "./World/Placement";
import BlockComponent from "Code/Components/Items/WorldObject/WorldObject";
import ItemManager from "Code/ItemManager/ItemManager";
import { Enum } from "Code/Enum";

export function PlaceArea(world: ServerWorld, block: BlockComponent, startPos: Vector3, size: Vector3) {
    for (let x = 0; x < size.x; x++) {
        for (let y = 0; y < size.y; y++) {
            for (let z = 0; z < size.z; z++) {
                world.LoadBlock(new Placement.Data(block, { position: new Vector3(x, y, z).add(startPos) }));
            }
        }
        WaitFrame();
    }
}

export function LoadDefaultIsland(world: ServerWorld) {
    const grass = ItemManager.Get().GetItemComponentGroup("grass", Enum.ItemComponentGroup.WorldObject);
    const stone = ItemManager.Get().GetItemComponentGroup("stone", Enum.ItemComponentGroup.WorldObject);
    const bedrock = ItemManager.Get().GetItemComponentGroup("bedrock", Enum.ItemComponentGroup.WorldObject);

    PlaceArea(world, grass, new Vector3(-5, 3, -5), new Vector3(11, 1, 11));
    PlaceArea(world, stone, new Vector3(-5, -1, -5), new Vector3(11, 4, 11));

    world.ServerDeleteBlockAt(new Vector3(0, 0, 0));
    world.LoadBlock(new Placement.Data(bedrock, { position: new Vector3(0, 0, 0) }));
}