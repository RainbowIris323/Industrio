import PlayerGUIComponent from "./PlayerGUIComponent";
import PlayerManager from "Code/PlayerManager/PlayerContainer";
import { Airship } from "@Easy/Core/Shared/Airship";
import { Placement } from "Code/IslandManager/World/Placement";
import { Enum } from "Code/Enum";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import ItemComponent from "Code/Components/Items/ItemComponent";
import WorldObjectComponent from "Code/Components/Items/WorldObject/WorldObject";
import CraftingRecipeComponent from "Code/Components/Systems/CraftingRecipeComponent";
import { CanvasAPI } from "@Easy/Core/Shared/Util/CanvasAPI";
import ItemManager from "Code/ItemManager/ItemManager";
import { Game } from "@Easy/Core/Shared/Game";
import { SetTimeout } from "@Easy/Core/Shared/Util/Timer";

export default class PlayerGUI extends AirshipSingleton {
    public onWorldMenuUpdateNeeded = new Signal();
    public onMenuChanged = new Signal<{ last: Enum.Menu, current: Enum.Menu }>();
    private menu: Enum.Menu = Enum.Menu.None;
    public readonly GetMenu = () => this.menu;

    private SetMenu(menu: Enum.Menu): void {
        this.onMenuChanged.Fire({ last: this.menu, current: menu });
        this.menu = menu;
    }

    private config: PlayerGUIComponent;
    private root: Transform;
    private menus: {
        loadingScreen: GameObject,
        world: {
            root: Transform,
            crosshair: Image,
            targetInfo: {
                root: Transform,
                name: TextMeshProUGUI,
                health: TextMeshProUGUI,
                description: TextMeshProUGUI,
                tags: TextMeshProUGUI,
            },
            interactionInfo: {
                root: Transform,
                text: TextMeshProUGUI,
            }
        };
        primary: {
            root: Transform,
            notificationBin: Transform,
            menuButtons: {
                friends: GameObject,
                report: GameObject,
            },
            screens: {
                root: Transform,
                explore: {
                    root: Transform,
                    add: Button,
                    usernameInput: TMP_InputField,
                    playerList: Transform,
                },
                report: {
                    root: Transform,
                    submit: Button,
                    titleInput: TMP_InputField,
                    detailsInput: TMP_InputField,
                }
            }
        };
        object: {
            root: Transform,
            objectName: TextMeshProUGUI,
            componentName: TextMeshProUGUI,
            content: Transform,
            screens: {
                crafting: {
                    root: Transform,
                    recipeBin: Transform,
                },
                processing: {
                    root: Transform
                }
            },
            sidePanel: {
                root: Transform,
                title: TextMeshProUGUI,
                content: Transform,
                screens: {
                    recipe: {
                        root: Transform;
                        inputsBin: Transform;
                        outputsBin: Transform;
                        quantitySet: TMP_InputField,
                        quantityAdd: Button,
                        quantitySubtract: Button,
                        craft: Button,
                    }
                }
            }
        }
    };

