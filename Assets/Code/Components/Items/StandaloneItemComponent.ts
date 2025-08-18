import { Enum } from "Code/Enum";
import ItemComponent from "./ItemComponent";

@AirshipComponentMenu("Island/Items/Item")
export default class StandaloneItemComponent extends ItemComponent {
    public itemGroup: Enum.ItemComponentGroup = Enum.ItemComponentGroup.None;
    public itemType: Enum.ItemComponent = Enum.ItemComponent.None;
}