import { Airship } from "@Easy/Core/Shared/Airship";
import { Binding } from "@Easy/Core/Shared/Input/Binding";
import { Signal, SignalPriority } from "@Easy/Core/Shared/Util/Signal";
import ToolComponent from "Code/Components/Items/Tools/ToolComponent";
import { Enum } from "Code/Enum";
import GameManager from "Code/GameManager/GameManager";
import IslandManager from "Code/IslandManager/IslandManager";
import { Placement } from "Code/IslandManager/World/Placement";
import ItemManager from "Code/ItemManager/ItemManager";
import PlayerManager from "../PlayerManager";
import PlayerGUI from "Code/PlayerGUI/PlayerGUI";
import { Mouse } from "@Easy/Core/Shared/UserInput";

export class InputHandler {

    public onUse = new Signal();
    public onDrop = new Signal();
    public onInteract = new Signal();
    public onChangeView = new Signal();
    public onRotate = new Signal();

    public rotation = 1;
    public height = 0;

    public onEquippedItemChanged = new Signal<{ last: string | undefined, current: string | undefined }>();

    public heldItemName: string | undefined = undefined;

    public constructor() {
        // Input bindings
        Airship.Input.CreateAction("Use", Binding.MouseButton(MouseButton.LeftButton));
        Airship.Input.CreateAction("Drop", Binding.Key(Key.Q));
        Airship.Input.CreateAction("Interact", Binding.Key(Key.F));
        Airship.Input.CreateAction("Change View", Binding.Key(Key.F5));
        Airship.Input.CreateAction("Rotate", Binding.Key(Key.R));

        // Input connections
        Airship.Input.OnDown("Use").Connect(() => this.onUse.Fire());
        Airship.Input.OnDown("Drop").Connect(() => this.onDrop.Fire());
        Airship.Input.OnDown("Interact").Connect(() => this.onInteract.Fire());
        Airship.Input.OnDown("Change View").Connect(() => {this.onChangeView.Fire()});
        Airship.Input.OnDown("Rotate").Connect(() => this.onRotate.Fire());
    }

    public OnStartClient(): void {

        this.onChangeView.Connect(() => {
            Airship.Camera.ToggleFirstPerson();
            PlayerGUI.Get().CloseAllGUIs();
        });


        Airship.Inventory.ObserveLocalHeldItem((stack) => {

            const itemName = stack?.itemType;
            this.onEquippedItemChanged.Fire({last: this.heldItemName, current: itemName})
            this.heldItemName = itemName;


            if (!this.heldItemName) return;

            const blockComponent = ItemManager.Get().TryGetItemComponentGroup(this.heldItemName, Enum.ItemComponentGroup.WorldObject);
            const miningToolComponent = ItemManager.Get().TryGetItemComponent(this.heldItemName, Enum.ItemComponent.MiningTool);

            if (!IslandManager.Get().isLoaded) return;
            
            if (blockComponent || miningToolComponent) {
                let running = true;
                this.onEquippedItemChanged.Once(() => {
                    IslandManager.Get().world.client.ghost.Destroy();
                    running = false;
                });


                let tick: () => void;
                if (blockComponent) tick = IslandManager.Get().world.client.ActivateBlockPlacement(blockComponent);
                if (miningToolComponent) tick = IslandManager.Get().world.client.ActivateTargetGhost();

                const iTick = () => {
                    if (!running) return;
                    tick();
                    task.delay(GameManager.Get().config.ghostUpdateFrequency, () => iTick());
                }
                task.delay(GameManager.Get().config.ghostUpdateFrequency, () => iTick());
            }
        });

        this.onDrop.ConnectWithPriority(SignalPriority.HIGH, () => this.OnDrop());
        this.onUse.ConnectWithPriority(SignalPriority.HIGH, () => this.OnUse());
        this.onRotate.ConnectWithPriority(SignalPriority.HIGH, () => this.OnRotate());
        this.onInteract.ConnectWithPriority(SignalPriority.LOWEST, () => this.OnInteract());

        const lockers: (() => void)[] = [];

        PlayerGUI.Get().onMenuChanged.Connect((data) => {
            if (data.current === Enum.Menu.None) {
                lockers.forEach((locker) => locker());
                return;
            }
            lockers.push(Mouse.AddUnlocker());
        });

        Airship.Inventory.onInventoryOpened.ConnectWithPriority(SignalPriority.HIGHEST, () => {
            PlayerGUI.Get().CloseAllGUIs();
        })
    }