    public Setup(gui: PlayerGUIComponent): void {
        this.config = gui;
        this.root = gui.gameObject.transform;
        this.menus = {
            loadingScreen: this.root.FindChild("LoadingScreen").gameObject,
            world: {
                root: this.root.FindChild("World"),
                crosshair: this.root.FindChild("World").FindChild("Crosshair").GetComponent<Image>(),
                targetInfo: {
                    root: this.root.FindChild("World").FindChild("TargetInfo"),
                    name: this.root.FindChild("World").FindChild("TargetInfo").FindChild("Name").GetComponent<TextMeshProUGUI>(),
                    health: this.root.FindChild("World").FindChild("TargetInfo").FindChild("Health").GetComponent<TextMeshProUGUI>(),
                    description: this.root.FindChild("World").FindChild("TargetInfo").FindChild("Description").GetComponent<TextMeshProUGUI>(),
                    tags: this.root.FindChild("World").FindChild("TargetInfo").FindChild("Tags").GetComponent<TextMeshProUGUI>(),
                },
                interactionInfo: {
                    root: this.root.FindChild("World").FindChild("InteractionInfo"),
                    text: this.root.FindChild("World").FindChild("InteractionInfo").FindChild("Text").GetComponent<TextMeshProUGUI>(),
                }
            },
            primary: {
                root: this.root.FindChild("Primary"),
                notificationBin: this.root.FindChild("Primary").FindChild("Notifications").FindChild("Viewport").FindChild("Content"),
                menuButtons: {
                    friends: this.root.FindChild("Primary").FindChild("MenuButtons").FindChild("Friends").gameObject,
                    report: this.root.FindChild("Primary").FindChild("MenuButtons").FindChild("Report").gameObject,
                },
                screens: {
                    root: this.root.FindChild("Primary").FindChild("Menu"),
                    explore: {
                        root: this.root.FindChild("Primary").FindChild("Menu").FindChild("Content").FindChild("Explore"),
                        add: this.root.FindChild("Primary").FindChild("Menu").FindChild("Content").FindChild("Explore").FindChild("SearchPlayer").FindChild("Add").GetComponent<Button>(),
                        usernameInput: this.root.FindChild("Primary").FindChild("Menu").FindChild("Content").FindChild("Explore").FindChild("SearchPlayer").FindChild("NameInput").GetComponent<TMP_InputField>(),
                        playerList: this.root.FindChild("Primary").FindChild("Menu").FindChild("Content").FindChild("Explore").FindChild("Players").FindChild("Viewport").FindChild("Content"),
                    },
                    report: {
                        root: this.root.FindChild("Primary").FindChild("Menu").FindChild("Content").FindChild("Report"),
                        submit: this.root.FindChild("Primary").FindChild("Menu").FindChild("Content").FindChild("Report").FindChild("TitleBar").FindChild("Submit").GetComponent<Button>(),
                        titleInput: this.root.FindChild("Primary").FindChild("Menu").FindChild("Content").FindChild("Report").FindChild("TitleBar").FindChild("NameInput").GetComponent<TMP_InputField>(),
                        detailsInput: this.root.FindChild("Primary").FindChild("Menu").FindChild("Content").FindChild("Report").FindChild("Details").FindChild("TextArea").GetComponent<TMP_InputField>(),
                    }
                },
            },
            object: {
                root: this.root.FindChild("Object"),
                objectName: this.root.FindChild("Object").FindChild("Menu").FindChild("ObjectName").FindChild("Text").GetComponent<TextMeshProUGUI>(),
                componentName: this.root.FindChild("Object").FindChild("Menu").FindChild("ComponentName").FindChild("Text").GetComponent<TextMeshProUGUI>(),
                content: this.root.FindChild("Object").FindChild("Menu").FindChild("Content"),
                screens: {
                    crafting: {
                        root: this.root.FindChild("Object").FindChild("Menu").FindChild("Content").FindChild("Crafting"),
                        recipeBin: this.root.FindChild("Object").FindChild("Menu").FindChild("Content").FindChild("Crafting").FindChild("Recipes").FindChild("Viewport").FindChild("Content"),
                    },
                    processing: {
                        root: this.root.FindChild("Object").FindChild("Menu").FindChild("Content").FindChild("Processing"),
                    }
                },
                sidePanel: {
                    root: this.root.FindChild("Object").FindChild("SidePanel"),
                    title: this.root.FindChild("Object").FindChild("SidePanel").FindChild("Title").FindChild("PanelName").GetComponent<TextMeshProUGUI>(),
                    content: this.root.FindChild("Object").FindChild("SidePanel").FindChild("Content"),
                    screens: {
                        recipe: {
                            root: this.root.FindChild("Object").FindChild("SidePanel").FindChild("Content").FindChild("Recipe"),
                            inputsBin: this.root.FindChild("Object").FindChild("SidePanel").FindChild("Content").FindChild("Recipe").FindChild("Inputs").FindChild("Content"),
                            outputsBin: this.root.FindChild("Object").FindChild("SidePanel").FindChild("Content").FindChild("Recipe").FindChild("Outputs").FindChild("Content"),
                            quantitySet: this.root.FindChild("Object").FindChild("SidePanel").FindChild("Content").FindChild("Recipe").FindChild("Functions").FindChild("Quantity").FindChild("Set").GetComponent<TMP_InputField>(),
                            quantityAdd: this.root.FindChild("Object").FindChild("SidePanel").FindChild("Content").FindChild("Recipe").FindChild("Functions").FindChild("Quantity").FindChild("Add").GetComponent<Button>(),
                            quantitySubtract: this.root.FindChild("Object").FindChild("SidePanel").FindChild("Content").FindChild("Recipe").FindChild("Functions").FindChild("Quantity").FindChild("Subtract").GetComponent<Button>(),
                            craft: this.root.FindChild("Object").FindChild("SidePanel").FindChild("Content").FindChild("Recipe").FindChild("Functions").FindChild("Craft").GetComponent<Button>(),
                        }
                    }
                }
            }
        }
        this.menus.loadingScreen.SetActive(true);
        PlayerManager.Get().signal.client.OnServerEvent((msg, timeToLive) => this.Notify(msg, timeToLive));
    }

