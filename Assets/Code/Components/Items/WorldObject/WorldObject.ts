import LootTableComponent from "../../Systems/LootTableComponent";
import { BlockDamageCategory } from "../Tools/MiningToolComponent";
import ItemComponent from "../ItemComponent";
import { Enum } from "Code/Enum";

export default abstract class WorldObjectComponent extends ItemComponent {
    @Spacing(10)
    @Header("Object Details")
    public damageCategory: BlockDamageCategory = BlockDamageCategory.None;
    public health: number = 0;
    public breakable: boolean = true;
    public dropsSelf: boolean = true;
    public overrideDrop?: ItemComponent;
    public dropTables: LootTableComponent[];
    public allowAirPlace: boolean = false;
    public worldObject: GameObject;
    
    @NonSerialized()
    public healthData: { [posId: string]: number | undefined } = {};
    public occupancy: Vector3[] = []
    public size: Vector3 = new Vector3(1, 1, 1);
    public originPosition: Vector3 = new Vector3(0, 0, 0);
    public originRotation: Vector3 = new Vector3(0, 0, 0)
    public colliderType: Enum.Collider = Enum.Collider.Normal;
    public requireSupport: Enum.Normal[] = []
    public canRotate: boolean = false;
    public rotateForNormal: boolean = false;
    public canAdjustHeight: boolean = false;
    public canAdjustQuarter: boolean = false;
    public interaction: Enum.ObjectInteraction = Enum.ObjectInteraction.None;
    public menu: Enum.Menu = Enum.Menu.None;

    public itemGroup: Enum.ItemComponentGroup = Enum.ItemComponentGroup.WorldObject;
}