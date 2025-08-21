import { Game } from "@Easy/Core/Shared/Game";
import PlayerGUI from "./PlayerGUI";

export default class PlayerGUIComponent extends AirshipBehaviour {
    public itemViewportPrefab: GameObject;
    public recipeItemPrefab: GameObject;
    public notificationPrefab: GameObject;
    public playerPrefab: GameObject;
    public actionPrefab: GameObject;

    protected Awake(): void {
        if (!Game.IsClient()) return;
        PlayerGUI.Get().Setup(this);
    }
}