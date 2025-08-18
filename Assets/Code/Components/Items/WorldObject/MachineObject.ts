import { Enum } from "Code/Enum";
import WorldObjectComponent from "./WorldObject";

@AirshipComponentMenu("Island/Items/World Objects/Machine")
export default class MachineComponent extends WorldObjectComponent {
    public itemType: Enum.ItemComponent = Enum.ItemComponent.Machine;
}