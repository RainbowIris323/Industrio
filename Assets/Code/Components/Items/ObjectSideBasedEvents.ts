import { Player } from "@Easy/Core/Shared/Player/Player";
import { Enum } from "Code/Enum";
import IslandManager from "Code/IslandManager/IslandManager";
import { Placement } from "Code/IslandManager/World/Placement";
import ItemManager from "Code/ItemManager/ItemManager";

export const BottomSupport: SideBasedEvent = {
    side: Enum.Normal.Bottom,
    env: "Server",
    event: (args) => {
        if (args.placed) return;
        IslandManager.Get().world.server.BreakBlock(args.player, args.thisPlacementData);
    }
}

export type SideBasedEvent = {
    side: Enum.Normal,
    env: "Server" | "Client",
    event: (args: { player: Player, thisPlacementData: Placement.Data, thisModel?: GameObject, newPlacementData: Placement.Data | undefined, data?: unknown, placed: boolean }) => void,
}

export const ObjectSideBasedEvents: { [name: string]: SideBasedEvent[] } = {
    "grass": [
        {
            side: Enum.Normal.Top,
            env: "Server",
            event: (args) => {
                if (!args.placed) return;
                if (args.newPlacementData?.worldObject.colliderType === Enum.Collider.OccupancyOnly) return;
                IslandManager.Get().world.server.SwapBlock(args.thisPlacementData, ItemManager.Get().GetItemComponentGroup("dirt", Enum.ItemComponentGroup.WorldObject));
            }
        }
    ],
    "dirt": [
        {
            side: Enum.Normal.Top,
            env: "Server",
            event: (args) => {
                if (args.placed) return;
                IslandManager.Get().world.server.SwapBlock(args.thisPlacementData, ItemManager.Get().GetItemComponentGroup("grass", Enum.ItemComponentGroup.WorldObject));
            }
        }
    ],
    "soil": [
        {
            side: Enum.Normal.Top,
            env: "Server",
            event: (args) => {
                if (args.placed) return;
                IslandManager.Get().world.server.SwapBlock(args.thisPlacementData, ItemManager.Get().GetItemComponentGroup("grass", Enum.ItemComponentGroup.WorldObject));
            }
        }
    ]
}