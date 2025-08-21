import { Game } from "@Easy/Core/Shared/Game";
import AnimationConfig from "./AnimationConfig";
import PlayerManager from "Code/PlayerManager/PlayerContainer";

export default class AnimationManager extends AirshipSingleton {

    public animations: AnimationConfig;
    private isItemEquipped: boolean = false;

    public Init(animations: AnimationConfig): void {
        if (!Game.IsClient()) return;
        this.animations = animations;
    }

    public PlayCharacter(clip: AnimationClip): void {
        if (!PlayerManager.Get().isLoaded) return;
        Game.localPlayer.character?.animationHelper.PlayAnimation(clip, CharacterAnimationLayer.OVERRIDE_4, 0.1);
    }

    public PlayEquipItem(): void {
        if (this.isItemEquipped) return;
        this.isItemEquipped = true;
        this.PlayCharacter(this.animations.playerEquipItem);
    }

    public PlayUnequipItem(): void {
        if (!this.isItemEquipped) return;
        this.isItemEquipped = false;
        this.PlayCharacter(this.animations.playerUnequipItem);
    }

    public PlaySwingAxe(): void {
        this.PlayCharacter(this.animations.playerSwingAxe);
    }

    public PlaySwingPickaxe(): void {
        this.PlayCharacter(this.animations.playerSwingPickaxe);
    }
}