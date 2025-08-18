import BlockComponent from "./WorldObject/WorldObject";
import ItemComponent from "./ItemComponent";
import StandaloneItemComponent from "./StandaloneItemComponent";
import MeleeWeaponComponent from "./Tools/MeleeWeaponComponent";
import MiningToolComponent from "./Tools/MiningToolComponent";
import ToolComponent from "./Tools/ToolComponent";
import { Enum } from "Code/Enum";
import WorldObjectComponent from "./WorldObject/WorldObject";
import CraftingRecipeComponent from "../Systems/CraftingRecipeComponent";

export type ItemComponentConditional<T extends Enum.ItemComponent> = 
    T extends Enum.ItemComponent.None ? StandaloneItemComponent :
    T extends Enum.ItemComponent.MeleeWeapon ? MeleeWeaponComponent :
    T extends Enum.ItemComponent.MiningTool ? MiningToolComponent :
    T extends Enum.ItemComponent.BlockObject ? BlockComponent :
    never

export type ItemComponentToGroupConditional<T extends Enum.ItemComponent> = 
    T extends Enum.ItemComponent.None ? StandaloneItemComponent :
    T extends Enum.ItemComponent.MeleeWeapon ? ToolComponent :
    T extends Enum.ItemComponent.MiningTool ? ToolComponent :
    never

export type ItemComponentGroupConditional<T extends Enum.ItemComponentGroup> = 
    T extends Enum.ItemComponentGroup.None ? ItemComponent :
    T extends Enum.ItemComponentGroup.Tool ? ToolComponent :
    T extends Enum.ItemComponentGroup.WorldObject ? WorldObjectComponent :
    never

export interface CraftingRecipe {
    name: string,
    obj: CraftingRecipeComponent,
    inputs: {
        item: ItemComponent,
        quantity: number,
    }[],
    outputs: {
        item: ItemComponent,
        quantity: number,
    }[],
    chanceOutputs: {
        item: ItemComponent,
        minimum: number,
        maximum: number,
        chances: {
            quantity: number,
            weight: number,
        }[],
    }[],
    primaryOutput: ItemComponent,
    station: CraftingTableComponent,
}