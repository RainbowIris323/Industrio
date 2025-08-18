import { Enum } from "Code/Enum";
import ToolComponent from "./ToolComponent";

export enum BlockDamageCategory {
    None,
    Axe,
    Pickaxe,
}

@AirshipComponentMenu("Island/Items/Tools/Mining Tool")
export default class MiningToolComponent extends ToolComponent {
    @Spacing(10)
    @Header("Mining Details")
    public damageCategory: BlockDamageCategory = BlockDamageCategory.None;
    public damagePerHit: number = 0;
    public secondsPerHit: number = 0.5;
    
    public itemType: Enum.ItemComponent = Enum.ItemComponent.MiningTool;
}