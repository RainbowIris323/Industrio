import { Airship } from "@Easy/Core/Shared/Airship";
import GameManager from "./GameManager";
import { SaveCommand } from "./SaveWorldCommand";
import { Game } from "@Easy/Core/Shared/Game";
import StateContainer from "Code/StateContainer/StateContainer";
import { SetTimeout } from "@Easy/Core/Shared/Util/Timer";

@AirshipComponentMenu("Island/Core/GameConfig")
export default class GameManagerConfig extends AirshipBehaviour {

    @Header("Island Config")
    @Tooltip("The target number of seconds between each island tick.")
    public targetTickRate = 1;

    @Tooltip("The max number of blocks a player can have on there island.")
    public maxIslandBlocks: number = 1000;

    @Tooltip("Build boundary for the island")
    public maxIslandSize: Vector3 = new Vector3(600, 300, 600);
    public islandPositionOffset: Vector3 = new Vector3(0, 0, 0);

    @Tooltip("The number of blocks away the player can interact with")
    public playerInteractDistance: number = 8;

    public supportObjectsLayer: number = 30;
    public noSupportObjectsLayer: number = 29;
    public selectionRenderer: Renderer;
    public ghostRenderer: Renderer;
    public ghostUpdateFrequency: number;
    public airPlaceEnabled: boolean = true;
    public airPlaceRayYAngleOffset: number = -0.4;
    public toolAsset: GameObject;

    @Header("Datastore Config")
    public playerDatastorePrefix: string = "player";
    public islandDatastorePrefix: string = "island";
    public inventoryDatastorePrefix: string = "inventory";
    public useDevPrefix: boolean = false;
    public devPrefix: string = "-dev";

    protected Start(): void {
        GameManager.Get().Init(this);

        if (Game.IsServer()) Airship.Chat.RegisterCommand(new SaveCommand());

        const state = StateContainer.Get().CreateState({
            _id: "test-state",
            _sync: "ServerToClient",
            value1: 0,
            value2: "moo"
        });
        state.Connect("value1", (newValue, oldValue) => {
            print(`value1: ${oldValue} -> ${newValue}`);
        });
        state.Tick();
        if (Game.IsServer()) {
            state.Apply("value1", (v) => v + 1);
            state.Apply("value1", (v) => v + 1);
            state.Apply("value1", (v) => v + 1);
            state.Apply("value1", (v) => v + 1);
        }
        state.Tick();
        const tick = () => {
            if (Game.IsServer()) {
                state.Apply("value1", (v) => v + 1);
            }
            state.Tick();
            SetTimeout(1, () => tick());
        }
        tick();
    }
}