    public Notify(msg: string, timeToLive: number): void {
        const notification = Instantiate(this.config.notificationPrefab, this.menus.primary.notificationBin);
        notification.transform.FindChild("Text").GetComponent<TextMeshProUGUI>().text = msg;
        SetTimeout(timeToLive, () => Destroy(notification));
    }

    public LoadPlayer(): void {
        this.menus.loadingScreen.SetActive(false);
        this.menus.primary.root.gameObject.SetActive(true);
        this.CloseAllGUIs();
    }

    public startWarp(): void {
        this.CloseAllGUIs();
        this.menus.primary.root.gameObject.SetActive(false);
        this.menus.world.root.gameObject.SetActive(false);
        this.menus.loadingScreen.SetActive(true);
    }

    private connections: (() => void)[] = [];
    private viewports: GameObject[] = [];
    private activatedViewport: { object: GameObject, onClose: () => void } | undefined = undefined;

    private ResetVisibility(): void {
        this.connections.forEach((conn) => conn());
        this.menus.primary.screens.explore.root.gameObject.SetActive(false);
        this.menus.primary.screens.report.root.gameObject.SetActive(false);
        this.menus.object.root.gameObject.SetActive(false);
        this.menus.world.root.gameObject.SetActive(false);
        this.menus.world.targetInfo.root.gameObject.SetActive(false);
        this.menus.world.interactionInfo.root.gameObject.SetActive(false);
        this.menus.object.sidePanel.root.gameObject.SetActive(false);
        this.menus.object.screens.crafting.root.gameObject.SetActive(false);
        this.menus.object.screens.processing.root.gameObject.SetActive(false);
        if (this.activatedViewport) {
            this.activatedViewport.onClose();
            this.activatedViewport = undefined;
        }
        this.viewports.forEach((obj) => Destroy(obj));
        this.viewports.clear();
    }

    public OpenPlayerList(): void {
        this.ResetVisibility();
    }

    public CloseAllGUIs(): void {
        this.ActivateWorldGUI();
    }

    public CreateItemViewport(parent: Transform, item: ItemComponent, onOpen: () => void, onClose: () => void): GameObject {
        const viewport = Instantiate(this.config.itemViewportPrefab, parent);
        viewport.transform.FindChild("ItemName").GetComponent<TextMeshProUGUI>().text = item.displayName;

        const renderTexture = new RenderTexture(256, 256, 24);
        renderTexture.Create();

        const viewportCamera = viewport.transform.FindChild("ViewportCamera").GetComponent<Camera>();
        viewportCamera.targetTexture = renderTexture;
        viewportCamera.farClipPlane = 10;
        viewportCamera.nearClipPlane = 0.1;

        const bin = viewport.transform.FindChild("ViewportCamera").FindChild("Bin");

        const model = Instantiate(item.itemModel, bin);
        model.SetLayerRecursive(28);

        if (item.itemGroup === Enum.ItemComponentGroup.WorldObject) {
            const worldObject = item as WorldObjectComponent;
            if (worldObject.size !== Vector3.one) {
                model.transform.localScale = Vector3.one.div(math.max(worldObject.size.x, worldObject.size.y, worldObject.size.z));
            }
        }

        viewport.transform.FindChild("ItemIcon").GetComponent<RawImage>().texture = renderTexture;

        const conn = CanvasAPI.OnClickEvent(viewport, () => {
            if (this.activatedViewport?.object === viewport) {
                this.activatedViewport.onClose();
                this.activatedViewport = undefined;
                return;
            }
            this.activatedViewport?.onClose();
            onOpen();
            this.activatedViewport = { object: viewport, onClose: () => onClose() }
        });
        this.connections.push(() => Bridge.DisconnectEvent(conn));

        this.viewports.push(viewport);
        return viewport;
    }

