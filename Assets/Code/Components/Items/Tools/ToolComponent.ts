import { Enum } from "Code/Enum";
import ItemComponent from "../ItemComponent";

export default abstract class ToolComponent extends ItemComponent {
    public itemGroup: Enum.ItemComponentGroup = Enum.ItemComponentGroup.Tool;
}