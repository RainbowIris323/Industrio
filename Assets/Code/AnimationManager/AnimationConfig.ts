import AnimationManager from "./AnimationManager";

@AirshipComponentMenu("Island/Core/Animation Config")
export default class AnimationConfig extends AirshipBehaviour {
    public playerEquipItem: AnimationClip;
    public playerUnequipItem: AnimationClip;
    public playerSwingPickaxe: AnimationClip;
    public playerSwingAxe: AnimationClip;

    protected Awake(): void {
        AnimationManager.Get().Init(this);
    }
}