    public CreateRecipeItem(parent: Transform, item: ItemComponent, quantity: string): { name: string, object: GameObject, update: (quantity: string) => void } {
        const viewport = Instantiate(this.config.recipeItemPrefab, parent);
        viewport.transform.FindChild("Name").GetComponent<TextMeshProUGUI>().text = item.displayName;

        const renderTexture = new RenderTexture(256, 256, 24);
        renderTexture.Create();

        const viewportCamera = viewport.transform.FindChild("ViewportCamera").GetComponent<Camera>();
        viewportCamera.targetTexture = renderTexture;
        viewportCamera.farClipPlane = 10;
        viewportCamera.nearClipPlane = 0.1;

        const bin = viewport.transform.FindChild("ViewportCamera").FindChild("Bin");

        const model = Instantiate(item.itemModel, bin);
        model.SetLayerRecursive(28);

        if (item.itemGroup === Enum.ItemComponentGroup.WorldObject) {
            const worldObject = item as WorldObjectComponent;
            if (worldObject.size !== Vector3.one) {
                model.transform.localScale = Vector3.one.div(math.max(worldObject.size.x, worldObject.size.y, worldObject.size.z));
            }
        }

        viewport.transform.FindChild("ItemIcon").GetComponent<RawImage>().texture = renderTexture;

        this.viewports.push(viewport);

        const textLablel = viewport.transform.FindChild("Quantity").GetComponent<TextMeshProUGUI>();
        const update = (quantity: string) => textLablel.text =`${quantity}`;
        update(quantity);

        return { name: item.name, object: viewport, update: update }
    }

    public ActivateWorldGUI(): void {
        this.ResetVisibility();

        const update = (target: { last: Placement.Data | undefined, current: Placement.Data | undefined }) => {
            if (!target.current) {
                this.menus.world.targetInfo.root.gameObject.SetActive(false);
                this.menus.world.crosshair.color = new Color(0, 0, 0);
                this.menus.world.interactionInfo.root.gameObject.SetActive(false);
                return;
            }
            this.menus.world.crosshair.color = new Color(0.5, 0.5, 0.5);
            if (target.current.worldObject.interaction !== Enum.ObjectInteraction.None) {
                this.menus.world.interactionInfo.text.text = `${target.current.worldObject.interaction} (${Airship.Input.GetKeybindDisplay("Interact")})`;
                this.menus.world.interactionInfo.root.gameObject.SetActive(true);
            } else {
                this.menus.world.interactionInfo.root.gameObject.SetActive(false);
            }

            const health = target.current.positionId in target.current.worldObject.healthData ? target.current.worldObject.healthData[target.current.positionId] : target.current.worldObject.health;

            this.menus.world.targetInfo.name.text = `Name: ${target.current.worldObject.displayName}`;
            this.menus.world.targetInfo.health.text = `Health: ${health}/${target.current.worldObject.health}`;
            this.menus.world.targetInfo.description.text = `Description: ${target.current.worldObject.description}`;
            this.menus.world.targetInfo.tags.text = `Tags: ${target.current.worldObject.tags.join(", ")}`;

            this.menus.world.targetInfo.root.gameObject.SetActive(true);
        };

        this.connections.push(PlayerManager.Get().onTargetChanged.Connect((data) => update(data)));

        this.connections.push(this.onWorldMenuUpdateNeeded.Connect(() => update({ last: undefined, current: PlayerManager.Get().GetTarget() })));

        this.menus.world.root.gameObject.SetActive(true);
        this.SetMenu(Enum.Menu.None);
    }

