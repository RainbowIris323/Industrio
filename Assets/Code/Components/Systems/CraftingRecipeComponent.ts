import ItemComponent from "../Items/ItemComponent";
import { CraftingRecipe } from "../Items/Types";
import CraftingTableComponent from "../Items/WorldObject/CraftingTableObject";
import LootTableComponent from "./LootTableComponent";

@AirshipComponentMenu("Island/System/Crafting Recipe")
export default class CraftingRecipeComponent extends AirshipBehaviour {
    public name: string = "";
    @NonSerialized()
    public primaryOutput: ItemComponent;

    public inputItems: ItemComponent[] = [];
    public inputQuantities: number[] = [];

    public staticOutputItems: ItemComponent[] = [];
    public staticOutputQuantities: number[] = [];
    public tableOutputs: LootTableComponent[] = [];

    public station: CraftingTableComponent;

    public static recipes: CraftingRecipe[] = [];

    protected Start(): void {
        const primaryItem = this.staticOutputItems.size() !== 0 ? this.staticOutputItems[0] : this.tableOutputs.size() !== 0 ? this.tableOutputs[0].item : undefined;
        if (!primaryItem) return warn(`Recipe on ${this.station.name} with name of ${this.gameObject.name} has no outputs`);
        this.name = this.name === "" ? primaryItem.displayName : this.name;
        this.staticOutputItems.forEach((item) => {
            if (!item.tags.includes(`Product (${this.station.displayName})`)) item.tags.push(`Product (${this.station.displayName})`);
        });
        this.tableOutputs.forEach((lootTable) => {
            if (!lootTable.item.tags.includes(`Product (${this.station.displayName})`)) lootTable.item.tags.push(`Product (${this.station.displayName})`);
        });

        this.primaryOutput = primaryItem;

        
        const recipe = {
            name: `${primaryItem.name}@${this.station.name}`,
            obj: this,
            inputs: [
                ...this.inputItems.map((item, i) => ({
                    item: item,
                    quantity: this.inputQuantities[i],
                })),
            ],
            outputs: [
                ...this.staticOutputItems.map((item, i) => ({
                    item: item,
                    quantity: this.staticOutputQuantities[i],
                })),
            ],
            chanceOutputs: [
                ...this.tableOutputs.map((lootTable) => ({
                    item: lootTable.item,
                    minimum: math.min(...lootTable.quantity),
                    maximum: math.max(...lootTable.quantity),
                    chances: lootTable.quantity.map((quantity, i) => ({
                        quantity: quantity,
                        weight: lootTable.weights[i],
                    }))
                })),
            ],
            primaryOutput: this.primaryOutput,
            station: this.station,
        }

        if (CraftingRecipeComponent.recipes.find(a => a.name === recipe.name)) {
            warn(`Duplicate recipe detected: ${recipe.name}`);
        }
        CraftingRecipeComponent.recipes.push(recipe);
    }
}