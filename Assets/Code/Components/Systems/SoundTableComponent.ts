@AirshipComponentMenu("Island/System/Sound Table")
export default class SoundTableComponent extends AirshipBehaviour {
    @Min(0) @Max(100)
    public chance: number = 100;
    public sounds: AudioSource[];
    public weights: number[];
}