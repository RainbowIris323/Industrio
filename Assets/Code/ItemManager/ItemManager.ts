import { Player } from "@Easy/Core/Shared/Player/Player";
import { ItemStack } from "@Easy/Core/Shared/Inventory/ItemStack";
import ItemComponent from "Code/Components/Items/ItemComponent";
import LootTableComponent from "Code/Components/Systems/LootTableComponent";
import { Airship } from "@Easy/Core/Shared/Airship";
import { Enum } from "Code/Enum";
import WorldObjectComponent from "Code/Components/Items/WorldObject/WorldObject";
import { CraftingRecipe, ItemComponentConditional, ItemComponentGroupConditional } from "Code/Components/Items/Types";
import { Asset } from "@Easy/Core/Shared/Asset";
import { Game } from "@Easy/Core/Shared/Game";
import CraftingRecipeComponent from "Code/Components/Systems/CraftingRecipeComponent";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export default class ItemManager extends AirshipSingleton {
    private itemComponents: { [itemName: string]: ItemComponent } = {};
    private itemByComponentGroup: { [group: string]: string[] } = {};
    private itemByComponent: { [componentName: string]: string[] } = {};

    private rng = new Random();

    public playerCraft = new NetworkSignal<[recipeName: string, quantity: number]>("PlayerCraft");

    public Setup(): void {
        ItemComponent.components.forEach((item) => {
            ItemManager.Get().RegisterItem(item.gameObject);

            if (item.accessoryPath) Asset.LoadAsset(item.accessoryPath);
            if (item.iconPath) Asset.LoadAsset(item.iconPath);

            Airship.Inventory.RegisterItem(item.name, {
                displayName: item.displayName,
                maxStackSize: item.maxQuantity,
                accessoryPaths: item.accessoryPath !== "" ? [item.accessoryPath] : undefined,
                image: item.iconPath !== "" ? item.iconPath : undefined,
            });
        });

        if (Game.IsServer()) {
            this.playerCraft.server.OnClientEvent((player, recipeName, quantity) => {
                print("fired!");
                const recipe = CraftingRecipeComponent.recipes.find(a => recipeName === a.name);
                if (!recipe) return;
                this.Craft(player, quantity, recipe);
            })
        }
    }

    public RegisterItem(itemObject: GameObject): void {

        const component = itemObject.GetAirshipComponents<ItemComponent>()[0];
        if (!component) error(`The item object '${itemObject.name}' is missing a item component`);

        if (component.name in this.itemComponents) error(`The item '${component.name}' is already registered`);

        this.itemComponents[component.name] = component;

        if (!(component.itemGroup in this.itemByComponentGroup)) this.itemByComponentGroup[component.itemGroup] = [];
        this.itemByComponentGroup[component.itemGroup].push(component.name);

        if (!(component.itemType in this.itemByComponent)) this.itemByComponent[component.itemType] = [];
        this.itemByComponent[component.itemType].push(component.name);



        if (component.itemGroup === Enum.ItemComponentGroup.WorldObject) {
            const blockComponent = component as WorldObjectComponent;
            const startPos = Vector3.zero;
            const endPos = blockComponent.size;
            for (let x = startPos.x; x < endPos.x; x++) {
                for (let y = startPos.y; y < endPos.y; y++) {
                    for (let z = startPos.z; z < endPos.z; z++) {
                        const position = new Vector3(x, y, z);
                        if (blockComponent.occupancy.includes(position.add(blockComponent.originPosition))) continue;
                        blockComponent.occupancy.push(position.add(blockComponent.originPosition));
                    }
                }
            }
        }

        print(`Registered item: ${component.name}`);
    }

    public GetItemComponent<T extends Enum.ItemComponent>(name: string, itemType: T): ItemComponentConditional<T> {
        if (this.itemComponents[name].itemType !== itemType) error(`Item component type mismatch: ${this.itemComponents[name].itemType} !== ${itemType}`)
        return this.itemComponents[name] as ItemComponentConditional<T>;
    }

    public GetItemComponentGroup<T extends Enum.ItemComponentGroup>(name: string, groupType: T): ItemComponentGroupConditional<T> {
        if (this.itemComponents[name].itemGroup !== groupType) error(`Item component group type mismatch: ${this.itemComponents[name].itemGroup} !== ${groupType}`)
        return this.itemComponents[name] as ItemComponentGroupConditional<T>;
    }

    public GetItem(name: string): ItemComponent {
        return this.itemComponents[name];
    }

    public TryGetItem(name: string): ItemComponent | undefined {
        if (!(name in this.itemComponents)) return;
        return this.itemComponents[name];
    }

    public TryGetItemComponent<T extends Enum.ItemComponent>(name: string, itemType: T): ItemComponentConditional<T> | undefined {
        if (!(name in this.itemComponents)) return;
        if (this.itemComponents[name].itemType !== itemType) return undefined;
        return this.itemComponents[name] as ItemComponentConditional<T>;
    }

    public TryGetItemComponentGroup<T extends Enum.ItemComponentGroup>(name: string, groupType: T): ItemComponentGroupConditional<T> | undefined {
        if (!(name in this.itemComponents)) return;
        if (this.itemComponents[name].itemGroup !== groupType) return undefined;
        return this.itemComponents[name] as ItemComponentGroupConditional<T>;
    }

    public GetItemsInGroup(groupType: Enum.ItemComponentGroup): string[] {
        return this.itemByComponentGroup[groupType];
    }

    public GetItemsWithComponent(itemType: Enum.ItemComponent): string[] {
        return this.itemByComponent[itemType];
    }

    public GivePlayerBlockDrop(player: Player, itemName: string): void {
        if (!this.GetItemsInGroup(Enum.ItemComponentGroup.WorldObject).includes(itemName)) return warn(`Could not give player drop for '${itemName}'`);
        const component = this.GetItemComponentGroup(itemName, Enum.ItemComponentGroup.WorldObject);
        if (component.overrideDrop) {
            this.GivePlayerItem(player, component.overrideDrop.name, 1);
        }
        else {
            if (component.dropsSelf) this.GivePlayerItem(player, itemName, 1);
        }
        component.dropTables.forEach((lootTable) => this.GivePlayerLootTable(player, lootTable));
    }

    public GivePlayerLootTable(player: Player, lootTable: LootTableComponent) {
        const quantity = this.rng.PickItemWeighted(lootTable.quantity, lootTable.weights);
        this.GivePlayerItem(player, lootTable.item.name, quantity[0]);
    }

    public CanCraft(player: Player, recipe: CraftingRecipe): boolean {
        let success = true;
        recipe.inputs.forEach((data) => {
            if (!player.character!.inventory.HasEnough(data.item.name, data.quantity)) success = false;
        });
        return success;
    }

    public GetMaxCraft(player: Player, recipe: CraftingRecipe): number {
        let max = 1000;
        recipe.inputs.forEach((data) => {
            max = math.min(max, math.floor(player.character!.inventory.GetItemCount(data.item.name) / data.quantity));
        });
        return max;
    }

    public Craft(player: Player, quantity: number, recipe: CraftingRecipe): boolean {
        const max = this.GetMaxCraft(player, recipe);
        if (quantity > max) return false;
        let success = true;
        recipe.inputs.forEach((data) => {
            if (!player.character!.inventory.HasEnough(data.item.name, data.quantity * quantity)) success = false;
        });
        if (!success) return false;
        const itemsTaken: [string, number][] = [];
        recipe.inputs.forEach((data) => {
            if (this.TryTakePlayerItem(player, data.item.name, data.quantity * quantity)) {
                itemsTaken.push([data.item.name, data.quantity * quantity]);
            } else {
                success = false;
            }
        });
        if (!success) {
            itemsTaken.forEach((data) => {
                this.GivePlayerItem(player, data[0], data[1]);
            });
            return false;
        }
        
        recipe.outputs.forEach((data) => this.GivePlayerItem(player, data.item.name, data.quantity * quantity));

        recipe.chanceOutputs.forEach((data) => this.GivePlayerItem(player, data.item.name, this.rng.Int(data.minimum * quantity, data.maximum * quantity)));

        return true;
    }

    /**
     * Tries to take items from a players inventory.
     * 
     * @param player The player to take items from.
     * 
     * @param itemName The name of the item to take.
     * 
     * @param quantity The quantity of items to take.
     * 
     * @returns Items taken?
     */
    public TryTakePlayerItem(player: Player, itemName: string, quantity: number): boolean {
        if (!player.character?.inventory.HasEnough(itemName, quantity)) return false;
        player.character.inventory.Decrement(itemName.split(" ").join("-"), quantity);
        return true;
    }

    /**
     * Gives a player items.
     * 
     * @param player The player to give the items to.
     * 
     * @param item The item to give.
     * 
     * @param quantity The quantity of items to give.
     */
    public GivePlayerItem(player: Player, item: string, quantity: number): void {
        player.character!.inventory.AddItem(new ItemStack(item.split(" ").join("-"), quantity));
    }

    public GenerateBlockKey(): { load: { [id: number]: string }, save: { [name: string]: number }} {
        const save: { [name: string]: number } = {}
        const load: { [id: number]: string } = {}
        const blockComponents = this.itemByComponentGroup[Enum.ItemComponentGroup.WorldObject];
        blockComponents.forEach((blockComponent, index) => {
            load[index + 1] = blockComponent;
            save[blockComponent] = index + 1;
        });
        return { load: load, save: save }
    }
}