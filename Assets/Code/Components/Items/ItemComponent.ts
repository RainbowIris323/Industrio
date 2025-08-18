import { Enum } from "Code/Enum";
import WorldObjectComponent from "./WorldObject/WorldObject";

export default abstract class ItemComponent extends AirshipBehaviour {

    @Spacing(10)
    @Header("Item Details")
    public name: string = "";

    public displayName: string = "";

    @Multiline(3)
    @TextArea()
    public description: string = "";

    @Min(1)
    public maxQuantity: number = 1000000;

    public accessoryPath: string = "";
    public iconPath: string = "";

    public tags: string[] = [];

    public itemModel: GameObject;

    public static components: ItemComponent[] = [];
    
    protected Awake(): void {
        if (this.name === "") this.name = this.gameObject.name;
        this.displayName = this.name;
        this.name = this.name.split(" ").join("-").lower();
        this.tags.push(this.itemType);
        this.tags.push(this.itemGroup);

        if (ItemComponent.components.find(item => item.name === this.name))
            return warn(`Tried to register ${this.name} twice`);

        if (this.itemGroup === Enum.ItemComponentGroup.WorldObject) {
            const worldObject = this as unknown as WorldObjectComponent;
            this.itemModel = worldObject.worldObject;
        }

        ItemComponent.components.push(this);
    }

    @NonSerialized()
    public itemGroup: Enum.ItemComponentGroup;

    @NonSerialized()
    public itemType: Enum.ItemComponent;
}