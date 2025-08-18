import ToolComponent from "./ToolComponent";

export default abstract class WeaponComponent extends ToolComponent {
    @Spacing(10)
    @Header("Combat Details")
    public damagePerHit: number = 0;
    public minSecondsPerHit: number = 0.25;
    public criticalHitChance: number = 0.05;
}