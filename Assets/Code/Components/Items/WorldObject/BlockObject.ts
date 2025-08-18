import { Enum } from "Code/Enum";
import WorldObjectComponent from "./WorldObject";

@AirshipComponentMenu("Island/Items/World Objects/Block")
export default class BlockObjectComponent extends WorldObjectComponent {
    public itemType: Enum.ItemComponent = Enum.ItemComponent.BlockObject;
}