    public OnInteract(): void {
        const target = PlayerManager.Get().GetTarget();
        if (PlayerGUI.Get().GetMenu() !== Enum.Menu.None) PlayerGUI.Get().CloseAllGUIs();
        if (!target) return;
        if (target.worldObject.interaction === Enum.ObjectInteraction.OpenMenu) {
            PlayerGUI.Get().ActivateObjectGUI(target);
            return;
        }
    }

    public OnDrop(): void {
        if (!this.heldItemName) return;
        // const itemComponent = ItemManager.Get().GetItemComponent(this.heldItemName, ItemComponentType.None);
    }

    public OnUse(): void {
        if (PlayerGUI.Get().GetMenu() !== Enum.Menu.None) return;
        if (!this.heldItemName) return;
        const blockComponent = ItemManager.Get().TryGetItemComponentGroup(this.heldItemName, Enum.ItemComponentGroup.WorldObject);
        if (blockComponent) return this.OnBlockUse();
        const toolComponent = ItemManager.Get().TryGetItemComponentGroup(this.heldItemName, Enum.ItemComponentGroup.Tool);
        if (toolComponent) return this.OnToolUse(toolComponent);
    }

    private toolTickThread?: thread;

    public OnToolUse(toolComponent: ToolComponent): void {
        const miningToolComponent = ItemManager.Get().TryGetItemComponent(toolComponent.name, Enum.ItemComponent.MiningTool);
        const meleeWeaponComponent = ItemManager.Get().TryGetItemComponent(toolComponent.name, Enum.ItemComponent.MeleeWeapon);
        let timeout = 0.5;

        if (miningToolComponent) {
            timeout = miningToolComponent.secondsPerHit;
        } else if (meleeWeaponComponent) {
            timeout = meleeWeaponComponent.minSecondsPerHit;
        } else {
            return;
        }
        print("checking for existing tool tick")
        if (this.toolTickThread) return;
        print("starting tool tick")
        const tick = (() => {
            if (!this.toolTickThread) return;
            this.toolTickThread = task.delay(timeout, () => tick());
            if (miningToolComponent) { this.OnMiningToolActivated() }
            else if (meleeWeaponComponent) { this.OnMeleeWeaponActivated() }
            print("tool ticked")
        });
        this.toolTickThread = task.delay(timeout, () => tick());
        Airship.Input.OnUp("Use").Once(() => {
            print("tool tick canceled due to mouse up")
            if (!this.toolTickThread) return;
            task.cancel(this.toolTickThread);
            this.toolTickThread = undefined;
        });
        this.onEquippedItemChanged.Once(() => {
            print("tool tick canceled due to tool change")
            if (!this.toolTickThread) return;
            task.cancel(this.toolTickThread);
            this.toolTickThread = undefined;
        });
    }

    public OnMiningToolActivated(): void {
        if (!IslandManager.Get().isLoaded) return;
        const position = IslandManager.Get().world.client.Raycast("Select") as Vector3 | undefined;
        if (position === undefined) return;
        IslandManager.Get().world.events.Get("PlayerTryHitBlock").Client.SendToServer(position);
    }

    public OnMeleeWeaponActivated(): void {

    }

    public OnRotate(): void {
        if (!this.heldItemName) return;
        const blockComponent = ItemManager.Get().TryGetItemComponentGroup(this.heldItemName, Enum.ItemComponentGroup.WorldObject);
        if (!blockComponent) return;
        print(this.rotation);
        if (this.rotation === 4) { this.rotation = 1 }
        else { this.rotation += 1; }
    }

    public OnBlockUse(): void {
        if (!IslandManager.Get().isLoaded) return;
        const data = IslandManager.Get().world.client.data;
        if (!data) return;
        print(data.positionId);
        IslandManager.Get().world.events.Get("PlayerTryPlaceBlock").Client.SendToServer(Placement.Data.sendNet(data));
    }
}