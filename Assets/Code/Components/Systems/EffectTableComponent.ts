@AirshipComponentMenu("Island/System/Effect Table")
export default class EffectTableComponent extends AirshipBehaviour {
    @Min(0) @Max(100)
    public chance: number = 100;
    public effects: VisualEffect[];
    public weights: number[];
}