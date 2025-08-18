import { Enum } from "Code/Enum";
import WorldObjectComponent from "./WorldObject";

@AirshipComponentMenu("Island/Items/World Objects/Crop")
export default class CropComponent extends WorldObjectComponent {
    public itemType: Enum.ItemComponent = Enum.ItemComponent.Crop;
}