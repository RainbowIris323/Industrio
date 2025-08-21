import SoundManager from "./SoundManager";

@AirshipComponentMenu("Island/Core/Sound Config")
export default class SoundConfig extends AirshipBehaviour {
    @Spacing(10)
    @Header("Player Action")
    public pickaxeStrike: AudioClip[] = [];
    public axeStrike: AudioClip[] = [];
    public buy: AudioClip[] = [];
    public place: AudioClip[] = [];
    public warp: AudioClip[] = [];
    public dropItem: AudioClip[] = [];

    @Spacing(10)
    @Header("Player UI")
    public uiClick: AudioClip[] = [];
    public uiHoverChanged: AudioClip[] = [];
    
    @Spacing(10)
    @Header("Generic")
    public error: AudioClip[] = [];

    @Spacing(10)
    @Header("World Object")
    public fireLight: AudioClip[] = [];
    public fireBlast: AudioClip[] = [];
    public craftWorkbench: AudioClip[] = [];
    public craftAnvil: AudioClip[] = [];

    @Spacing(10)
    @Header("Ambient")
    public playerWorldAmbient: AudioClip[] = [];

    protected Awake(): void {
        SoundManager.Get().Init(this);
    }
}