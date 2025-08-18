import { Enum } from "Code/Enum";
import ToolComponent from "./ToolComponent";

@AirshipComponentMenu("Island/Items/Tools/Melee Weapon")
export default class MeleeWeaponComponent extends ToolComponent {
    @Spacing(10)
    @Header("Combat Details")
    public damagePerHit: number = 0;
    public minSecondsPerHit: number = 0.5;
    public criticalHitChance: number = 0.05;
    public itemType: Enum.ItemComponent = Enum.ItemComponent.MeleeWeapon;
}