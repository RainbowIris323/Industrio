import ItemComponent from "../Items/ItemComponent";

@AirshipComponentMenu("Island/System/Loot Table")
export default class LootTableComponent extends AirshipBehaviour {
    public item: ItemComponent;
    public quantity: number[];
    public weights: number[];

    public frozen: readonly number[];

    protected Awake(): void {
        this.frozen = table.freeze(this.weights);
    }
}