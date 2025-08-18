import { Enum } from "Code/Enum";
import WorldObjectComponent from "./WorldObject";

@AirshipComponentMenu("Island/Items/World Objects/Crafting Table")
export default class CraftingTableComponent extends WorldObjectComponent {
    public itemType: Enum.ItemComponent = Enum.ItemComponent.CraftingTable;
}