    public ActivateCraftingObjectGUI(data: Placement.Data): void {
        const recipes = CraftingRecipeComponent.recipes.filter((recipe) => recipe.station === data.worldObject);
        const menuTransform = this.menus.object.root.FindChild("Menu").GetComponent<RectTransform>();
        const inputItems: { name: string, object: GameObject, update: (quantity: string) => void }[] = [];
        const outputItems: { name: string, object: GameObject, update: (quantity: string) => void }[] = [];
        const chanceOutputItems: { name: string, object: GameObject, update: (quantity: string) => void }[] = [];
        const conns: EngineEventConnection[] = [];
        recipes.forEach((recipe) => {
            this.CreateItemViewport(this.menus.object.screens.crafting.recipeBin, recipe.primaryOutput,
                () => {
                    let quantity = tonumber(this.menus.object.sidePanel.screens.recipe.quantitySet.text)!;
                    menuTransform.position = menuTransform.position.add(new Vector3(-200, 0, 0));

                    recipe.inputs.forEach((itemInput) => {
                        inputItems.push(this.CreateRecipeItem(this.menus.object.sidePanel.screens.recipe.inputsBin, itemInput.item, `${itemInput.quantity}`));
                    });

                    recipe.outputs.forEach((itemOutput) => {
                        outputItems.push(this.CreateRecipeItem(this.menus.object.sidePanel.screens.recipe.outputsBin, itemOutput.item, `${itemOutput.quantity}`));
                    });

                    recipe.chanceOutputs.forEach((itemOutput) => {
                        chanceOutputItems.push(this.CreateRecipeItem(this.menus.object.sidePanel.screens.recipe.outputsBin, itemOutput.item, `${itemOutput.minimum} - ${itemOutput.maximum}`));
                    });

                    const update = () => {
                        print(`Updating quantity: ${quantity}`);
                        this.menus.object.sidePanel.screens.recipe.quantitySet.text = `${quantity}`;
                        recipe.inputs.forEach((itemInput) => inputItems.find((data) => data.name === itemInput.item.name)?.update(`${quantity * itemInput.quantity}`));
                        recipe.outputs.forEach((itemOutput) => outputItems.find((data) => data.name === itemOutput.item.name)?.update(`${quantity * itemOutput.quantity}`));
                        recipe.chanceOutputs.forEach((chanceOutput) => chanceOutputItems.find((data) => data.name === chanceOutput.item.name)?.update(`${chanceOutput.minimum * quantity} - ${chanceOutput.maximum * quantity}`));
                    }

                    conns.push(CanvasAPI.OnClickEvent(this.menus.object.sidePanel.screens.recipe.quantityAdd.gameObject, () => {
                        quantity += 1;
                        const max = ItemManager.Get().GetMaxCraft(Game.localPlayer, recipe);
                        if (quantity > max) quantity = max;
                        update();
                    }));

                    conns.push(CanvasAPI.OnClickEvent(this.menus.object.sidePanel.screens.recipe.quantitySubtract.gameObject, () => {
                        quantity -= 1;
                        if (quantity < 1) quantity = 1;
                        update();
                    }));

                    conns.push(CanvasAPI.OnInputFieldSubmit(this.menus.object.sidePanel.screens.recipe.quantitySet.gameObject, (data) => {
                        const max = ItemManager.Get().GetMaxCraft(Game.localPlayer, recipe);
                        let set = tonumber(data);
                        if (!set) set = 1;
                        quantity = math.max(math.min(math.round(set), max), 1);
                        update();
                    }));

                    conns.push(CanvasAPI.OnClickEvent(this.menus.object.sidePanel.screens.recipe.craft.gameObject, () => {
                        const max = ItemManager.Get().GetMaxCraft(Game.localPlayer, recipe);
                        if (quantity > max) return print("low items");
                        print("Sending craft request to server");
                        print(recipe.name)
                        print(quantity)
                        ItemManager.Get().playerCraft.client.FireServer(recipe.name, quantity);
                    }));
                    

                    this.menus.object.sidePanel.title.text = recipe.primaryOutput.displayName;
                    this.menus.object.sidePanel.root.gameObject.SetActive(true);
                },
                () => {
                    conns.forEach((conn) => Bridge.DisconnectEvent(conn));
                    conns.clear();
                    menuTransform.position = menuTransform.position.add(new Vector3(200, 0, 0));
                    this.menus.object.sidePanel.root.gameObject.SetActive(false);
                    this.menus.object.sidePanel.screens.recipe.quantitySet.text = `${1}`;
                    inputItems.forEach((item) => Destroy(item.object));
                    inputItems.clear();
                    outputItems.forEach((item) => Destroy(item.object));
                    inputItems.clear();
                    chanceOutputItems.forEach((item) => Destroy(item.object));
                    chanceOutputItems.clear();
                }
            )
        });

        this.menus.object.screens.crafting.root.gameObject.SetActive(true);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public ActivateProcessingObjectGUI(data: Placement.Data): void {
        this.menus.object.screens.crafting.root.gameObject.SetActive(true);
    }

    public ActivateObjectGUI(data: Placement.Data): void {
        if (data.worldObject.menu === Enum.Menu.None) return;
        this.ResetVisibility();

        this.menus.object.objectName.text = data.worldObject.displayName;
        this.menus.object.componentName.text = data.worldObject.menu;

        switch (data.worldObject.menu) {
            case Enum.Menu.Crafting:
                this.ActivateCraftingObjectGUI(data);
                this.menus.object.screens.crafting.root.gameObject.SetActive(true);
                break;

            case Enum.Menu.Processing:
                this.ActivateProcessingObjectGUI(data);
                this.menus.object.screens.processing.root.gameObject.SetActive(true);
                break;
        
            default:
                break;
        }

        this.menus.object.root.gameObject.SetActive(true);
        this.SetMenu(data.worldObject.menu);
    }
}